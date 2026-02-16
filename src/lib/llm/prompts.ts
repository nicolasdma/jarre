/**
 * Jarre - LLM Prompts
 *
 * All prompts are versioned for traceability.
 * Supports multiple languages (es, en).
 */

export const PROMPT_VERSIONS = {
  GENERATE_QUESTIONS: 'v1.1.0',
  EVALUATE_ANSWERS: 'v1.1.0',
} as const;

export type SupportedLanguage = 'es' | 'en';

/**
 * System prompt for the evaluation generator.
 */
const SYSTEM_PROMPTS: Record<SupportedLanguage, string> = {
  en: `You are Jarre, an expert technical evaluator. Your job is to test deep understanding of complex technical concepts, not surface-level memorization.

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
- TRADEOFF: "When would you NOT use X? Give a concrete example."
- DESIGN: "Design a system that [requirement]. What components would you use and why?"`,

  es: `Eres Jarre, un evaluador técnico experto. Tu trabajo es evaluar la comprensión profunda de conceptos técnicos complejos, no la memorización superficial.

Reglas:
1. Genera preguntas que requieran COMPRENSIÓN, no memorización
2. Cada pregunta debe evaluar un concepto específico
3. Las preguntas deben poder responderse en 2-4 oraciones
4. Incluye una mezcla de tipos de preguntas
5. Sé preciso y técnico
6. Nunca hagas preguntas triviales u obvias

Tipos de preguntas a usar:
- EXPLANATION: "Explicá X con tus propias palabras"
- SCENARIO: "Dado [situación], ¿qué pasaría y por qué?"
- ERROR_DETECTION: "Esta afirmación tiene un error sutil: [afirmación]. ¿Cuál es el error?"
- CONNECTION: "¿Cómo se relaciona X con Y?"
- TRADEOFF: "¿Cuándo NO usarías X? Da un ejemplo concreto."
- DESIGN: "Diseñá un sistema que [requerimiento]. ¿Qué componentes usarías y por qué?"`,
};

export function getSystemPrompt(language: SupportedLanguage = 'es'): string {
  return SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.es;
}

/**
 * Generate evaluation questions for a resource.
 */
export function buildGenerateQuestionsPrompt(params: {
  resourceTitle: string;
  resourceType: string;
  concepts: Array<{ name: string; definition: string }>;
  questionCount: number;
  language?: SupportedLanguage;
}): string {
  const { resourceTitle, resourceType, concepts, questionCount, language = 'es' } = params;

  const conceptList = concepts
    .map((c, i) => `${i + 1}. **${c.name}**: ${c.definition}`)
    .join('\n');

  if (language === 'en') {
    return `Generate ${questionCount} evaluation questions for someone who just finished reading:

**Resource**: ${resourceTitle} (${resourceType})

**Concepts to evaluate**:
${conceptList}

Requirements:
- Generate exactly ${questionCount} questions
- Each question must test understanding of one of the listed concepts
- Use a variety of question types (explanation, scenario, error_detection, connection, tradeoff, design)
- Questions should be challenging but fair
- For error_detection questions, include the incorrect statement in the question
- For design questions, ask the student to propose an architecture integrating multiple concepts

Respond in JSON format:
{
  "questions": [
    {
      "type": "explanation|scenario|error_detection|connection|tradeoff|design",
      "conceptName": "the concept being tested",
      "question": "the question text",
      "incorrectStatement": "only for error_detection type",
      "relatedConceptName": "only for connection type"
    }
  ]
}`;
  }

  // Spanish (default)
  return `Generá ${questionCount} preguntas de evaluación para alguien que acaba de terminar de leer:

**Recurso**: ${resourceTitle} (${resourceType})

**Conceptos a evaluar**:
${conceptList}

Requisitos:
- Generá exactamente ${questionCount} preguntas
- Cada pregunta debe evaluar la comprensión de uno de los conceptos listados
- Usá una variedad de tipos de preguntas (explanation, scenario, error_detection, connection, tradeoff, design)
- Las preguntas deben ser desafiantes pero justas
- Para preguntas error_detection, incluí la afirmación incorrecta en la pregunta
- Para preguntas design, pedí que diseñen una arquitectura integrando múltiples conceptos
- IMPORTANTE: Las preguntas deben estar en ESPAÑOL

Respondé en formato JSON:
{
  "questions": [
    {
      "type": "explanation|scenario|error_detection|connection|tradeoff|design",
      "conceptName": "el concepto que se evalúa",
      "question": "el texto de la pregunta en español",
      "incorrectStatement": "solo para tipo error_detection",
      "relatedConceptName": "solo para tipo connection"
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
  language?: SupportedLanguage;
}): string {
  const { resourceTitle, questions, language = 'es' } = params;

  const qaList = questions
    .map(
      (q, i) => `
### ${language === 'es' ? 'Pregunta' : 'Question'} ${i + 1} (${q.type})
**${language === 'es' ? 'Concepto' : 'Concept'}**: ${q.conceptName}
**${language === 'es' ? 'Comprensión correcta' : 'Correct understanding'}**: ${q.conceptDefinition}
**${language === 'es' ? 'Pregunta' : 'Question'}**: ${q.question}
**${language === 'es' ? 'Respuesta del usuario' : "User's answer"}**: ${q.userAnswer}
`
    )
    .join('\n');

  if (language === 'en') {
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

  // Spanish (default)
  return `Evaluá las siguientes respuestas sobre "${resourceTitle}":

${qaList}

Para cada respuesta:
1. Determiná si la respuesta demuestra comprensión genuina (no solo coincidencia de palabras clave)
2. Puntuación de 0-100 (0=completamente incorrecto, 50=parcialmente correcto, 100=excelente)
3. Proporcioná feedback específico explicando qué estuvo bien/mal
4. Sé justo pero riguroso - aceptá frases no estándar si la comprensión es correcta
5. IMPORTANTE: El feedback debe estar en ESPAÑOL

Respondé en formato JSON:
{
  "responses": [
    {
      "questionIndex": 0,
      "isCorrect": true|false,
      "score": 0-100,
      "feedback": "feedback específico en español explicando la evaluación"
    }
  ],
  "overallScore": 0-100,
  "summary": "evaluación general breve en español"
}`;
}

// Legacy export for backwards compatibility
export const SYSTEM_PROMPT_EVALUATOR = SYSTEM_PROMPTS.es;
