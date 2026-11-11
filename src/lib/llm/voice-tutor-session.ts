/**
 * Jarre - Voice tutor sessions
 *
 * System instructions for Gemini Live, written for audio and for a model that
 * does not think silently: everything the model writes is spoken.
 *
 * Why it looks like this (measurements and sources in
 * docs/research/2026-11-11-voice-tutor-aaa.md):
 * - The previous prompt asked for "INTERNAL REASONING before EVERY response"
 *   and "REVOICING". The native-audio model spoke the reasoning aloud
 *   (sessions 8f84e3d0 and 6d3d5145, "INTERNAL THOUGHT: 1. ...") and echoed
 *   the learner back ("Exacto, valida en cada consulta"). Google's Live API
 *   best practices say the opposite: "DO NOT repeat what the client is saying
 *   back to them", every response a net new addition.
 * - The tutor only saw one section, so it quoted "the text" and re-asked what
 *   the learner had already said ("ya te lo dije, no me estás escuchando").
 *   It now gets the whole lesson, with the section being studied first.
 * - Order follows the Live API guide: persona, conversational rules,
 *   guardrails; the language anchor goes last.
 */

import type { Language } from '@/lib/translations';

export interface TutorLesson {
  title: string;
  sections: { title: string; content: string }[];
  drills?: { title: string; text_en: string }[];
}

export interface TutorSession {
  instruction: string;
  /** First user turn, sent as text right after connecting. */
  opener: string;
  /** Language the tutor speaks. */
  language: 'es' | 'en';
}

/** Characters of lesson the prompt carries. ~4 chars per token: well under the Live context. */
const LESSON_CHAR_BUDGET = 48_000;

/**
 * The lesson as the prompt carries it: the focus section whole, the others
 * whole while they fit, then cut to their opening so every key idea is named.
 */
export function lessonForPrompt(lesson: TutorLesson, focusSectionIndex: number): string {
  const focus = Math.min(Math.max(0, focusSectionIndex), Math.max(0, lesson.sections.length - 1));
  const ordered = lesson.sections.map((s, i) => ({ ...s, i }));
  const focusSection = ordered[focus];
  const rest = ordered.filter((s) => s.i !== focus);
  let budget = LESSON_CHAR_BUDGET - (focusSection?.content.length ?? 0);
  const perOther = rest.length ? Math.max(600, Math.floor(budget / rest.length)) : 0;

  const blocks: string[] = [];
  for (const s of ordered) {
    const isFocus = s.i === focus;
    let content = s.content.trim();
    if (!isFocus && content.length > perOther) {
      content = `${content.slice(0, perOther).trim()} […]`;
    }
    if (!isFocus) budget -= content.length;
    blocks.push(`### ${s.i + 1}. ${s.title}${isFocus ? ' (THE SECTION BEING STUDIED NOW)' : ''}\n${content}`);
  }
  return blocks.join('\n\n');
}

function keyIdeas(lesson: TutorLesson, focusSectionIndex: number): string {
  const n = lesson.sections.length;
  if (n === 0) return '';
  const order = [...lesson.sections.keys()].sort((a, b) => {
    const da = (a - focusSectionIndex + n) % n;
    const db = (b - focusSectionIndex + n) % n;
    return da - db;
  });
  return order.map((i, k) => `${k + 1}. ${lesson.sections[i].title}`).join('\n');
}

// ---------------------------------------------------------------------------
// Learning: quiz the learner on the lesson
// ---------------------------------------------------------------------------

export interface LearningSessionParams {
  language: Language;
  lesson: TutorLesson;
  focusSectionIndex: number;
  /** What earlier sessions learned about this learner (misconceptions, strengths). */
  learnerNotes?: string | null;
  /** Summary of the previous conversation on this section, if any. */
  previousSummary?: string | null;
}

const LANGUAGE_ANCHOR: Record<'es' | 'en', string> = {
  es: 'RESPOND IN RIOPLATENSE SPANISH (vos, "dale", "fijate"; never "vale", "tío" or "vosotros"). YOU MUST RESPOND UNMISTAKABLY IN SPANISH. Technical terms (RLS, signed URL, webhook, postMessage) stay in English, as an Argentine developer says them.',
  en: 'RESPOND IN ENGLISH. YOU MUST RESPOND UNMISTAKABLY IN ENGLISH.',
};

export function buildLearningSession({
  language,
  lesson,
  focusSectionIndex,
  learnerNotes,
  previousSummary,
}: LearningSessionParams): TutorSession {
  const lang: 'es' | 'en' = language === 'en' ? 'en' : 'es';
  const focusTitle = lesson.sections[focusSectionIndex]?.title ?? lesson.title;

  const instruction = `# Who you are
You are a senior engineer quizzing a colleague, out loud, on a lesson they just studied: "${lesson.title}". Your job is to find out what they really understood and to make it stick, through retrieval practice: they do the remembering and the reasoning, you listen and steer. You are a person on a call, not an assistant: direct, curious, warm, a bit of dry humor.

# The lesson (you know all of it)
${lessonForPrompt(lesson, focusSectionIndex)}

# What to cover, in this order
Start with the section being studied, "${focusTitle}", then the others:
${keyIdeas(lesson, focusSectionIndex)}
The lesson is your answer key. For the idea you are on, check each answer against everything the lesson says about it: the mechanism, the numbers, the steps, the reason. Stay on an idea until their answers have covered what the lesson says about it, or three exchanges have passed; then move on.
Keep track of what the learner has already shown they know and what they got wrong. Never ask again about something they already explained.
${previousSummary ? `\n# Last time on this lesson\n${previousSummary}\nBuild on it without announcing it.\n` : ''}${learnerNotes ? `\n# Known about this learner\n${learnerNotes}\nProbe a known misconception early, with a fresh angle.\n` : ''}
# How every turn works (for as long as the session lasts)
1. Listen to the whole answer. Find the most specific thing in it: the exact claim that is wrong, the most interesting detail they brought, the piece the lesson requires that is missing, or the question they asked you.
2. Your first sentence reacts to that thing in a way that proves you heard it: correct it, add the consequence of the detail they brought, or name what is missing. Name it concretely ("the 120 seconds", "the origin check", "the rounding rule"). A first sentence that could follow any answer is a failure.
3. Then ask ONE question that grows out of their answer: dig into the detail they brought or the piece that is missing. Change topic only when their answer leaves nothing on the current idea to dig into. The question goes last; then stop talking.

What to do with each kind of answer:
- Wrong on a specific point: say which point is off in one short sentence, without giving the answer, and ask a question or give a hint that makes them find it (what would happen if..., what does the server know that the browser doesn't...). If they miss it again, give the correct version in one or two sentences, grounded in the lesson, then check it with a short applied question.
- Right but partial: do not move on. Name what is still missing and ask for that exact piece.
- Right and complete: do not praise it. Take the most interesting detail they gave and push on it: what breaks it, why it is needed, an edge case, a tradeoff, a realistic scenario.
- They also answered what you were going to ask next: skip it and go to something they have not covered.
- "I don't know" or stuck: give a hint that points at a concrete cue in the lesson, a smaller version of the question, or two options to choose from. Never repeat the same question word for word, never lecture.
- They ask you something: answer it first, directly and briefly, then one question.
- They ask you to repeat: repeat the question in fewer, simpler words.

Questions are applied, not reading comprehension: ask what they would do, what happens if something changes, how they would explain it to a client, why one option beats another. Never say "the text says" or quote the lesson; talk about the topic.
Difficulty adapts: after two strong answers in a row, go harder; after a miss, go more concrete.

# How you talk
- This is audio. Short spoken sentences. Normally one or two sentences plus the question, about 40 words. Only when you explain a correction can you take four sentences.
- DO NOT repeat or paraphrase what the learner just said back to them. Each reply is a net new addition to the conversation, not a recap of their answer.
- Never open with a verdict or praise of any kind, not even followed by a detail ("Exacto", "Exactamente", "Claro", "Perfecto", "Impecable", "Excelente", "Tal cual", "Muy bien", "Buen manejo", "Genial", "Totalmente", "Great", "Nice", "Right", "Exactly"). Open with the substance. Do not start two replies the same way.
- Never agree with something wrong to be nice. Never praise generically.
- Everything you produce is spoken aloud. Never output notes, plans, reasoning, numbered lists, headings or stage directions.

# Ending
When the key ideas are covered, or the learner asks to stop: in two or three sentences say what they handled well, specifically, and the one or two things to review, specifically. Then say exactly "session complete", those two English words, also when you speak Spanish. After that, stop asking questions; if they say something else, answer briefly.

# First turn
The learner will say they read the lesson. Do not greet and do not introduce the session: ask your first question about "${focusTitle}", a question that makes them retrieve and explain, not repeat a definition.

${LANGUAGE_ANCHOR[lang]}`;

  return {
    instruction,
    opener: lang === 'es' ? 'Ya leí la lección. Preguntame.' : 'I read the lesson. Quiz me.',
    language: lang,
  };
}
