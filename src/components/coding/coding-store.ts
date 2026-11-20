/**
 * What the coding practice keeps in this browser (localStorage): the draft of
 * each exercise, which exercises passed every test, and the mock attempts
 * (transcript, final code, facts and report), and the complexity checks
 * answered, and the pad's language and autocomplete. Every read and write is guarded:
 * private windows and full storage just mean nothing is remembered.
 */

import type { CodingReport, CodingSessionFacts, ReportTranscriptLine } from '@/lib/coding/report';
import { isCodeLanguage, type CodeLanguage } from '@/lib/coding/languages';

const key = (kind: string, resourceId: string, id?: string) => `jarre.coding.${kind}.${resourceId}${id ? `.${id}` : ''}`;

function read<T>(k: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(k: string, value: unknown): void {
  try {
    window.localStorage.setItem(k, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the practice still works, it just is not remembered.
  }
}

export function loadDraft(resourceId: string, id: string): string | null {
  return read<string | null>(key('draft', resourceId, id), null);
}

export function saveDraft(resourceId: string, id: string, code: string): void {
  write(key('draft', resourceId, id), code);
}

export function clearDraft(resourceId: string, id: string): void {
  try {
    window.localStorage.removeItem(key('draft', resourceId, id));
  } catch {
    // ignore
  }
}

export function loadSolved(resourceId: string): Record<string, string> {
  return read<Record<string, string>>(key('solved', resourceId), {});
}

export function markSolved(resourceId: string, exerciseId: string): Record<string, string> {
  const solved = { ...loadSolved(resourceId), [exerciseId]: new Date().toISOString() };
  write(key('solved', resourceId), solved);
  return solved;
}

export interface MockAttempt {
  id: string;
  problemId: string;
  startedAt: string;
  minutes: number;
  transcript: ReportTranscriptLine[];
  finalCode: string;
  facts: CodingSessionFacts;
  report: CodingReport | null;
}

const ATTEMPTS_MAX = 15;

export function loadAttempts(resourceId: string): MockAttempt[] {
  return read<MockAttempt[]>(key('attempts', resourceId), []);
}

export function saveAttempt(resourceId: string, attempt: MockAttempt): MockAttempt[] {
  const others = loadAttempts(resourceId).filter((a) => a.id !== attempt.id);
  const next = [attempt, ...others].slice(0, ATTEMPTS_MAX);
  write(key('attempts', resourceId), next);
  return next;
}

/** A complexity check answered: what was picked and whether each part was right. */
export interface ComplexityResult {
  picked: { time?: string; space?: string; brute?: string };
  right: { time: boolean; space: boolean; brute?: boolean };
  at: string;
}

export function loadComplexity(resourceId: string): Record<string, ComplexityResult> {
  return read<Record<string, ComplexityResult>>(key('complexity', resourceId), {});
}

export function saveComplexity(resourceId: string, checkId: string, result: ComplexityResult): Record<string, ComplexityResult> {
  const all = { ...loadComplexity(resourceId), [checkId]: result };
  write(key('complexity', resourceId), all);
  return all;
}

/** The pad's settings, the same in every lesson: the language picked and whether autocomplete is on (off by default, as in the interview). */
export interface PadPrefs {
  language: CodeLanguage;
  autocomplete: boolean;
}

const PAD_KEY = 'jarre.coding.pad';

export function loadPadPrefs(): PadPrefs {
  const raw = read<Partial<PadPrefs>>(PAD_KEY, {});
  return {
    language: isCodeLanguage(raw.language) ? raw.language : 'typescript',
    autocomplete: raw.autocomplete === true,
  };
}

export function savePadPrefs(prefs: PadPrefs): void {
  write(PAD_KEY, prefs);
}
