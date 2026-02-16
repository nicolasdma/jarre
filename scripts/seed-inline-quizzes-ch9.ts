#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch9 (Consistency and Consensus) sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-ch9.ts
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
  // ── Section 0: Linearizabilidad ──────────────────────────────────────

  {
    sectionTitle: 'Linearizabilidad',
    positionAfterHeading: 'Linearizabilidad',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es la idea central detrás de la linearizabilidad?',
    options: [
      { label: 'A', text: 'Que todas las operaciones se ejecuten en orden cronológico exacto' },
      { label: 'B', text: 'Que el sistema se comporte como si hubiera una sola copia de los datos y todas las operaciones fueran atómicas' },
      { label: 'C', text: 'Que las lecturas siempre devuelvan el valor más reciente escrito por el mismo cliente' },
      { label: 'D', text: 'Que no haya conflictos entre escrituras concurrentes' },
    ],
    correctAnswer: 'B',
    explanation:
      'La linearizabilidad (también llamada consistencia atómica) da la ilusión de que existe una sola copia de los datos, a pesar de que puede haber múltiples réplicas. Cada operación parece tener efecto en un instante único entre su invocación y su respuesta. Es la garantía de consistencia más fuerte.',
  },
  {
    sectionTitle: 'Linearizabilidad',
    positionAfterHeading: '¿Qué hace que un sistema sea linearizable?',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Qué condición debe cumplirse para que un registro sea linearizable?',
    options: [
      { label: 'A', text: 'Una vez que una lectura devuelve un valor nuevo, todas las lecturas posteriores (incluso de otros clientes) también deben devolver ese valor o uno más reciente' },
      { label: 'B', text: 'Todas las escrituras deben confirmarse en menos de 100ms' },
      { label: 'C', text: 'Cada cliente debe ver sus propias escrituras, aunque otros clientes puedan ver valores antiguos' },
      { label: 'D', text: 'Las lecturas y escrituras deben ejecutarse en el mismo nodo' },
    ],
    correctAnswer: 'A',
    explanation:
      'La propiedad clave es la "recency guarantee": después de que CUALQUIER lectura devuelve un valor nuevo, TODAS las lecturas posteriores deben ver ese valor o uno más reciente. No es suficiente con read-your-writes (opción C); la garantía aplica a TODOS los clientes. Esto es lo que hace parecer que hay una sola copia.',
    justificationHint:
      'Imagina que Alice actualiza el score del partido y ve "2-1". Si llama a Bob por teléfono y Bob consulta, pero ve "1-1" (un valor viejo), el sistema NO es linearizable. La lectura de Bob debería ver al menos "2-1" porque eso ya fue observado.',
  },
  {
    sectionTitle: 'Linearizabilidad',
    positionAfterHeading: 'Linealizabilidad versus Serializabilidad',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Linearizabilidad y serializabilidad son la misma garantía.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Son garantías completamente diferentes. Serializabilidad es una propiedad de aislamiento de TRANSACCIONES: garantiza que el resultado es como si se ejecutaran en serie. Linearizabilidad es una garantía de recencia sobre registros INDIVIDUALES. Se pueden combinar (strict serializability) pero son ortogonales.',
  },
  {
    sectionTitle: 'Linearizabilidad',
    positionAfterHeading: 'Depender de la Linearizabilidad',
    sortOrder: 3,
    format: 'mc',
    questionText:
      '¿En qué caso la linearizabilidad es estrictamente necesaria (no solo deseable)?',
    options: [
      { label: 'A', text: 'Para cualquier aplicación web que use caché' },
      { label: 'B', text: 'Para elección de líder: todos los nodos deben estar de acuerdo en quién es el líder' },
      { label: 'C', text: 'Para lecturas de dashboards de analytics' },
      { label: 'D', text: 'Para sistemas de logging distribuido' },
    ],
    correctAnswer: 'B',
    explanation:
      'La elección de líder requiere linearizabilidad: si dos nodos creen ser líder simultáneamente (split-brain), puede haber corrupción de datos. El lock que determina quién es líder debe ser linearizable. Otros casos: restricciones de unicidad (usernames) y CAS (compare-and-set) para coordinar acceso concurrente.',
  },
  {
    sectionTitle: 'Linearizabilidad',
    positionAfterHeading: 'Implementación de Sistemas Linealizables',
    sortOrder: 4,
    format: 'tf',
    questionText:
      'La replicación multi-líder puede proporcionar linearizabilidad.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'La replicación multi-líder NO puede ser linearizable por diseño. Múltiples líderes aceptan escrituras concurrentes que pueden conflictuar, y procesan las escrituras de forma asíncrona. No hay un punto único de serialización. Solo la replicación de líder único (con lecturas del líder) puede ser linearizable, y aun así no siempre lo es.',
  },

  // ── Section 1: El Costo de la Linearizabilidad ───────────────────────

  {
    sectionTitle: 'El Costo de la Linearizabilidad',
    positionAfterHeading: 'El Costo de la Linealizabilidad',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué ocurre con un sistema linearizable cuando hay una partición de red entre sus réplicas?',
    options: [
      { label: 'A', text: 'Sigue funcionando normalmente usando caché local' },
      { label: 'B', text: 'Las réplicas desconectadas deben dejar de aceptar lecturas y escrituras, sacrificando disponibilidad' },
      { label: 'C', text: 'Automáticamente cambia a un modelo de consistencia eventual' },
      { label: 'D', text: 'Los datos se replican más rápido para compensar' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si el sistema debe ser linearizable, las réplicas que no pueden comunicarse con el líder (o entre sí para consenso) deben negarse a servir solicitudes. No pueden arriesgar devolver datos stale o aceptar escrituras conflictivas. Esto es el corazón del tradeoff linearizabilidad vs. disponibilidad.',
  },
  {
    sectionTitle: 'El Costo de la Linearizabilidad',
    positionAfterHeading: 'El teorema CAP',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál es la formulación más precisa del teorema CAP?',
    options: [
      { label: 'A', text: 'Elige dos de tres: Consistencia, Disponibilidad, Tolerancia a Particiones' },
      { label: 'B', text: 'Ante una partición de red, debes elegir entre linearizabilidad y disponibilidad' },
      { label: 'C', text: 'No puedes tener consistencia y disponibilidad al mismo tiempo' },
      { label: 'D', text: 'Todos los sistemas distribuidos sacrifican consistencia' },
    ],
    correctAnswer: 'B',
    explanation:
      'La formulación "elige 2 de 3" es engañosa porque las particiones de red no son opcionales: OCURREN. La formulación correcta es: cuando hay una partición, debes elegir entre linearizabilidad (C) y disponibilidad (A). Kleppmann sugiere que CAP es demasiado simplista y es mejor pensar en el tradeoff específico del sistema.',
    justificationHint:
      'CAP no dice "elige 2". Dice: las particiones SON inevitables. Dado que van a ocurrir, ¿qué haces? ¿Dejas de servir (consistencia) o sirves datos potencialmente stale (disponibilidad)?',
  },
  {
    sectionTitle: 'El Costo de la Linearizabilidad',
    positionAfterHeading: 'El teorema CAP',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Incluso sin particiones de red, hay razones para elegir consistencia eventual sobre linearizabilidad.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'La linearizabilidad tiene un costo significativo en rendimiento, especialmente latencia. Incluso en una red perfecta sin particiones, la coordinación necesaria para linearizabilidad añade latencia. Sistemas como Dynamo eligen consistencia eventual no por miedo a las particiones, sino por los beneficios de rendimiento.',
  },

  // ── Section 2: Garantías de Ordenación ───────────────────────────────

  {
    sectionTitle: 'Garantías de Ordenación',
    positionAfterHeading: 'Orden y Causalidad',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuál es la relación entre causalidad y linearizabilidad?',
    options: [
      { label: 'A', text: 'Son lo mismo pero con diferentes nombres' },
      { label: 'B', text: 'La linearizabilidad implica orden causal, pero el orden causal no requiere linearizabilidad' },
      { label: 'C', text: 'El orden causal es más fuerte que la linearizabilidad' },
      { label: 'D', text: 'No tienen relación' },
    ],
    correctAnswer: 'B',
    explanation:
      'La linearizabilidad impone un orden total (todas las operaciones están ordenadas), lo cual automáticamente preserva causalidad. Pero la causalidad solo requiere un orden parcial: solo los eventos causalmente relacionados deben estar ordenados. Esto es más débil y permite mayor rendimiento y disponibilidad.',
    justificationHint:
      'La causalidad es el modelo de consistencia más fuerte que no sacrifica rendimiento. ¿Por qué? Porque los eventos concurrentes (sin relación causal) pueden procesarse en cualquier orden, permitiendo paralelismo.',
  },
  {
    sectionTitle: 'Garantías de Ordenación',
    positionAfterHeading: 'Marca de tiempo de Lamport',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cómo funciona un timestamp de Lamport para establecer orden total?',
    options: [
      { label: 'A', text: 'Sincroniza los relojes de todos los nodos mediante NTP' },
      { label: 'B', text: 'Cada nodo mantiene un contador; al recibir un mensaje con un contador mayor, avanza su propio contador y luego lo incrementa' },
      { label: 'C', text: 'Usa GPS para asignar timestamps con precisión de nanosegundos' },
      { label: 'D', text: 'Asigna timestamps basados en el hash del contenido del mensaje' },
    ],
    correctAnswer: 'B',
    explanation:
      'Un timestamp de Lamport es un par (contador, nodeId). Cada nodo incrementa su contador en cada operación. Cuando recibe un mensaje, toma el máximo entre su contador y el del mensaje, luego incrementa. Esto garantiza que si A causó B, el timestamp de A < timestamp de B. El nodeId desempata.',
  },
  {
    sectionTitle: 'Garantías de Ordenación',
    positionAfterHeading: 'Marca de tiempo de Lamport',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Los timestamps de Lamport son suficientes para implementar una restricción de unicidad (ej: username único) en tiempo real.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Los timestamps de Lamport dan un orden total, pero solo después de recolectar TODAS las operaciones. Para decidir "¿quién registró este username primero?", necesitarías esperar a que todos los nodos confirmen que no tienen operaciones pendientes con timestamps menores. Esto equivale al problema de difusión de orden total, que es tan difícil como el consenso.',
    justificationHint:
      'Un nodo recibe "registrar username=alice" con timestamp 5. ¿Puede aceptarlo? No sabe si otro nodo tiene una solicitud con timestamp 3 que aún no llegó. ¿Cuánto debe esperar? Este es el problema fundamental.',
  },
  {
    sectionTitle: 'Garantías de Ordenación',
    positionAfterHeading: 'Difusión de Orden Total',
    sortOrder: 3,
    format: 'mc2',
    questionText:
      '¿Qué propiedades debe satisfacer un protocolo de difusión de orden total (total order broadcast)?',
    options: [
      { label: 'A', text: 'Entrega fiable (todos reciben todos los mensajes) y orden total (todos reciben los mensajes en el mismo orden)' },
      { label: 'B', text: 'Entrega rápida y tolerancia a particiones' },
      { label: 'C', text: 'Encriptación end-to-end y autenticación' },
      { label: 'D', text: 'Confirmación del receptor y retransmisión automática' },
    ],
    correctAnswer: 'A',
    explanation:
      'Total order broadcast requiere dos propiedades: (1) Entrega fiable: si un mensaje se entrega a un nodo, se entrega a todos. (2) Orden total: los mensajes se entregan en el mismo orden a todos los nodos. Esto es equivalente al consenso y es la base de la replicación de máquina de estados.',
  },

  // ── Section 3: Transacciones Distribuidas y Consenso ─────────────────

  {
    sectionTitle: 'Transacciones Distribuidas y Consenso',
    positionAfterHeading: 'Transacciones Distribuidas y Consenso',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'El consenso, la difusión de orden total, y la linearizabilidad son problemas fundamentalmente diferentes que requieren soluciones independientes.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Estos problemas son equivalentes en el sentido de reducibilidad: si puedes resolver uno, puedes resolver los otros. Total order broadcast es equivalente a consenso repetido (cada mensaje es una ronda de consenso). Un registro linearizable de compare-and-set puede implementar total order broadcast, y viceversa.',
  },
  {
    sectionTitle: 'Transacciones Distribuidas y Consenso',
    positionAfterHeading: 'Compromiso Atómico y Compromiso en Dos Fases (2PC)',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál es la debilidad principal del protocolo de commit en dos fases (2PC)?',
    options: [
      { label: 'A', text: 'No garantiza atomicidad' },
      { label: 'B', text: 'Si el coordinador falla después de enviar "prepare" pero antes de enviar "commit/abort", los participantes quedan bloqueados indefinidamente' },
      { label: 'C', text: 'Requiere que todos los participantes estén en el mismo datacenter' },
      { label: 'D', text: 'No soporta más de dos participantes' },
    ],
    correctAnswer: 'B',
    explanation:
      'En 2PC, los participantes que votaron "sí" en la fase prepare no pueden hacer commit ni abort unilateralmente: deben esperar la decisión del coordinador. Si el coordinador muere en ese punto, los participantes quedan en un estado de "duda" (in-doubt), bloqueando los datos con locks que no se liberan hasta que el coordinador se recupere.',
    justificationHint:
      'Fase 1: coordinador → "¿pueden commitear?". Participantes → "sí". Fase 2: coordinador muere. Los participantes dijeron "sí" pero no saben si TODOS dijeron sí. No pueden commitear (quizás alguien dijo no) ni abortear (ya prometieron). Están atrapados.',
  },
  {
    sectionTitle: 'Transacciones Distribuidas y Consenso',
    positionAfterHeading: 'Transacciones distribuidas en la práctica',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Por qué muchos sistemas modernos evitan o desaconsejan las transacciones distribuidas basadas en 2PC?',
    options: [
      { label: 'A', text: 'Porque son demasiado complejas de implementar' },
      { label: 'B', text: 'Porque amplifican fallos (un solo participante lento frena a todos), tienen impacto severo en rendimiento, y el coordinador es un punto único de fallo' },
      { label: 'C', text: 'Porque solo funcionan con bases de datos relacionales' },
      { label: 'D', text: 'Porque violan el teorema CAP' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las transacciones distribuidas con 2PC tienen múltiples problemas operacionales: (1) el coordinador es un SPOF, (2) un participante lento bloquea a todos los demás, (3) los locks se mantienen durante toda la duración del protocolo, reduciendo throughput significativamente, (4) las transacciones in-doubt pueden bloquear datos por horas o días.',
  },

  // ── Section 4: Consenso Tolerante a Fallos ───────────────────────────

  {
    sectionTitle: 'Consenso Tolerante a Fallos',
    positionAfterHeading: 'Algoritmos de consenso y difusión de orden total',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Qué diferencia fundamental tiene un algoritmo como Raft/Paxos respecto a 2PC?',
    options: [
      { label: 'A', text: 'No necesitan un coordinador' },
      { label: 'B', text: 'Requieren votos de una mayoría (quórum) en vez de unanimidad, y pueden elegir un nuevo líder si el actual falla' },
      { label: 'C', text: 'No usan fases de votación' },
      { label: 'D', text: 'Solo funcionan con 3 nodos' },
    ],
    correctAnswer: 'B',
    explanation:
      '2PC requiere que TODOS los participantes voten sí (unanimidad) y no tiene mecanismo de recuperación si el coordinador muere. Raft/Paxos usan quórums (mayorías): necesitan N/2+1 votos, toleran que la minoría falle, y tienen protocolos de elección de líder para reemplazar un líder caído. Esto los hace tolerantes a fallos.',
    justificationHint:
      'Con 5 nodos en Raft, si 2 mueren, los 3 restantes forman mayoría y siguen operando. En 2PC con 5 participantes, si 1 muere, todo se bloquea. Esa es la diferencia entre quórum y unanimidad.',
  },
  {
    sectionTitle: 'Consenso Tolerante a Fallos',
    positionAfterHeading: 'Limitaciones del consenso',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Los algoritmos de consenso tolerantes a fallos no tienen ningún costo significativo en rendimiento.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'El consenso tiene costos reales: (1) la votación por quórum es esencialmente un protocolo síncrono de replicación, lo que impacta latencia; (2) requiere un número impar de nodos para quórums óptimos; (3) la detección de fallos usa timeouts, que pueden disparar elecciones de líder innecesarias en redes lentas; (4) son sensibles a la latencia de red.',
  },
  {
    sectionTitle: 'Consenso Tolerante a Fallos',
    positionAfterHeading: 'Limitaciones del consenso',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Por qué los algoritmos de consenso son particularmente sensibles a problemas de red?',
    options: [
      { label: 'A', text: 'Porque usan encriptación que añade latencia' },
      { label: 'B', text: 'Porque las redes lentas o inestables pueden causar elecciones de líder frecuentes, y durante una elección el sistema no puede procesar solicitudes' },
      { label: 'C', text: 'Porque requieren conexiones persistentes entre todos los nodos' },
      { label: 'D', text: 'Porque no funcionan sin IPv6' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si la red es inestable, los timeouts pueden expirar frecuentemente, causando que los nodos crean que el líder murió y disparen elecciones. Durante la elección (que también necesita la red), el sistema está parado. En el peor caso, un sistema puede pasar más tiempo eligiendo líderes que procesando solicitudes (livelock).',
  },
  {
    sectionTitle: 'Consenso Tolerante a Fallos',
    positionAfterHeading: 'Servicios de Membresía y Coordinación',
    sortOrder: 3,
    format: 'mc',
    questionText:
      '¿Qué rol cumplen servicios como ZooKeeper y etcd en los sistemas distribuidos?',
    options: [
      { label: 'A', text: 'Son bases de datos de propósito general para almacenar datos de usuario' },
      { label: 'B', text: 'Proporcionan consenso como servicio: locks distribuidos, elección de líder, configuración, y service discovery' },
      { label: 'C', text: 'Son sistemas de mensajería como Kafka o RabbitMQ' },
      { label: 'D', text: 'Son load balancers que distribuyen tráfico entre servidores' },
    ],
    correctAnswer: 'B',
    explanation:
      'ZooKeeper/etcd implementan algoritmos de consenso (Zab/Raft) y exponen sus capacidades como servicios de alto nivel: locks distribuidos, elección de líder, almacenamiento de configuración, service discovery, y membresía de cluster. La idea es que no cada aplicación reimplemente consenso, sino que use estos servicios especializados.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching Ch9 section IDs from Supabase...\n');

  // Fetch all sections for ddia-ch9
  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch9')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch9. Seed sections first.');
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

  console.log('\nCleared existing quizzes for Ch9 sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch9`);
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
