/**
 * What the coding practice keeps in this browser (localStorage): the draft of
 * each exercise, which exercises passed every test, and the mock attempts
 * (transcript, final code, facts and report). Every read and write is guarded:
 * private windows and full storage just mean nothing is remembered.
 */

import type { CodingReport, CodingSessionFacts, ReportTranscriptLine } from '@/lib/coding/report';

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
