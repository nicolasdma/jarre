#!/usr/bin/env tsx
/**
 * Token size of the section tutor's system instruction, per focus section,
 * measured with Gemini's countTokens (free; gemini-3.8-live does not accept
 * it, so the tokenizer of gemini-3.8-flash, same family, as in
 * docs/tutor/02-arquitectura.md, appendix A).
 *
 *   npx tsx scripts/measure-tutor-instruction.ts [--resource 3y-health-tecnica-v2] [--brief-chars 2400]
 *
 * Reads the lesson from the LOCAL e2e stack (.env.e2e.local), never the hosted
 * project. Compares "one section" (what VoicePanel sent until 2026-11-18) with
 * the map + focus instruction.
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { buildLearningSession } from '../src/lib/llm/voice-tutor-session';

loadEnv({ path: '.env.local' });
const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const RESOURCE = arg('resource', '3y-health-tecnica-v2')!;
const BRIEF_CHARS = Number(arg('brief-chars', '0'));

async function main() {
  const env = Object.fromEntries(
    readFileSync('.env.e2e.local', 'utf8').split('\n').map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter((m): m is RegExpMatchArray => !!m).map((m) => [m[1], m[2]]),
  );
  if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(env.NEXT_PUBLIC_SUPABASE_URL ?? '')) throw new Error('not a local stack');
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY);
  const { data: resource } = await sb.from('resources').select('title').eq('id', RESOURCE).single();
  const { data: rows } = await sb.from('resource_sections').select('id, concept_id, section_title, content_markdown').eq('resource_id', RESOURCE).order('sort_order');
  const sections = (rows ?? []).map((r) => ({ id: r.id, conceptId: r.concept_id, title: r.section_title, content: r.content_markdown }));
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const count = async (text: string) =>
    (await ai.models.countTokens({ model: 'gemini-3.8-flash', contents: [{ role: 'user', parts: [{ text }] }] })).totalTokens ?? 0;
  const brief = BRIEF_CHARS ? '- '.padEnd(BRIEF_CHARS, 'x') : null;
  const out: { n: number; title: string; one: number; map: number; chars: number }[] = [];
  for (let i = 0; i < sections.length; i++) {
    const one = buildLearningSession({ language: 'es', lesson: { title: sections[i].title, sections: [sections[i]] }, focusSectionIndex: 0, bilingual: true });
    const map = buildLearningSession({ language: 'es', lesson: { title: resource?.title ?? RESOURCE, sections }, focusSectionIndex: i, bilingual: true, learnerBrief: brief });
    out.push({ n: i + 1, title: sections[i].title.slice(0, 40), one: await count(one.instruction), map: await count(map.instruction), chars: map.instruction.length });
  }
  console.table(out);
  const sorted = (k: 'one' | 'map') => out.map((o) => o[k]).sort((a, b) => a - b);
  for (const k of ['one', 'map'] as const) {
    const s = sorted(k);
    console.log(`${k}: min ${s[0]} median ${s[Math.floor(s.length / 2)]} max ${s[s.length - 1]}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
