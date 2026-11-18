/**
 * Jarre - The section tutor's other sections, on demand, and its tools
 *
 * The instruction carries the lesson map and the focus section only
 * (lesson-map.ts). Another section's full text enters the conversation when it
 * is needed, once per connection, as context (sendClientContent with
 * turnComplete false: no generation, not billed until a turn reads it), the
 * pattern of the owner's landing ("knowledge on demand",
 * ~/Desktop/avatar-landing/src/lib/overviewLiveConversation.ts):
 *
 * - the learner names it ("¿y LRU?", "la sección cinco"): its notes go in when
 *   the tutor's turn ends, for the next turn (the map covers this one);
 * - the model asks for it: `get_section(n)`, blocking, answered from the
 *   lesson the page already has, in microseconds.
 *
 * `get_my_history(n)` answers from the evidence the context request already
 * brought. `go_to_section(n)` only shows a chip; the learner taps it to open the
 * section. No tool writes anything during the call: on gemini-3.8-live a call
 * in the middle of the voice ends the reply at that word (measured in the
 * landing), and the digest reads the whole transcript after.
 * (docs/tutor/02-arquitectura.md §3.2, §3.5)
 */

import type { FunctionCall, FunctionResponse, Tool } from '@google/genai';
import type { EvidenceRow } from './evidence';
import type { LessonMapEntry } from './lesson-map';

// String values of the SDK enums (the SDK loads lazily in the browser).
const OBJECT = 'OBJECT' as never;
const INTEGER = 'INTEGER' as never;
const STRING = 'STRING' as never;
const BLOCKING = 'BLOCKING' as never;
const NON_BLOCKING = 'NON_BLOCKING' as never;

/** Sections injected per connection before it should be rebuilt (each is ~2.4k tokens re-read every turn). */
export const MAX_INJECTED_PER_CONNECTION = 3;
/** Tool calls answered per reply; the third gets "answer now" (the landing saw chains of 157 without a cap). */
export const MAX_CALLS_PER_TURN = 2;
/** A reply that stays mute this long after a tool response gets one nudge to speak. */
export const MUTE_AFTER_TOOL_MS = 4000;

export const SECTION_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_section',
        description:
          'Returns the full text of one section of this lesson. Call it before your first word when you need the detail of a section other than the one being studied: to correct or explain something specific from it, or because the learner wants to work on it. Do not call it for the section being studied, or for a section whose notes are already in the conversation.',
        behavior: BLOCKING,
        parameters: {
          type: OBJECT,
          properties: { n: { type: INTEGER, description: 'Section number, as in the lesson map (1-based).' } },
          required: ['n'],
        },
      },
      {
        name: 'get_my_history',
        description:
          "Returns what this learner said, got wrong and was asked about one section in earlier sessions. Call it before your first word when the learner asks what they told you before, or before you correct something in a section they worked on earlier. At most once per section.",
        behavior: BLOCKING,
        parameters: {
          type: OBJECT,
          properties: { n: { type: INTEGER, description: 'Section number, as in the lesson map (1-based).' } },
          required: ['n'],
        },
      },
      {
        name: 'go_to_section',
        description:
          'Shows the learner a button to open a section of the lesson on screen. Call it, before your first word, when you suggest reviewing a section ("review"), when you point to where a later section covers something ("later"), or when the learner asks to go to a section ("learner_asked"). The learner decides whether to open it: keep talking normally.',
        behavior: NON_BLOCKING,
        parameters: {
          type: OBJECT,
          properties: {
            n: { type: INTEGER, description: 'Section number, as in the lesson map (1-based).' },
            reason: { type: STRING, enum: ['review', 'later', 'learner_asked'] },
          },
          required: ['n', 'reason'],
        },
      },
    ],
  },
];

export const SECTION_TOOLS_RULE = `# Your tools for the lesson
- get_section(n): the full text of section n. Use it before you speak when you need the detail of another section (to correct or explain something specific from it, or when the learner wants to work on it).
- get_my_history(n): what this learner said, got wrong and was asked in section n in earlier sessions.
- go_to_section(n, reason): shows the learner a button to open section n on screen. Use it when you suggest reviewing a section, point to where a later one covers something, or they ask to go there; then keep talking. Never say you are moving the screen: say the button is there if they want it.
Call tools only before the first word of a reply, never in the middle of it, and at most two per reply. Text headed "NOTES OF SECTION N" is for you: use it to answer, never read it aloud and never mention it.`;

export function sectionNotes(entry: Pick<LessonMapEntry, 'n' | 'title'>, content: string): string {
  return `### ${entry.n}. ${entry.title} (NOTES OF SECTION ${entry.n}, for answering; do not read them aloud)\n${content.trim()}`;
}

export interface SectionChip {
  n: number;
  short: string;
  reason: 'review' | 'later' | 'learner_asked';
}

export interface ToolOutcome {
  responses: FunctionResponse[];
  chip?: SectionChip;
  /** Section numbers whose notes went out in this answer. */
  injected: number[];
}

/**
 * Per-connection state of the on-demand notes and the tool calls. A new
 * connection (reconnect) starts a new one: its context has none of the notes.
 */
export class LessonOnDemand {
  private readonly injected = new Set<number>();
  private readonly pending = new Set<number>();
  private callsThisTurn = 0;

  constructor(
    private readonly map: LessonMapEntry[],
    private readonly contents: string[],
    private readonly focusIndex: number,
    private readonly history: () => EvidenceRow[],
  ) {
    this.injected.add(focusIndex + 1);
  }

  get injectedCount(): number {
    return this.injected.size - 1;
  }

  /** The learner named these sections: their notes go in when the tutor's turn ends. */
  learnerNamed(sections: number[]): void {
    for (const n of sections) if (!this.injected.has(n)) this.pending.add(n);
  }

  /** At the end of the tutor's turn: the notes to send as context now (at most the cap per connection). */
  takePendingNotes(): { n: number; text: string }[] {
    this.callsThisTurn = 0;
    const out: { n: number; text: string }[] = [];
    for (const n of this.pending) {
      this.pending.delete(n);
      if (this.injected.has(n) || this.injectedCount >= MAX_INJECTED_PER_CONNECTION) continue;
      const entry = this.map[n - 1];
      if (!entry) continue;
      this.injected.add(n);
      out.push({ n, text: sectionNotes(entry, this.contents[n - 1] ?? '') });
    }
    return out;
  }

  /** Answers the model's tool calls. */
  answer(calls: FunctionCall[]): ToolOutcome {
    const outcome: ToolOutcome = { responses: [], injected: [] };
    for (const call of calls) {
      this.callsThisTurn += 1;
      const reply = (response: Record<string, unknown>) =>
        outcome.responses.push({ id: call.id, name: call.name, response });
      if (this.callsThisTurn > MAX_CALLS_PER_TURN) {
        reply({ error: 'answer now', note: 'No more tools in this reply: answer the learner now, out loud.' });
        continue;
      }
      const n = Number((call.args as Record<string, unknown> | undefined)?.n);
      const entry = Number.isInteger(n) ? this.map[n - 1] : undefined;
      if (!entry) {
        reply({ error: 'no such section', sections: this.map.length });
        continue;
      }
      switch (call.name) {
        case 'get_section': {
          if (this.injected.has(n)) {
            reply({ n, title: entry.title, already_in_context: true });
            break;
          }
          if (this.injectedCount >= MAX_INJECTED_PER_CONNECTION) {
            reply({ n, title: entry.title, key_idea: entry.idea, note: 'Too many sections open in this call: answer from the map.' });
            break;
          }
          this.injected.add(n);
          this.pending.delete(n);
          outcome.injected.push(n);
          reply({ n, title: entry.title, notes: sectionNotes(entry, this.contents[n - 1] ?? '') });
          break;
        }
        case 'get_my_history': {
          const rows = this.history().filter(
            (e) => (e.sectionId && e.sectionId === entry.id) || (!e.sectionId && e.conceptId && e.conceptId === entry.conceptId),
          );
          reply({
            n,
            title: entry.title,
            earlier_sessions: rows.slice(0, 8).map((e) => ({
              kind: e.kind,
              said: e.quote,
              fact: e.statement,
              ...(e.kind === 'misconception' ? { corrected: e.resolved === true } : {}),
              when: e.at.slice(0, 10),
            })),
            ...(rows.length === 0 ? { note: 'Nothing recorded for this section: do not invent anything.' } : {}),
          });
          break;
        }
        case 'go_to_section': {
          const raw = String((call.args as Record<string, unknown> | undefined)?.reason ?? 'review');
          const reason = raw === 'later' || raw === 'learner_asked' ? raw : 'review';
          outcome.chip = { n, short: entry.short, reason };
          reply({ ok: true, shown: `A button "Ir a la sección ${n}" is on the learner's screen.` });
          break;
        }
        default:
          reply({ error: `unknown tool ${call.name ?? ''}` });
      }
    }
    return outcome;
  }
}
