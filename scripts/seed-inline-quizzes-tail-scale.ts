/**
 * Seed inline quizzes for "The Tail at Scale" paper.
 *
 * 15 quizzes across 5 sections (mc, tf, mc2 mix).
 *
 * Usage: npx tsx scripts/seed-inline-quizzes-tail-scale.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const RESOURCE_ID = 'tail-at-scale-paper';

interface QuizDef {
  sectionTitle: string;
  positionAfterHeading: string;
  sortOrder: number;
  format: 'mc' | 'tf' | 'mc2';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

const QUIZZES: QuizDef[] = [
  // ────────────────────────────────────────────────
  // Section 0: El Problema de la Latencia de Cola
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'El Problema de la Latencia de Cola',
    positionAfterHeading: '¿Por qué los promedios mienten?',
    sortOrder: 0,
    format: 'mc',
    questionText: 'Si un servicio tiene p99 de latencia de 10ms y un request hace fan-out a 100 servidores, ¿cuál es aproximadamente la probabilidad de que al menos un servidor exceda el p99?',
    options: [
      { label: 'A', text: '1%' },
      { label: 'B', text: '10%' },
      { label: 'C', text: '37%' },
      { label: 'D', text: '63%' },
    ],
    correctAnswer: 'D',
    explanation: 'P(al menos uno lento) = 1 - P(todos rápidos) = 1 - 0.99^100 ≈ 0.634, es decir ~63%. Este es el efecto de amplificación por fan-out.',
  },
  {
    sectionTitle: 'El Problema de la Latencia de Cola',
    positionAfterHeading: 'La matemática del fan-out',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Con fan-out de 100, el usuario experimenta efectivamente el percentil p99.99 del servidor individual.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Con fan-out N, el usuario ve efectivamente un percentil mucho más alto. Para fan-out 100, se necesita que cada servidor esté en su p99.99 para que el usuario tenga una experiencia p99.',
  },
  {
    sectionTitle: 'El Problema de la Latencia de Cola',
    positionAfterHeading: 'Percentiles como métrica de servicio',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles de las siguientes afirmaciones sobre SLOs y percentiles son correctas?',
    options: [
      { label: 'A', text: 'Un SLO "p99 < 100ms" es más útil que "promedio < 10ms" porque captura la experiencia de los usuarios más afectados' },
      { label: 'B', text: 'La latencia del servicio y la latencia percibida por el usuario son siempre iguales' },
      { label: 'C', text: 'El efecto de amplificación por fan-out hace que la latencia percibida sea mayor que la del servicio individual' },
      { label: 'D', text: 'Medir solo la latencia promedio es suficiente si el fan-out es bajo' },
    ],
    correctAnswer: '[A,C]',
    justificationHint: 'Piensa en por qué los promedios ocultan problemas y cómo el fan-out amplifica la cola de la distribución.',
    explanation: 'Los SLOs basados en percentiles revelan problemas que el promedio oculta. El fan-out amplifica la latencia porque el usuario espera al servidor más lento.',
  },

  // ────────────────────────────────────────────────
  // Section 1: Causas de Variabilidad
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Causas de Variabilidad',
    positionAfterHeading: 'Recursos compartidos a nivel de hardware',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué es el efecto "noisy neighbor" en un datacenter?',
    options: [
      { label: 'A', text: 'Un servidor que envía demasiados paquetes de red' },
      { label: 'B', text: 'Un proceso que degrada la latencia de otros al compartir recursos de hardware como cache L3' },
      { label: 'C', text: 'Un disco duro que genera ruido electromagnético' },
      { label: 'D', text: 'Un servidor que tiene demasiadas conexiones abiertas' },
    ],
    correctAnswer: 'B',
    explanation: 'El noisy neighbor ocurre cuando un proceso intensivo contamina recursos compartidos (cache L3, controladores de memoria), causando degradación de latencia en todos los procesos co-ubicados.',
  },
  {
    sectionTitle: 'Causas de Variabilidad',
    positionAfterHeading: 'Garbage Collection (GC)',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Sincronizar procesos de mantenimiento (como compactación) en todos los servidores simultáneamente ayuda a reducir la latencia de cola.',
    options: null,
    correctAnswer: 'false',
    explanation: 'Es lo contrario: sincronizar mantenimiento elimina la capacidad del sistema de redistribuir requests a servidores no afectados, empeorando la latencia de cola.',
  },
  {
    sectionTitle: 'Causas de Variabilidad',
    positionAfterHeading: 'Queuing theory y sus implicaciones',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles de las siguientes son fuentes de variabilidad de latencia mencionadas en el paper?',
    options: [
      { label: 'A', text: 'Pausas de garbage collection' },
      { label: 'B', text: 'TCP retransmissions por packet loss' },
      { label: 'C', text: 'Errores de programación en la aplicación' },
      { label: 'D', text: 'Background daemons como log rotation y compactación' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Distingue entre fuentes de variabilidad sistémicas (inherentes a la infraestructura) y bugs de aplicación.',
    explanation: 'GC pauses, packet loss/retransmissions, y background daemons son fuentes de variabilidad sistémicas. Los bugs son errores, no variabilidad inherente del sistema.',
  },

  // ────────────────────────────────────────────────
  // Section 2: Técnicas Within-Request
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'Hedged Requests',
    sortOrder: 0,
    format: 'mc',
    questionText: 'En hedged requests con delay, ¿cuándo se envía el segundo request?',
    options: [
      { label: 'A', text: 'Inmediatamente, junto con el primero' },
      { label: 'B', text: 'Solo si el primer request falla con error' },
      { label: 'C', text: 'Solo si el primer request no responde dentro de un timeout (~p95)' },
      { label: 'D', text: 'Después de un intervalo fijo de 100ms siempre' },
    ],
    correctAnswer: 'C',
    explanation: 'El hedge con delay solo envía el segundo request si el primero excede un timeout calibrado al p95, reduciendo el overhead a ~5% de tráfico adicional con beneficio casi igual a la hedge bruta.',
  },
  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'La cancelación es crítica',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Hedged requests y tied requests requieren que las operaciones sean idempotentes para funcionar correctamente.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Si un request modifica estado y se ejecuta en dos servidores, puede causar efectos duplicados. La idempotencia garantiza que ejecutar el request dos veces produce el mismo resultado.',
  },
  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'Tied Requests',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Cuál es la ventaja principal de tied requests sobre hedged requests?',
    options: [
      { label: 'A', text: 'No requieren cancelación' },
      { label: 'B', text: 'Eliminan trabajo duplicado porque los servidores se comunican entre sí para cancelar el redundante' },
      { label: 'C', text: 'Funcionan con operaciones no idempotentes' },
      { label: 'D', text: 'Reducen la latencia mediana pero no la de cola' },
    ],
    correctAnswer: 'B',
    explanation: 'En tied requests, cuando un servidor comienza a ejecutar el request, envía una señal de cancelación al otro. Esto elimina trabajo duplicado en la mayoría de los casos, con overhead menor al 3%.',
  },
  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'Micro-Partitioning',
    sortOrder: 3,
    format: 'mc2',
    questionText: '¿Cuáles son ventajas de micro-partitioning para reducir latencia de cola?',
    options: [
      { label: 'A', text: 'Menor variabilidad en el tiempo de procesamiento de cada partición' },
      { label: 'B', text: 'Permite mover particiones calientes a servidores con capacidad disponible' },
      { label: 'C', text: 'Elimina completamente la necesidad de hedged requests' },
      { label: 'D', text: 'Recovery más rápido cuando un servidor falla' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Micro-partitioning y hedged requests son complementarios, no sustitutos.',
    explanation: 'Micro-partitioning reduce variabilidad intrínseca, permite load balancing dinámico, y acelera recovery. Es complementario a hedged requests, no un reemplazo.',
  },

  // ────────────────────────────────────────────────
  // Section 3: Técnicas Cross-Request
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Técnicas Cross-Request',
    positionAfterHeading: 'Load Balancing aware de latencia',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Qué estrategia de load balancing selecciona el mejor de dos servidores elegidos al azar, logrando resultados exponencialmente mejores que selección aleatoria simple?',
    options: [
      { label: 'A', text: 'Weighted round-robin' },
      { label: 'B', text: 'Consistent hashing' },
      { label: 'C', text: 'Power of two choices' },
      { label: 'D', text: 'Join-shortest-queue' },
    ],
    correctAnswer: 'C',
    explanation: 'Power of two choices (Michael Mitzenmacher) selecciona dos servidores al azar y envía el request al de menor carga. Produce resultados exponencialmente mejores que selección aleatoria con overhead mínimo.',
  },
  {
    sectionTitle: 'Técnicas Cross-Request',
    positionAfterHeading: 'Admission control y load shedding',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Load shedding puede incluir abortar requests en progreso que probablemente no cumplirán su SLO, liberando recursos para requests que sí pueden cumplirlo.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Load shedding es la versión agresiva de admission control: no solo rechaza requests nuevos, sino que aborta requests en progreso cuando el deadline restante es insuficiente para completar el procesamiento.',
  },
  {
    sectionTitle: 'Técnicas Cross-Request',
    positionAfterHeading: 'Priorización de requests',
    sortOrder: 2,
    format: 'mc2',
    questionText: '¿Cuáles son técnicas cross-request para reducir latencia de cola según el paper?',
    options: [
      { label: 'A', text: 'Request prioritization con múltiples colas por prioridad' },
      { label: 'B', text: 'Selective replication de datos populares (hot data)' },
      { label: 'C', text: 'Enviar hedged requests a todos los servidores simultáneamente' },
      { label: 'D', text: 'Admission control con CoDel para rechazar requests bajo sobrecarga' },
    ],
    correctAnswer: '[A,B,D]',
    justificationHint: 'Distingue entre técnicas within-request (actúan en un request individual) y cross-request (actúan a nivel del sistema).',
    explanation: 'Hedged requests son una técnica within-request. Prioritization, selective replication, y admission control son cross-request porque modifican el comportamiento del sistema en el agregado.',
  },

  // ────────────────────────────────────────────────
  // Section 4: Tolerancia y Degradación
  // ────────────────────────────────────────────────
  {
    sectionTitle: 'Tolerancia y Degradación',
    positionAfterHeading: 'Canary Requests',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿Cuál es el propósito de los canary requests en un sistema con alto fan-out?',
    options: [
      { label: 'A', text: 'Medir la latencia promedio del cluster' },
      { label: 'B', text: 'Enviar el request a un solo servidor primero para detectar comportamiento patológico antes de distribuirlo a todos' },
      { label: 'C', text: 'Priorizar requests de usuarios premium' },
      { label: 'D', text: 'Balancear la carga entre servidores' },
    ],
    correctAnswer: 'B',
    explanation: 'Canary requests envían el request a un solo servidor primero. Si el canary responde normalmente, se envía a los demás. Si falla, se aborta sin afectar al resto del cluster.',
  },
  {
    sectionTitle: 'Tolerancia y Degradación',
    positionAfterHeading: 'Graceful Degradation',
    sortOrder: 1,
    format: 'tf',
    questionText: 'Según el paper, es mejor retornar una respuesta parcial rápidamente que una respuesta completa con latencia alta.',
    options: null,
    correctAnswer: 'true',
    explanation: 'Graceful degradation acepta que retornar resultados parciales o aproximados rápidamente es mejor que esperar una respuesta perfecta. Google Search retorna resultados sin shards lentos en lugar de esperar a todos.',
  },
];

async function main() {
  // 1. Fetch section IDs by title
  const { data: sections, error: fetchError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', RESOURCE_ID)
    .order('sort_order');

  if (fetchError || !sections) {
    console.error('Error fetching sections:', fetchError?.message);
    process.exit(1);
  }

  const titleToId = new Map(sections.map((s) => [s.section_title, s.id]));
  console.log(`Found ${sections.length} sections for ${RESOURCE_ID}`);

  // 2. Validate all section titles match
  for (const q of QUIZZES) {
    if (!titleToId.has(q.sectionTitle)) {
      console.error(`Section title not found: "${q.sectionTitle}"`);
      console.error('Available:', [...titleToId.keys()]);
      process.exit(1);
    }
  }

  // 3. Delete existing quizzes for these sections
  const sectionIds = [...titleToId.values()];
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error deleting existing quizzes:', deleteError.message);
    process.exit(1);
  }
  console.log('Cleared existing quizzes');

  // 4. Insert quizzes
  const rows = QUIZZES.map((q) => ({
    section_id: titleToId.get(q.sectionTitle),
    position_after_heading: q.positionAfterHeading,
    sort_order: q.sortOrder,
    format: q.format,
    question_text: q.questionText,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    justification_hint: q.justificationHint ?? null,
  }));

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(rows);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} inline quizzes for ${RESOURCE_ID}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
