#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for "The Tail at Scale" paper sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-tail-scale.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Quiz definitions — keyed by section_title (to resolve section_id at runtime)
// ============================================================================

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
  // ── Section 0: El Problema de la Latencia de Cola ───────────────────────

  {
    sectionTitle: 'El Problema de la Latencia de Cola',
    positionAfterHeading: 'El Problema de la Latencia de Cola',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué la latencia del percentil 99 (p99) importa más que la mediana en un servicio que hace fan-out a muchos servidores?',
    options: [
      { label: 'A', text: 'Porque la mediana no es estadísticamente significativa con fan-out' },
      { label: 'B', text: 'Porque la respuesta más lenta determina la latencia total, y con fan-out alto la probabilidad de encontrar un server lento crece exponencialmente' },
      { label: 'C', text: 'Porque los servidores siempre responden en el percentil 99' },
      { label: 'D', text: 'Porque el protocolo TCP prioriza las respuestas lentas' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si un request hace fan-out a 100 servidores y la latencia p99 de cada uno es 1s, la probabilidad de que AL MENOS uno sea lento es 1-(0.99^100) ≈ 63%. Con 1000 servidores, es 99.99%. La latencia del request completo la determina el servidor más lento, así que tail latency se amplifica con el paralelismo.',
    justificationHint:
      'Haz la cuenta: si cada servidor tiene 1% de probabilidad de ser lento, ¿cuál es la probabilidad de que los 100 sean rápidos? Es 0.99^100 ≈ 0.37. Entonces hay 63% de probabilidad de que al menos uno sea lento. ¿Y con 1000 servidores?',
  },
  {
    sectionTitle: 'El Problema de la Latencia de Cola',
    positionAfterHeading: 'El Problema de la Latencia de Cola',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Si la latencia mediana de un servicio es buena, la experiencia del usuario está garantizada para la mayoría de las solicitudes complejas.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Las solicitudes complejas típicamente involucran fan-out a múltiples backends. Incluso si cada backend tiene buena latencia mediana, la solicitud completa espera al más lento. El efecto de amplificación de tail latency hace que la experiencia del usuario final dependa de los percentiles altos, no de la mediana.',
  },

  // ── Section 1: Causas de Variabilidad ───────────────────────────────────

  {
    sectionTitle: 'Causas de Variabilidad',
    positionAfterHeading: 'Causas de Variabilidad',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál de las siguientes NO es una causa típica de variabilidad en la latencia según el paper?',
    options: [
      { label: 'A', text: 'Contención por recursos compartidos (CPU, red, disco)' },
      { label: 'B', text: 'Garbage collection y procesos de mantenimiento del sistema' },
      { label: 'C', text: 'Uso de protocolos de comunicación cifrados como TLS' },
      { label: 'D', text: 'Colas de procesamiento y head-of-line blocking' },
    ],
    correctAnswer: 'C',
    explanation:
      'El paper identifica como causas principales: contención de recursos compartidos, colas (queueing delays), garbage collection, compactación de datos en background, fallos de cache, power throttling, y mantenimiento de infraestructura. El cifrado TLS no se menciona como causa significativa de variabilidad de latencia.',
  },
  {
    sectionTitle: 'Causas de Variabilidad',
    positionAfterHeading: 'Causas de Variabilidad',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La variabilidad de latencia es un problema que se puede eliminar completamente optimizando el software.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'La variabilidad es inherente a los sistemas distribuidos a escala. Hay causas a nivel de hardware (discos compartidos, thermal throttling), de SO (context switches, GC), de red (congestión, retransmisiones), y de aplicación (compactación, mantenimiento). Se puede reducir pero no eliminar; por eso el paper se enfoca en TOLERAR la variabilidad, no en eliminarla.',
  },

  // ── Section 2: Técnicas Within-Request ──────────────────────────────────

  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'Técnicas Within-Request',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cómo funciona la técnica de "hedged requests"?',
    options: [
      { label: 'A', text: 'Se envía la solicitud a múltiples réplicas simultáneamente y se usa la primera respuesta que llega' },
      { label: 'B', text: 'Se espera un timeout y solo entonces se reintenta con otro servidor' },
      { label: 'C', text: 'Se envían solicitudes parciales a cada réplica y se combinan los resultados' },
      { label: 'D', text: 'Se predice qué servidor será más rápido usando estadísticas históricas' },
    ],
    correctAnswer: 'A',
    explanation:
      'Con hedged requests, envías la misma solicitud a múltiples réplicas y usas la respuesta que llega primero, cancelando las otras. En la variante conservadora, envías a una réplica primero y solo disparas la segunda solicitud si la primera no respondió dentro del percentil 95 esperado. Esto reduce la latencia de cola con un costo mínimo en recursos extra.',
    justificationHint:
      'Piensa en la variante optimizada: si envías a la segunda réplica solo después de esperar p95, el 95% del tiempo NO envías la segunda solicitud. Pero el 5% de las veces que sí la envías, la segunda réplica probablemente responda mucho más rápido que la primera.',
  },
  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'Técnicas Within-Request',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Qué es "tied requests" y en qué mejora sobre "hedged requests"?',
    options: [
      { label: 'A', text: 'Es una versión que envía requests a más réplicas simultáneamente' },
      { label: 'B', text: 'Es una versión donde los servidores se comunican entre sí para cancelar la ejecución redundante en cuanto uno empieza a procesarla' },
      { label: 'C', text: 'Es una versión que usa machine learning para predecir el servidor más rápido' },
      { label: 'D', text: 'Es una versión que divide el request en sub-requests más pequeños' },
    ],
    correctAnswer: 'B',
    explanation:
      'En tied requests, se envía la solicitud a dos servidores pero cada uno conoce la referencia del otro. Cuando un servidor comienza a ejecutar la solicitud, envía una señal de cancelación al otro. Esto reduce el trabajo desperdiciado comparado con hedged requests, donde ambos servidores pueden completar el procesamiento antes de que la cancelación llegue.',
  },
  {
    sectionTitle: 'Técnicas Within-Request',
    positionAfterHeading: 'Técnicas Within-Request',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Las hedged requests duplican la carga del sistema porque cada solicitud se envía a dos servidores.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'En la implementación práctica, la segunda solicitud se envía solo después de un breve delay (típicamente el percentil 95 de latencia esperada). Esto significa que el 95% del tiempo no hay solicitud extra. Google reporta que esta técnica reduce el p99 de latencia significativamente con solo un 2% de solicitudes extra.',
  },

  // ── Section 3: Técnicas Cross-Request ───────────────────────────────────

  {
    sectionTitle: 'Técnicas Cross-Request',
    positionAfterHeading: 'Técnicas Cross-Request',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué significa "micro-partitioning" en el contexto de la gestión de tail latency?',
    options: [
      { label: 'A', text: 'Dividir los datos en muchas más particiones de las que hay servidores para permitir rebalanceo dinámico más granular' },
      { label: 'B', text: 'Particionar los datos en fragmentos del tamaño de una página de memoria' },
      { label: 'C', text: 'Crear particiones separadas para datos calientes y fríos' },
      { label: 'D', text: 'Dividir cada request en micro-operaciones independientes' },
    ],
    correctAnswer: 'A',
    explanation:
      'Micro-partitioning crea muchas más particiones (por ejemplo 20x el número de servidores) de tamaño pequeño. Esto permite mover particiones rápidamente de un servidor sobrecargado a otro más libre. Particiones más grandes serían difíciles de mover sin causar interrupciones significativas.',
    justificationHint:
      'Piensa en la analogía: es más fácil equilibrar la carga moviendo muchas cajas pequeñas que unas pocas cajas enormes entre camiones. ¿Cómo se relaciona esto con el rebalanceo de particiones del Ch6 de DDIA?',
  },
  {
    sectionTitle: 'Técnicas Cross-Request',
    positionAfterHeading: 'Técnicas Cross-Request',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Por qué es importante que el balanceador de carga considere la longitud de la cola de cada servidor en vez de usar round-robin?',
    options: [
      { label: 'A', text: 'Porque round-robin no funciona con servidores heterogéneos' },
      { label: 'B', text: 'Porque un servidor con cola larga probablemente tiene un problema transitorio, y enviarle más requests empeoraría la tail latency' },
      { label: 'C', text: 'Porque la cola indica la cantidad de memoria disponible en el servidor' },
      { label: 'D', text: 'Porque round-robin causa más tráfico de red que queue-aware routing' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si un servidor acumula una cola larga (por GC, compactación, o problema de hardware), round-robin seguiría enviándole requests que se demorarían. Un balanceador queue-aware detecta esta congestión y redirige requests a servidores con colas más cortas, evitando amplificar el problema de latencia.',
  },

  // ── Section 4: Tolerancia y Degradación ─────────────────────────────────

  {
    sectionTitle: 'Tolerancia y Degradación',
    positionAfterHeading: 'Tolerancia y Degradación',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué significa "good enough" results en el contexto de la tolerancia a tail latency?',
    options: [
      { label: 'A', text: 'Retornar resultados con errores menores que el usuario no notará' },
      { label: 'B', text: 'Retornar resultados parciales o ligeramente desactualizados cuando algunos servidores tardan demasiado, en vez de esperar la respuesta perfecta' },
      { label: 'C', text: 'Comprimir los resultados para reducir latencia de red' },
      { label: 'D', text: 'Usar algoritmos de aproximación en vez de cálculos exactos' },
    ],
    correctAnswer: 'B',
    explanation:
      'En muchos casos (búsqueda web, feeds, recomendaciones), una respuesta que incluye resultados de 98 de 100 servidores en 50ms es mejor que una respuesta perfecta de 100 servidores en 2s. La degradación graceful permite devolver resultados incompletos pero útiles dentro del presupuesto de latencia.',
    justificationHint:
      'Piensa en Google Search: si 2 de 100 shards tardan demasiado, ¿prefieres esperar 3 segundos para tener todos los resultados o ver 98% de los resultados en 200ms? ¿El usuario notaría la diferencia?',
  },
  {
    sectionTitle: 'Tolerancia y Degradación',
    positionAfterHeading: 'Tolerancia y Degradación',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Según el paper, las técnicas de mitigación de tail latency tienen sentido a cualquier escala, incluso con pocos servidores.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Las técnicas como hedged requests y micro-partitioning son más efectivas a gran escala, donde el fan-out es alto y la probabilidad de encontrar un servidor lento es casi segura. Con pocos servidores, el costo adicional (requests duplicados, complejidad) puede no justificarse porque la amplificación de tail latency es menor.',
  },
  {
    sectionTitle: 'Tolerancia y Degradación',
    positionAfterHeading: 'Tolerancia y Degradación',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es el principio fundamental que Dean y Barroso proponen para manejar la variabilidad de latencia?',
    options: [
      { label: 'A', text: 'Eliminar todas las fuentes de variabilidad mediante hardware dedicado' },
      { label: 'B', text: 'Diseñar el sistema para TOLERAR la variabilidad en vez de intentar prevenirla' },
      { label: 'C', text: 'Sobre-provisionar recursos para que la variabilidad sea insignificante' },
      { label: 'D', text: 'Usar SLAs estrictos que fuercen a cada componente a responder a tiempo' },
    ],
    correctAnswer: 'B',
    explanation:
      'El insight fundamental del paper es que a escala, la variabilidad es inevitable. En vez de intentar que cada componente sea rápido siempre (imposible a escala), el sistema debe asumir que algunos componentes serán lentos y tener mecanismos (hedging, redundancia, degradación graceful) para tolerar esa variabilidad sin que afecte al usuario.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching tail-scale-paper section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'tail-at-scale-paper')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for tail-scale-paper. Seed sections first.');
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections:`);
  const titleToId = new Map<string, string>();
  for (const s of sections) {
    console.log(`  ${s.section_title} → ${s.id}`);
    titleToId.set(s.section_title, s.id);
  }

  // Clear existing quizzes for these sections
  const sectionIds = sections.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error clearing existing quizzes:', deleteError);
    process.exit(1);
  }

  console.log('\nCleared existing quizzes for tail-scale-paper sections.');

  // Resolve section IDs and insert quizzes
  const toInsert = [];
  let skipped = 0;

  for (const quiz of QUIZZES) {
    const sectionId = titleToId.get(quiz.sectionTitle);
    if (!sectionId) {
      console.warn(`  Warning: No section found for "${quiz.sectionTitle}", skipping.`);
      skipped++;
      continue;
    }

    toInsert.push({
      section_id: sectionId,
      position_after_heading: quiz.positionAfterHeading,
      sort_order: quiz.sortOrder,
      format: quiz.format,
      question_text: quiz.questionText,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
      explanation: quiz.explanation,
      justification_hint: quiz.justificationHint ?? null,
      is_active: true,
    });
  }

  if (toInsert.length === 0) {
    console.error('No quizzes to insert. Check section title matching.');
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from('inline_quizzes')
    .insert(toInsert);

  if (insertError) {
    console.error('Error inserting quizzes:', insertError);
    process.exit(1);
  }

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for The Tail at Scale paper`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to missing sections)`);
  }

  // Summary by section
  const countBySection = new Map<string, number>();
  const formatCount = { mc: 0, tf: 0, mc2: 0 };
  for (const q of toInsert) {
    const title = [...titleToId.entries()].find(([, id]) => id === q.section_id)?.[0] ?? 'unknown';
    countBySection.set(title, (countBySection.get(title) ?? 0) + 1);
    formatCount[q.format as keyof typeof formatCount]++;
  }
  console.log('\nPer-section breakdown:');
  for (const [title, count] of countBySection) {
    console.log(`  ${title}: ${count} quizzes`);
  }
  console.log(`\nBy format: MC=${formatCount.mc}, TF=${formatCount.tf}, MC2=${formatCount.mc2}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
