/**
 * Jarre - The talk that just ended, until its digest lands
 *
 * The digest of a session runs after it ends (DeepSeek, seconds). A session
 * opened right after, in this same page (another section, or "Ir a la
 * sección N"), would not know what was just said. The page keeps the last
 * lines of the last session per lesson for a few minutes, and the next
 * session carries them until the evidence of that session is in.
 */

export interface TalkLine {
  role: 'user' | 'model';
  text: string;
}

interface RecentTalk {
  sessionId: string;
  endedAt: number;
  lines: TalkLine[];
  sectionLabel: string;
}

const RECENT_MAX_AGE_MS = 15 * 60 * 1000;
export const RECENT_MAX_CHARS = 1200;

const byLesson = new Map<string, RecentTalk>();

export function rememberTalk(resourceId: string, talk: Omit<RecentTalk, 'endedAt'>, now: number = Date.now()): void {
  if (!talk.lines.some((l) => l.role === 'user')) return;
  byLesson.set(resourceId, { ...talk, endedAt: now });
}

/** The recent talk as a brief block, or null if there is none, it is old, or its digest is already in the evidence. */
export function recentTalkBlock(resourceId: string, digestedSessionIds: Set<string>, now: number = Date.now()): string | null {
  const talk = byLesson.get(resourceId);
  if (!talk || now - talk.endedAt > RECENT_MAX_AGE_MS || digestedSessionIds.has(talk.sessionId)) return null;
  const picked: string[] = [];
  let used = 0;
  for (let i = talk.lines.length - 1; i >= 0; i--) {
    const l = talk.lines[i];
    const line = `${l.role === 'user' ? 'LEARNER' : 'TUTOR'}: ${l.text.replace(/\s+/g, ' ').trim()}`;
    if (used + line.length > RECENT_MAX_CHARS) break;
    picked.unshift(line);
    used += line.length + 1;
  }
  if (!picked.length) return null;
  return `Just before this session, a few minutes ago, in ${talk.sectionLabel} (not in the notes above yet), the end of your talk:\n${picked.join('\n')}`;
}

/** Tests only. */
export function clearRecentTalk(): void {
  byLesson.clear();
}
