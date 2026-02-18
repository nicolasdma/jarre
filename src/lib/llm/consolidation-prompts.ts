/**
 * Jarre - Consolidation Prompts
 *
 * Generates post-evaluation consolidation content using DeepSeek.
 * Transforms evaluation from a binary test into a complete
 * Productive Failure cycle (Kapur 2016).
 *
 * For each concept: ideal answer, where reasoning diverged,
 * connections to other concepts, and what to review.
 */

import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface ConceptScore {
  conceptName: string;
  conceptDefinition: string;
  score: number;
  feedback: string;
  misconceptions: string[];
}

interface ConsolidationPromptParams {
  transcript: string;
  conceptScores: ConceptScore[];
  language: Language;
}

// ============================================================================
// Main
// ============================================================================

/**
 * Build the prompt for DeepSeek to generate consolidation content.
 * Called after scoring — uses the transcript + per-concept scores.
 */
export function buildConsolidationPrompt({
  transcript,
  conceptScores,
  language,
}: ConsolidationPromptParams): string {
  const conceptDetails = conceptScores
    .map((c, i) => {
      let detail = `${i + 1}. "${c.conceptName}" (score: ${c.score}/100)\n`;
      detail += `   Definition: ${c.conceptDefinition}\n`;
      detail += `   Evaluator feedback: ${c.feedback}`;
      if (c.misconceptions.length > 0) {
        detail += `\n   Misconceptions detected: ${c.misconceptions.join('; ')}`;
      }
      return detail;
    })
    .join('\n\n');

  const lang = language === 'es' ? 'español' : 'English';

  return `You are an expert tutor generating POST-EVALUATION CONSOLIDATION content. The student just completed an oral evaluation. Your job is to transform this evaluation into a learning opportunity.

TRANSCRIPT OF THE EVALUATION:
---
${transcript}
---

CONCEPT SCORES AND FEEDBACK:
${conceptDetails}

TASK: For EACH concept, generate consolidation content that includes:

1. **idealAnswer**: The response we expected — a clear, complete explanation of the concept. This is what a mastery-level student would say. Write it as if you're explaining to the student what the ideal answer looks like.

2. **divergence**: Where the student's reasoning diverged from the ideal. Be specific — quote or reference what they actually said and point out the gap. If their answer was strong, acknowledge it and note minor improvements.

3. **connections**: How this concept connects to other concepts in the curriculum or to real-world systems. Help them see the bigger picture.

4. **reviewSuggestion**: Specific, actionable advice on what to review. Not generic ("study more") but targeted ("re-read section X about Y, focusing on the relationship between Z and W").

RESPOND IN VALID JSON (in ${lang}):
{
  "consolidation": [
    {
      "conceptName": "<concept name>",
      "idealAnswer": "<the ideal response>",
      "divergence": "<where student diverged>",
      "connections": "<connections to other concepts>",
      "reviewSuggestion": "<what to review>"
    }
  ]
}

RULES:
- One entry per concept, in the same order as the input.
- Be constructive, not condescending. The goal is learning, not shaming.
- If the student scored 85+, still provide the ideal answer but acknowledge their strength.
- The idealAnswer should be comprehensive but conversational — as if you're explaining to a colleague.
- Keep each field 2-4 sentences. Dense but readable.`;
}
