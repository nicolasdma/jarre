/**
 * Jarre - Voice Evaluation Scoring Prompts
 *
 * DeepSeek scoring prompts for analyzing voice session transcripts.
 * The Gemini Live system instructions are now in voice-unified-prompt.ts.
 */

import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface ConceptForEval {
  name: string;
  definition: string;
}

interface VoiceScoringParams {
  transcripts: Array<{ role: 'user' | 'model'; text: string }>;
  concepts: ConceptForEval[];
  language: Language;
}

// ============================================================================
// DeepSeek Scoring Prompt — Analyze Transcripts
// ============================================================================

export function buildVoiceScoringPrompt({
  transcripts,
  concepts,
  language,
}: VoiceScoringParams): string {
  const conceptList = concepts
    .map((c, i) => `${i}. "${c.name}": ${c.definition}`)
    .join('\n');

  const transcriptText = transcripts
    .map((t) => `[${t.role === 'user' ? 'STUDENT' : 'EVALUATOR'}]: ${t.text}`)
    .join('\n');

  return `You are an expert evaluator analyzing an oral technical assessment transcript.

CONCEPTS EVALUATED (indexed):
${conceptList}

TRANSCRIPT:
---
${transcriptText}
---

TASK: Score the student's understanding of each concept based ONLY on what they said in the transcript.

For each concept (by index), evaluate:
- **Accuracy**: Did they say anything factually wrong?
- **Depth**: Did they go beyond surface-level? Could they reason about edge cases?
- **Completeness**: Did they cover the key aspects, or miss important parts?
- **Connections**: Could they relate this concept to others?
- **Misconceptions detected**: List any specific misconceptions or incorrect mental models revealed in their answers.
- **Escalation needed**: How much help (rephrasing, hints, additional angles) did the evaluator need to provide before the student could answer?

SCORING RULES:
- 0-30: Wrong or couldn't answer at all
- 31-50: Vague, mostly surface-level, significant gaps
- 51-70: Generally correct but lacks depth or misses important aspects
- 71-85: Solid understanding, can reason about it, minor gaps
- 86-100: Deep, accurate, can reason about edge cases and tradeoffs

If the student was NOT asked about a concept or barely touched it, score based on what's available. Don't infer knowledge they didn't demonstrate.

RESPOND IN VALID JSON:
{
  "responses": [
    {
      "questionIndex": <concept index>,
      "isCorrect": <true if score >= 60>,
      "score": <0-100>,
      "feedback": "<${language === 'es' ? 'feedback en español' : 'feedback in English'}: what they got right, what they missed, what to study>",
      "misconceptions": ["<${language === 'es' ? 'misconception específico detectado en español' : 'specific misconception detected in English'}>"],
      "strengths": ["<${language === 'es' ? 'fortaleza específica en español' : 'specific strength in English'}>"]
    }
  ],
  "overallScore": <weighted average of all scores>,
  "summary": "<${language === 'es' ? 'resumen general en español' : 'overall summary in English'}: 2-3 sentences on their overall performance>"
}

IMPORTANT:
- One entry per concept, in order (questionIndex 0, 1, 2, ...)
- Be fair but rigorous. Oral answers are naturally less structured than written ones — give credit for correct reasoning even if phrasing is rough.
- The "feedback" must be specific and actionable, not generic praise/criticism.
- "misconceptions" must list SPECIFIC incorrect beliefs or mental models, not vague statements. If none detected, use an empty array.
- "strengths" must list SPECIFIC things the student demonstrated well. If none notable, use an empty array.`;
}

// ============================================================================
// DeepSeek Scoring Prompt — Teaching Quality (Level 4)
// ============================================================================

export function buildVoiceTeachScoringPrompt({
  transcripts,
  concepts,
  language,
}: VoiceScoringParams): string {
  const conceptList = concepts
    .map((c, i) => `${i}. "${c.name}": ${c.definition}`)
    .join('\n');

  const transcriptText = transcripts
    .map((t) => `[${t.role === 'user' ? 'TEACHER' : 'STUDENT'}]: ${t.text}`)
    .join('\n');

  return `You are an expert evaluator analyzing a TEACHING session transcript. The student was teaching a concept to a confused junior engineer (AI).

CONCEPTS TAUGHT (indexed):
${conceptList}

TRANSCRIPT:
---
${transcriptText}
---

TASK: Score the TEACHER's ability to explain each concept based on what they said in the transcript.

For each concept (by index), evaluate:
- **Accuracy of explanations**: Did they explain it correctly?
- **Quality of analogies/examples**: Did they use good analogies or real-world examples?
- **Error detection**: When the "student" said something wrong, did the teacher catch and correct it?
- **Handling unexpected questions**: Could they answer the student's follow-up questions?
- **Connections**: Did they connect this concept to related ideas?
- **Misconceptions detected**: List any incorrect beliefs the teacher revealed while explaining (teaching often exposes gaps).
- **Escalation needed**: How much prompting did the "student" need to do to get a clear explanation?

SCORING RULES:
- 0-30: Couldn't explain or gave wrong explanations
- 31-50: Basic explanation but many gaps, missed errors from the student
- 51-70: Decent explanation but lacked depth, missed some student errors
- 71-85: Clear, accurate explanation, caught most errors, good examples
- 86-100: Excellent teaching — clear, accurate, great analogies, caught all errors, connected to bigger picture

RESPOND IN VALID JSON:
{
  "responses": [
    {
      "questionIndex": <concept index>,
      "isCorrect": <true if score >= 60>,
      "score": <0-100>,
      "feedback": "<${language === 'es' ? 'feedback en español' : 'feedback in English'}: teaching quality assessment>",
      "misconceptions": ["<${language === 'es' ? 'misconception específico detectado en español' : 'specific misconception detected in English'}>"],
      "strengths": ["<${language === 'es' ? 'fortaleza específica en español' : 'specific strength in English'}>"]
    }
  ],
  "overallScore": <weighted average of all scores>,
  "summary": "<${language === 'es' ? 'resumen en español' : 'summary in English'}: 2-3 sentences on teaching quality>"
}

IMPORTANT:
- One entry per concept, in order (questionIndex 0, 1, 2, ...)
- Teaching is harder than explaining to yourself. Give credit for effort but be rigorous about accuracy.
- The "feedback" must mention specific moments from the transcript.
- "misconceptions" must list SPECIFIC incorrect beliefs or mental models the teacher revealed, not vague statements. If none detected, use an empty array.
- "strengths" must list SPECIFIC teaching strengths demonstrated. If none notable, use an empty array.`;
}
