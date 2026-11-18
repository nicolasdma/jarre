/**
 * Jarre - The learner brief the section tutor opens with
 *
 * Built in the browser when the tutor connects, from one read of the learner's
 * evidence for this lesson (the context route), with no LLM in the path
 * (docs/tutor/02-arquitectura.md §3.3). Per lesson, not per section: what he
 * got wrong in Big-O reaches Two Sum, and "no quiero inglés ahora" said in one
 * section holds in the next.
 *
 * Order, most useful first, cut at BRIEF_MAX_CHARS (≈ 600 tokens):
 * 1. What is still wrong or open, with his words (unresolved first).
 * 2. What the tutor already asked in the focus section (never ask again:
 *    d14a09c0 re-asked a question answered seven minutes earlier).
 * 3. Preferences he stated.
 * 4. Errors corrected in an earlier session (to check they stuck).
 * 5. The state of the sections he touched.
 * 6. What he explained well.
 */

import type { EvidenceRow } from './evidence';
import { MASTERY_LABEL, masteryOf } from './mastery';

export const BRIEF_MAX_CHARS = 2000;

export interface BriefSection {
  n: number;
  id?: string;
  conceptId?: string;
  short: string;
}

export interface BriefInput {
  map: BriefSection[];
  /** 0-based index of the section being studied. */
  focusIndex: number;
  /** This learner's evidence for this lesson, any order. */
  evidence: EvidenceRow[];
  /** Preferences stated anywhere (they are about the person, not a lesson). */
  preferences?: EvidenceRow[];
  now?: number;
}

const MAX_OPEN = 8;
const MAX_ASKED = 8;
const MAX_PREFS = 4;
const MAX_FIXED = 4;
const MAX_STRENGTHS = 4;

function sectionOf(e: EvidenceRow, map: BriefSection[]): BriefSection | undefined {
  return (e.sectionId && map.find((s) => s.id === e.sectionId)) || (e.conceptId && map.find((s) => s.conceptId === e.conceptId)) || undefined;
}

function when(at: string, now: number): string {
  const days = Math.floor((now - Date.parse(at)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const said = (e: EvidenceRow) => (e.quote ? `said "${e.quote}"` : e.statement);

export function buildLearnerBrief({ map, focusIndex, evidence, preferences = [], now = Date.now() }: BriefInput): string | null {
  const focus = map[focusIndex];
  const byNewest = [...evidence].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const tag = (e: EvidenceRow) => {
    const s = sectionOf(e, map);
    return s ? `[${s.n}, ${s.short}, ${when(e.at, now)}]` : `[${when(e.at, now)}]`;
  };

  const open = byNewest
    .filter((e) => (e.kind === 'misconception' && e.resolved !== true) || e.kind === 'gap')
    .slice(0, MAX_OPEN)
    .map((e) => `- ${tag(e)} ${e.kind === 'gap' ? 'Did not know' : 'Wrong, not clearly fixed'}: ${said(e)}${e.quote && e.statement ? ` (${e.statement})` : ''}`);

  const asked = byNewest
    .filter((e) => e.kind === 'tutor_question' && focus && sectionOf(e, map)?.n === focus.n)
    .slice(0, MAX_ASKED)
    .map((e) => `- ${e.statement}${e.quote ? ` → he answered: "${e.quote}"` : ''}`);

  const prefSeen = new Set<string>();
  const prefs = [...byNewest.filter((e) => e.kind === 'preference'), ...[...preferences].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))]
    .filter((e) => {
      const key = e.statement.toLowerCase();
      if (prefSeen.has(key)) return false;
      prefSeen.add(key);
      return true;
    })
    .slice(0, MAX_PREFS)
    .map((e) => `- ${e.statement}${e.quote ? ` ("${e.quote}")` : ''}`);

  const fixed = byNewest
    .filter((e) => e.kind === 'misconception' && e.resolved === true)
    .slice(0, MAX_FIXED)
    .map((e) => `- ${tag(e)} ${said(e)}; it was corrected (${e.statement}). Check it stuck.`);

  const touched = map
    .map((s) => {
      const rows = evidence.filter((e) => sectionOf(e, map)?.n === s.n);
      return rows.length ? `${s.n} ${s.short}: ${MASTERY_LABEL[masteryOf(rows, now)]}` : null;
    })
    .filter((x): x is string => !!x);

  const strengths = byNewest
    .filter((e) => e.kind === 'explained' && e.verdict !== 'wrong')
    .slice(0, MAX_STRENGTHS)
    .map((e) => `- ${tag(e)} ${said(e)}`);

  const blocks: [string, string[]][] = [
    ['Still wrong or open (most recent first; correct these before anything else, once it fits):', open],
    [`Already asked in section ${focus?.n ?? ''} (do NOT ask these again):`, asked],
    ['How he wants to work (respect this):', prefs],
    ['Corrected in an earlier session:', fixed],
    ['Sections he has touched:', touched.length ? [`- ${touched.join(' · ')}`] : []],
    ['He explained well:', strengths],
  ];

  let out = '';
  for (const [title, lines] of blocks) {
    if (!lines.length) continue;
    let block = `${title}\n`;
    for (const line of lines) {
      if (out.length + block.length + line.length + 1 > BRIEF_MAX_CHARS) break;
      block += `${line}\n`;
    }
    if (block.includes('\n-')) out += `${block}\n`;
    if (out.length >= BRIEF_MAX_CHARS - 80) break;
  }
  return out.trim() || null;
}
