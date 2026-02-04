/**
 * Jarre - LLM Prompts
 *
 * All prompts are versioned for traceability.
 * When updating a prompt, create a new version.
 */

export const PROMPT_VERSIONS = {
  GENERATE_QUESTIONS: 'v1.0.0',
  EVALUATE_ANSWERS: 'v1.0.0',
} as const;

/**
 * System prompt for the evaluation generator.
 */
export const SYSTEM_PROMPT_EVALUATOR = `You are Jarre, an expert technical evaluator. Your job is to test deep understanding of complex technical concepts, not surface-level memorization.

Rules:
1. Generate questions that require UNDERSTANDING, not recall
2. Each question should test a specific concept
3. Questions should be answerable in 2-4 sentences
4. Include a mix of question types
5. Be precise and technical
6. Never ask trivial or obvious questions

Question types to use:
- EXPLANATION: "Explain X in your own words"
- SCENARIO: "Given [situation], what would happen and why?"
- ERROR_DETECTION: "This statement has a subtle error: [statement]. What is wrong?"
- CONNECTION: "How does X relate to Y?"
- TRADEOFF: "When would you NOT use X? Give a concrete example."`;

/**
 * Generate evaluation questions for a resource.
 */
export function buildGenerateQuestionsPrompt(params: {
  resourceTitle: string;
  resourceType: string;
  concepts: Array<{ name: string; definition: string }>;
  questionCount: number;
}): string {
  const { resourceTitle, resourceType, concepts, questionCount } = params;

  const conceptList = concepts
    .map((c, i) => `${i + 1}. **${c.name}**: ${c.definition}`)
    .join('\n');

  return `Generate ${questionCount} evaluation questions for someone who just finished reading:

**Resource**: ${resourceTitle} (${resourceType})

**Concepts to evaluate**:
${conceptList}

Requirements:
- Generate exactly ${questionCount} questions
- Each question must test understanding of one of the listed concepts
- Use a variety of question types (explanation, scenario, error_detection, connection, tradeoff)
- Questions should be challenging but fair
- For error_detection questions, include the incorrect statement in the question

Respond in JSON format:
{
  "questions": [
    {
      "type": "explanation|scenario|error_detection|connection|tradeoff",
      "conceptName": "the concept being tested",
      "question": "the question text",
      "incorrectStatement": "only for error_detection type",
      "relatedConceptName": "only for connection type"
    }
  ]
}`;
}

/**
 * Evaluate user's answers and provide feedback.
 */
export function buildEvaluateAnswersPrompt(params: {
  resourceTitle: string;
  questions: Array<{
    type: string;
    question: string;
    conceptName: string;
    conceptDefinition: string;
    userAnswer: string;
  }>;
}): string {
  const { resourceTitle, questions } = params;

  const qaList = questions
    .map(
      (q, i) => `
### Question ${i + 1} (${q.type})
**Concept**: ${q.conceptName}
**Correct understanding**: ${q.conceptDefinition}
**Question**: ${q.question}
**User's answer**: ${q.userAnswer}
`
    )
    .join('\n');

  return `Evaluate the following answers about "${resourceTitle}":

${qaList}

For each answer:
1. Determine if the answer demonstrates genuine understanding (not just keyword matching)
2. Score from 0-100 (0=completely wrong, 50=partially correct, 100=excellent)
3. Provide specific feedback explaining what was good/missing
4. Be fair but rigorous - accept non-standard phrasing if the understanding is correct

Respond in JSON format:
{
  "responses": [
    {
      "questionIndex": 0,
      "isCorrect": true|false,
      "score": 0-100,
      "feedback": "specific feedback explaining the evaluation"
    }
  ],
  "overallScore": 0-100,
  "summary": "brief overall assessment"
}`;
}
