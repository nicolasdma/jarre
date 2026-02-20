/**
 * Jarre - Voice Practice Scoring Prompts
 *
 * DeepSeek scoring prompt for analyzing guided practice transcripts.
 * The Gemini Live system instruction is now in voice-unified-prompt.ts.
 */

import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface ConceptForPractice {
  name: string;
  definition: string;
}

interface VoicePracticeScoringParams {
  transcripts: Array<{ role: 'user' | 'model'; text: string }>;
  concepts: ConceptForPractice[];
  language: Language;
}

// ============================================================================
// DeepSeek Scoring Prompt — Analyze Practice Transcripts
// ============================================================================

export function buildVoicePracticeScoringPrompt({
  transcripts,
  concepts,
  language,
}: VoicePracticeScoringParams): string {
  const conceptList = concepts
    .map((c, i) => `${i}. "${c.name}": ${c.definition}`)
    .join('\n');

  const transcriptText = transcripts
    .map((t) => `[${t.role === 'user' ? 'STUDENT' : 'MENTOR'}]: ${t.text}`)
    .join('\n');

  return `You are an expert evaluator analyzing a GUIDED PRACTICE session transcript. Unlike a pure evaluation, the mentor actively helped the student — confirming answers, giving hints, and guiding recall. The session uses a Productive Failure approach: the student struggles first, then receives guidance.

CONCEPTS PRACTICED (indexed):
${conceptList}

TRANSCRIPT:
---
${transcriptText}
---

TASK: Score the student's understanding of each concept, accounting for the guidance they received.

For each concept (by index), evaluate:
- **neededHelp** (boolean): Did the mentor have to give significant hints or guide them to the answer? Minor confirmations don't count as "needing help."
- **understood** (boolean): By the end of the discussion on this concept, did the student demonstrate understanding (even if they needed initial help)?
- **misconceptions** (string[]): Specific misconceptions the student showed. Be precise — quote or paraphrase what they said wrong. Empty array if none.
- **strengths** (string[]): Specific things the student demonstrated well. Be precise — what did they explain correctly, what connections did they make? Empty array if none.
- **Accuracy**: Did they say anything factually wrong?
- **Depth**: Could they reason beyond surface-level with guidance?
- **Independence**: How much of the answer came from them vs. the mentor?

SCORING RULES:
- 0-30: Couldn't answer even with guidance, or said fundamentally wrong things
- 31-50: Needed heavy guidance, only surface-level understanding
- 51-70: Needed some guidance but showed understanding once prompted
- 71-85: Mostly independent, solid understanding, minor gaps
- 86-100: Independent, accurate, deep — barely needed the mentor

IMPORTANT DISTINCTION:
- A student who initially says "I'm not sure" but then gives a correct answer after a small hint should score HIGHER than one who confidently gives a wrong answer.
- neededHelp = true means the mentor had to provide substantial guidance (not just "what about X?")
- understood = true means the student eventually demonstrated comprehension
- During the Productive Failure phase, the student is EXPECTED to struggle. Do not penalize struggle during this phase — evaluate their understanding after consolidation.
- misconceptions should capture PERSISTENT errors (things still wrong after guidance), and INITIAL errors (things wrong before guidance but corrected). Label them clearly.
- strengths should capture genuine demonstrations of understanding, not just parroting what the mentor said.

RESPOND IN VALID JSON:
{
  "responses": [
    {
      "questionIndex": <concept index>,
      "isCorrect": <true if score >= 60>,
      "score": <0-100>,
      "feedback": "<${language === 'es' ? 'feedback en espanol' : 'feedback in English'}: what they knew, what they needed help with, what to study>",
      "neededHelp": <true if mentor had to significantly guide them>,
      "understood": <true if they demonstrated understanding by end>,
      "misconceptions": [<${language === 'es' ? 'lista de conceptos erroneos especificos en espanol' : 'list of specific misconceptions in English'}>],
      "strengths": [<${language === 'es' ? 'lista de fortalezas especificas en espanol' : 'list of specific strengths in English'}>]
    }
  ],
  "overallScore": <weighted average of all scores>,
  "summary": "<${language === 'es' ? 'resumen general en espanol' : 'overall summary in English'}: 2-3 sentences on readiness for evaluation>"
}

IMPORTANT:
- One entry per concept, in order (questionIndex 0, 1, 2, ...)
- Be fair. Guided practice is meant to help — don't penalize for using guidance, but do note it.
- The "feedback" must be specific and mention what to focus on before the evaluation.
- misconceptions and strengths arrays must contain specific, actionable items — not vague statements.`;
}
