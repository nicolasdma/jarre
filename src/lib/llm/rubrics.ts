/**
 * Jarre - Rubric Definitions for Multi-Dimensional Evaluation
 *
 * Each question type maps to a rubric with exactly 3 dimensions, scored 0-2.
 * Total range: 0-6 per rubric.
 *
 * Based on research: rubric-based evaluation with explicit level descriptors
 * improves LLM-human correlation from ~0.16 to ~0.55+ Pearson.
 */

import type { QuestionBankType, EvaluationType } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface RubricLevel {
  score: 0 | 1 | 2;
  es: string;
  en: string;
}

export interface RubricDimension {
  key: string;
  name: { es: string; en: string };
  levels: [RubricLevel, RubricLevel, RubricLevel]; // 0, 1, 2
}

export interface Rubric {
  id: string;
  dimensions: [RubricDimension, RubricDimension, RubricDimension];
}

// ============================================================================
// Rubric Definitions
// ============================================================================

/** Grupo A: definition, fact, property, explanation */
const KNOWLEDGE_RUBRIC: Rubric = {
  id: 'knowledge',
  dimensions: [
    {
      key: 'precision',
      name: { es: 'Precisión', en: 'Precision' },
      levels: [
        { score: 0, es: 'Contiene errores factuales que contradicen la referencia', en: 'Contains factual errors that contradict the reference' },
        { score: 1, es: 'Alguna afirmación es imprecisa o técnicamente dudosa', en: 'Some claim is imprecise or technically questionable' },
        { score: 2, es: 'Todo lo dicho es factualmente correcto (ignorar ortografía/estilo)', en: 'Everything stated is factually correct (ignore spelling/style)' },
      ],
    },
    {
      key: 'completeness',
      name: { es: 'Completitud', en: 'Completeness' },
      levels: [
        { score: 0, es: 'Falta la idea central o el mecanismo principal', en: 'Missing the central idea or main mechanism' },
        { score: 1, es: 'Cubre la idea principal pero omite ≥1 punto clave de la referencia', en: 'Covers the main idea but omits ≥1 key point from the reference' },
        { score: 2, es: 'Cubre la idea principal Y todos los puntos clave de la referencia', en: 'Covers the main idea AND all key points from the reference' },
      ],
    },
    {
      key: 'depth',
      name: { es: 'Profundidad', en: 'Depth' },
      levels: [
        { score: 0, es: 'Solo lista hechos sin explicar mecanismos', en: 'Only lists facts without explaining mechanisms' },
        { score: 1, es: 'Explica algún mecanismo o razonamiento causal', en: 'Explains some mechanism or causal reasoning' },
        { score: 2, es: 'Explica por qué/cómo Y discute implicaciones o trade-offs', en: 'Explains why/how AND discusses implications or trade-offs' },
      ],
    },
  ],
};

/** Grupo B: comparison */
const COMPARISON_RUBRIC: Rubric = {
  id: 'comparison',
  dimensions: [
    {
      key: 'precision',
      name: { es: 'Precisión', en: 'Precision' },
      levels: [
        { score: 0, es: 'Errores sobre uno o ambos conceptos', en: 'Errors about one or both concepts' },
        { score: 1, es: 'Mayormente correcto', en: 'Mostly correct' },
        { score: 2, es: 'Ambos conceptos descritos con precisión', en: 'Both concepts described accurately' },
      ],
    },
    {
      key: 'distinction',
      name: { es: 'Distinción', en: 'Distinction' },
      levels: [
        { score: 0, es: 'No identifica diferencias clave', en: 'Does not identify key differences' },
        { score: 1, es: 'Algunas diferencias pero faltan las críticas', en: 'Some differences but missing critical ones' },
        { score: 2, es: 'Articula claramente la distinción central', en: 'Clearly articulates the central distinction' },
      ],
    },
    {
      key: 'judgment',
      name: { es: 'Juicio', en: 'Judgment' },
      levels: [
        { score: 0, es: 'Sin mención de tradeoffs o casos de uso', en: 'No mention of tradeoffs or use cases' },
        { score: 1, es: 'Tradeoffs mencionados vagamente', en: 'Tradeoffs mentioned vaguely' },
        { score: 2, es: 'Escenarios concretos para elegir uno u otro', en: 'Concrete scenarios for choosing one or the other' },
      ],
    },
  ],
};

/** Grupo C: guarantee */
const GUARANTEE_RUBRIC: Rubric = {
  id: 'guarantee',
  dimensions: [
    {
      key: 'precision',
      name: { es: 'Precisión', en: 'Precision' },
      levels: [
        { score: 0, es: 'Describe mal la garantía', en: 'Misstates the guarantee' },
        { score: 1, es: 'Mayormente correcto', en: 'Mostly correct' },
        { score: 2, es: 'Describe la garantía con precisión', en: 'Describes the guarantee accurately' },
      ],
    },
    {
      key: 'boundaries',
      name: { es: 'Límites', en: 'Boundaries' },
      levels: [
        { score: 0, es: 'Sin mención de condiciones o límites', en: 'No mention of conditions or limits' },
        { score: 1, es: 'Condiciones mencionadas vagamente', en: 'Conditions mentioned vaguely' },
        { score: 2, es: 'Identifica explícitamente cuándo aplica y cuándo no', en: 'Explicitly identifies when it applies and when it does not' },
      ],
    },
    {
      key: 'mechanism',
      name: { es: 'Mecanismo', en: 'Mechanism' },
      levels: [
        { score: 0, es: 'Sin explicación de implementación', en: 'No implementation explanation' },
        { score: 1, es: 'Explicación parcial', en: 'Partial explanation' },
        { score: 2, es: 'Explica el mecanismo que provee la garantía', en: 'Explains the mechanism that provides the guarantee' },
      ],
    },
  ],
};

/** Grupo D: complexity */
const COMPLEXITY_RUBRIC: Rubric = {
  id: 'complexity',
  dimensions: [
    {
      key: 'correctness',
      name: { es: 'Correctitud', en: 'Correctness' },
      levels: [
        { score: 0, es: 'Clase de complejidad incorrecta', en: 'Incorrect complexity class' },
        { score: 1, es: 'Clase correcta pero justificación errónea', en: 'Correct class but wrong justification' },
        { score: 2, es: 'Correcta con justificación', en: 'Correct with justification' },
      ],
    },
    {
      key: 'analysis',
      name: { es: 'Análisis', en: 'Analysis' },
      levels: [
        { score: 0, es: 'Sin explicación del porqué', en: 'No explanation of why' },
        { score: 1, es: 'Explicación parcial', en: 'Partial explanation' },
        { score: 2, es: 'Derivación o explicación clara del bound', en: 'Clear derivation or explanation of the bound' },
      ],
    },
    {
      key: 'implications',
      name: { es: 'Implicaciones', en: 'Implications' },
      levels: [
        { score: 0, es: 'Sin mención de impacto real', en: 'No mention of real impact' },
        { score: 1, es: 'Menciona consecuencias vagamente', en: 'Mentions consequences vaguely' },
        { score: 2, es: 'Implicaciones prácticas concretas', en: 'Concrete practical implications' },
      ],
    },
  ],
};

/** Grupo E: scenario */
const SCENARIO_RUBRIC: Rubric = {
  id: 'scenario',
  dimensions: [
    {
      key: 'diagnosis',
      name: { es: 'Diagnóstico', en: 'Diagnosis' },
      levels: [
        { score: 0, es: 'Identifica mal el problema o ignora contexto', en: 'Misidentifies the problem or ignores context' },
        { score: 1, es: 'Identifica parcialmente', en: 'Partially identifies' },
        { score: 2, es: 'Identifica correctamente qué pasa y por qué', en: 'Correctly identifies what happens and why' },
      ],
    },
    {
      key: 'solution',
      name: { es: 'Solución', en: 'Solution' },
      levels: [
        { score: 0, es: 'Acción propuesta incorrecta o ausente', en: 'Proposed action incorrect or absent' },
        { score: 1, es: 'Approach razonable con gaps', en: 'Reasonable approach with gaps' },
        { score: 2, es: 'Acción apropiada con justificación', en: 'Appropriate action with justification' },
      ],
    },
    {
      key: 'reasoning',
      name: { es: 'Razonamiento', en: 'Reasoning' },
      levels: [
        { score: 0, es: 'Sin razonamiento causal', en: 'No causal reasoning' },
        { score: 1, es: 'Razonamiento incompleto', en: 'Incomplete reasoning' },
        { score: 2, es: 'Cadena causa-efecto clara', en: 'Clear cause-effect chain' },
      ],
    },
  ],
};

/** Grupo F: error_detection */
const ERROR_DETECTION_RUBRIC: Rubric = {
  id: 'error_detection',
  dimensions: [
    {
      key: 'detection',
      name: { es: 'Detección', en: 'Detection' },
      levels: [
        { score: 0, es: 'No identifica el error', en: 'Does not identify the error' },
        { score: 1, es: 'Identifica que algo está mal pero no qué', en: 'Identifies something is wrong but not what' },
        { score: 2, es: 'Pinpoints el error exacto', en: 'Pinpoints the exact error' },
      ],
    },
    {
      key: 'correction',
      name: { es: 'Corrección', en: 'Correction' },
      levels: [
        { score: 0, es: 'Sin corrección o corrección incorrecta', en: 'No correction or incorrect correction' },
        { score: 1, es: 'Corrección parcial', en: 'Partial correction' },
        { score: 2, es: 'Explica correctamente qué debería ser verdad', en: 'Correctly explains what should be true' },
      ],
    },
    {
      key: 'justification',
      name: { es: 'Justificación', en: 'Justification' },
      levels: [
        { score: 0, es: 'Sin razonamiento', en: 'No reasoning' },
        { score: 1, es: 'Algo de razonamiento', en: 'Some reasoning' },
        { score: 2, es: 'Cita principios/evidencia de por qué está mal', en: 'Cites principles/evidence for why it is wrong' },
      ],
    },
  ],
};

/** Grupo G: connection */
const CONNECTION_RUBRIC: Rubric = {
  id: 'connection',
  dimensions: [
    {
      key: 'accuracy',
      name: { es: 'Exactitud', en: 'Accuracy' },
      levels: [
        { score: 0, es: 'Incorrecto sobre uno o ambos conceptos', en: 'Incorrect about one or both concepts' },
        { score: 1, es: 'Correcto pero relación vaga', en: 'Correct but vague relationship' },
        { score: 2, es: 'Descripción precisa de ambos', en: 'Precise description of both' },
      ],
    },
    {
      key: 'relationship',
      name: { es: 'Relación', en: 'Relationship' },
      levels: [
        { score: 0, es: 'No articula una relación', en: 'Does not articulate a relationship' },
        { score: 1, es: 'Conexión superficial', en: 'Superficial connection' },
        { score: 2, es: 'Identifica relación estructural/funcional central', en: 'Identifies central structural/functional relationship' },
      ],
    },
    {
      key: 'insight',
      name: { es: 'Insight', en: 'Insight' },
      levels: [
        { score: 0, es: 'Sin insight', en: 'No insight' },
        { score: 1, es: 'Algo de insight', en: 'Some insight' },
        { score: 2, es: 'Implicación no obvia de la relación', en: 'Non-obvious implication of the relationship' },
      ],
    },
  ],
};

/** Grupo H: tradeoff */
const TRADEOFF_RUBRIC: Rubric = {
  id: 'tradeoff',
  dimensions: [
    {
      key: 'accuracy',
      name: { es: 'Exactitud', en: 'Accuracy' },
      levels: [
        { score: 0, es: 'Describe mal el patrón/tecnología', en: 'Misdescribes the pattern/technology' },
        { score: 1, es: 'Mayormente correcto', en: 'Mostly correct' },
        { score: 2, es: 'Descripción precisa', en: 'Precise description' },
      ],
    },
    {
      key: 'limitation',
      name: { es: 'Limitación', en: 'Limitation' },
      levels: [
        { score: 0, es: 'No identifica limitaciones reales', en: 'Does not identify real limitations' },
        { score: 1, es: 'Limitaciones genéricas', en: 'Generic limitations' },
        { score: 2, es: 'Limitaciones específicas y concretas', en: 'Specific and concrete limitations' },
      ],
    },
    {
      key: 'alternative',
      name: { es: 'Alternativa', en: 'Alternative' },
      levels: [
        { score: 0, es: 'Sin alternativa propuesta', en: 'No alternative proposed' },
        { score: 1, es: 'Alternativa vaga', en: 'Vague alternative' },
        { score: 2, es: 'Escenario concreto donde una alternativa es mejor', en: 'Concrete scenario where an alternative is better' },
      ],
    },
  ],
};

/** Grupo I: design — evaluates system architecture proposals */
const DESIGN_RUBRIC: Rubric = {
  id: 'design',
  dimensions: [
    {
      key: 'architecture',
      name: { es: 'Arquitectura', en: 'Architecture' },
      levels: [
        { score: 0, es: 'Diseño incoherente o falta de componentes esenciales', en: 'Incoherent design or missing essential components' },
        { score: 1, es: 'Componentes correctos pero integración poco clara', en: 'Correct components but unclear integration' },
        { score: 2, es: 'Arquitectura coherente con componentes bien integrados y flujo claro', en: 'Coherent architecture with well-integrated components and clear flow' },
      ],
    },
    {
      key: 'tradeoffs',
      name: { es: 'Trade-offs', en: 'Trade-offs' },
      levels: [
        { score: 0, es: 'Sin mención de trade-offs o alternativas', en: 'No mention of trade-offs or alternatives' },
        { score: 1, es: 'Reconoce trade-offs pero sin análisis concreto', en: 'Acknowledges trade-offs but no concrete analysis' },
        { score: 2, es: 'Analiza trade-offs específicos con justificación de decisiones', en: 'Analyzes specific trade-offs with decision justification' },
      ],
    },
    {
      key: 'feasibility',
      name: { es: 'Viabilidad', en: 'Feasibility' },
      levels: [
        { score: 0, es: 'Propuesta impracticable o ignora restricciones reales', en: 'Impractical proposal or ignores real constraints' },
        { score: 1, es: 'Viable pero con gaps operativos', en: 'Viable but with operational gaps' },
        { score: 2, es: 'Propuesta implementable con consideraciones de producción', en: 'Implementable proposal with production considerations' },
      ],
    },
  ],
};

/** Grupo J: MC2 justification — evaluates reasoning quality independent of MC choice */
const JUSTIFICATION_RUBRIC: Rubric = {
  id: 'justification',
  dimensions: [
    {
      key: 'reasoning',
      name: { es: 'Razonamiento', en: 'Reasoning' },
      levels: [
        { score: 0, es: 'Sin razonamiento o razonamiento circular', en: 'No reasoning or circular reasoning' },
        { score: 1, es: 'Razonamiento parcial, conexión vaga con el concepto', en: 'Partial reasoning, vague connection to the concept' },
        { score: 2, es: 'Cadena lógica clara que conecta causa con efecto', en: 'Clear logical chain connecting cause and effect' },
      ],
    },
    {
      key: 'precision',
      name: { es: 'Precisión', en: 'Precision' },
      levels: [
        { score: 0, es: 'Errores factuales o confusión de conceptos', en: 'Factual errors or concept confusion' },
        { score: 1, es: 'Mayormente correcto pero alguna imprecisión', en: 'Mostly correct but some imprecision' },
        { score: 2, es: 'Todo lo afirmado es factualmente correcto', en: 'Everything stated is factually correct' },
      ],
    },
    {
      key: 'relevance',
      name: { es: 'Relevancia', en: 'Relevance' },
      levels: [
        { score: 0, es: 'Describe algo no relacionado con lo preguntado', en: 'Describes something unrelated to the question' },
        { score: 1, es: 'Relacionado pero no apunta al concepto específico', en: 'Related but does not target the specific concept' },
        { score: 2, es: 'Aborda directamente lo que la pregunta pide', en: 'Directly addresses what the question asks' },
      ],
    },
  ],
};

export { JUSTIFICATION_RUBRIC };

// ============================================================================
// Type → Rubric Mapping
// ============================================================================

const QUESTION_TYPE_RUBRIC_MAP: Record<QuestionBankType | EvaluationType, Rubric> = {
  // QuestionBankType (Grupo A — Bloom 1-2)
  definition: KNOWLEDGE_RUBRIC,
  fact: KNOWLEDGE_RUBRIC,
  property: KNOWLEDGE_RUBRIC,
  // QuestionBankType (specific)
  comparison: COMPARISON_RUBRIC,
  guarantee: GUARANTEE_RUBRIC,
  complexity: COMPLEXITY_RUBRIC,
  // QuestionBankType (Bloom 4-5)
  scenario: SCENARIO_RUBRIC,
  limitation: TRADEOFF_RUBRIC,
  error_spot: ERROR_DETECTION_RUBRIC,
  // EvaluationType
  explanation: KNOWLEDGE_RUBRIC,
  error_detection: ERROR_DETECTION_RUBRIC,
  connection: CONNECTION_RUBRIC,
  tradeoff: TRADEOFF_RUBRIC,
  design: DESIGN_RUBRIC,
};

/**
 * Get the rubric for a given question type.
 * Works with both QuestionBankType and EvaluationType.
 */
export function getRubricForQuestionType(type: QuestionBankType | EvaluationType): Rubric {
  return QUESTION_TYPE_RUBRIC_MAP[type];
}
