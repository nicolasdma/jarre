/**
 * Jarre - What the client saw during one voice session, without its text
 *
 * Counters, a timeline in ms since the mic click and the summed usageMetadata.
 * Sent with /api/voice/session/end and stored in voice_sessions.client_diag
 * (sanitized by session-diag.ts), so a session can be explained with one
 * query: did the mic capture, did any input transcription arrive, how long
 * from the click to the first audio, which socket closed with which code,
 * how many tokens each turn re-read. (docs/tutor/02-arquitectura.md §3.6)
 */

import type { LiveUsage } from '@/lib/voice/gemini-live';

/** Under MAX_DIAG_EVENTS (session-diag.ts), which is what the server keeps. */
const MAX_EVENTS = 300;

export type TimelineKind =
  | 'mic_click'
  | 'context_ready'
  | 'token_ready'
  | 'session_started'
  | 'socket_ready'
  | 'mic_capturing'
  | 'opener_sent'
  | 'first_audio'
  | 'input_first'
  | 'turn_complete'
  | 'interrupted'
  | 'tool_call'
  | 'notes_injected'
  | 'mute_nudge'
  | 'deaf_restart'
  | 'turn_start'
  | 'turn_end'
  | 'socket_close'
  | 'reconnect_wait'
  | 'reconnected'
  | 'reconnect_failed'
  | 'deaf_restart_failed'
  | 'mic_ended'
  | 'mic_muted'
  | 'mic_unmuted'
  | 'mic_context'
  | 'mic_no_signal'
  | 'mic_restarted'
  | 'mic_restart_failed'
  | 'page_hidden'
  | 'page_visible'
  | 'tempo'
  | 'error';

/**
 * What happens every turn. When the timeline is full the oldest of these
 * makes room: a thirty-minute session must still show the socket that closed
 * in minute 28, which is what the timeline is for.
 */
const ROUTINE: ReadonlySet<string> = new Set(['turn_complete', 'first_audio', 'input_first', 'turn_start', 'turn_end', 'notes_injected', 'interrupted']);

export interface SessionCounters {
  userFragments: number;
  modelFragments: number;
  audioChunksSent: number;
  stored: number;
  lastError: string;
}

export class SessionTimeline {
  readonly t0: number;
  readonly counters: SessionCounters = { userFragments: 0, modelFragments: 0, audioChunksSent: 0, stored: 0, lastError: '' };
  private events: Record<string, number | string | boolean>[] = [];
  private usage = { promptTokens: 0, promptText: 0, promptAudio: 0, responseTokens: 0, responseAudio: 0, reports: 0, maxPrompt: 0 };
  /** Facts about the setup (model, prompt version, instruction size). */
  readonly facts: Record<string, number | string | boolean> = {};
  private awaitingAudio: 'opener' | 'answer' | null = null;
  private userTurnOpen = false;
  private dropped = 0;

  constructor(now: number = performanceNow()) {
    this.t0 = now;
  }

  mark(k: TimelineKind, data: Record<string, number | string | boolean> = {}, now: number = performanceNow()): void {
    if (this.events.length >= MAX_EVENTS) {
      const routine = this.events.findIndex((e) => ROUTINE.has(String(e.k)));
      if (routine < 0 && ROUTINE.has(k)) return;
      this.events.splice(Math.max(0, routine), 1);
      this.dropped += 1;
    }
    this.events.push({ k, t: Math.round(now - this.t0), ...data });
  }

  /** The opener went out: the next audio is the tutor's first word. */
  openerSent(now?: number): void {
    this.mark('opener_sent', {}, now);
    this.awaitingAudio = 'opener';
  }

  /** A fragment of the learner's speech, transcribed. */
  userFragment(now?: number): void {
    this.counters.userFragments += 1;
    if (!this.userTurnOpen) {
      this.userTurnOpen = true;
      this.mark('input_first', {}, now);
    }
    this.awaitingAudio = 'answer';
  }

  audio(now?: number): void {
    if (!this.awaitingAudio) return;
    this.mark('first_audio', { after: this.awaitingAudio === 'opener' ? 'opener' : 'learner' }, now);
    this.awaitingAudio = null;
    this.userTurnOpen = false;
  }

  turnComplete(now?: number): void {
    this.mark('turn_complete', {}, now);
    this.userTurnOpen = false;
  }

  addUsage(u: LiveUsage): void {
    this.usage.promptTokens += u.promptTokens;
    this.usage.promptText += u.promptText;
    this.usage.promptAudio += u.promptAudio;
    this.usage.responseTokens += u.responseTokens;
    this.usage.responseAudio += u.responseAudio;
    this.usage.reports += 1;
    this.usage.maxPrompt = Math.max(this.usage.maxPrompt, u.promptTokens);
  }

  toDiag(endReason: string): Record<string, unknown> {
    return {
      ...this.counters,
      ...this.facts,
      endReason,
      ...(this.dropped ? { eventsDropped: this.dropped } : {}),
      events: this.events,
      usage: this.usage,
    };
  }
}

function performanceNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
