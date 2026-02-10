#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch5 (Replication) sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes.ts
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
  format: 'mc' | 'tf';
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
}

const QUIZZES: QuizDef[] = [
  // ── Section 1: Líderes y Seguidores ──────────────────────────────────
  {
    sectionTitle: 'Líderes y Seguidores',
    positionAfterHeading: 'Replicación Síncrona Versus Asincrónica',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Si el líder falla en replicación completamente asíncrona, pueden perderse escrituras que ya fueron confirmadas al cliente.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'En replicación asíncrona, las escrituras confirmadas al cliente pueden no haberse replicado aún a ningún seguidor. Si el líder falla antes de que se propaguen, esas escrituras se pierden permanentemente.',
  },
  {
    sectionTitle: 'Líderes y Seguidores',
    positionAfterHeading: 'Configuración de Nuevos Seguidores',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál es el primer paso para configurar un nuevo seguidor sin tiempo de inactividad?',
    options: [
      { label: 'A', text: 'Detener las escrituras en el líder' },
      { label: 'B', text: 'Tomar un snapshot consistente del líder' },
      { label: 'C', text: 'Copiar el directorio de datos del líder mientras está en ejecución' },
      { label: 'D', text: 'Enviar el registro completo de WAL desde el inicio' },
    ],
    correctAnswer: 'B',
    explanation:
      'El proceso comienza tomando un snapshot consistente de la base de datos del líder en un punto en el tiempo, sin necesidad de bloquear las escrituras. Luego el seguidor copia ese snapshot y solicita los cambios posteriores al punto del snapshot.',
  },
  {
    sectionTitle: 'Líderes y Seguidores',
    positionAfterHeading: 'Manejo de Interrupciones de Nodos',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Qué problema NO es un riesgo del failover automático?',
    options: [
      { label: 'A', text: 'Pérdida de escrituras no replicadas del antiguo líder' },
      { label: 'B', text: 'Split-brain: dos nodos creyéndose líder simultáneamente' },
      { label: 'C', text: 'Timeout demasiado largo que aumenta el tiempo de recuperación' },
      { label: 'D', text: 'Los seguidores no pueden procesar lecturas durante el failover' },
    ],
    correctAnswer: 'D',
    explanation:
      'Los seguidores pueden seguir sirviendo lecturas durante el failover (con datos potencialmente obsoletos). Los riesgos reales del failover incluyen pérdida de escrituras, split-brain y la dificultad de elegir el timeout correcto.',
  },
  {
    sectionTitle: 'Líderes y Seguidores',
    positionAfterHeading: 'Implementación de Registros de Replicación',
    sortOrder: 3,
    format: 'mc',
    questionText:
      '¿Cuál es la ventaja principal de la replicación de registro lógico sobre WAL shipping?',
    options: [
      { label: 'A', text: 'Es más rápida en redes de alta latencia' },
      { label: 'B', text: 'Permite desacoplamiento del motor de almacenamiento entre líder y seguidor' },
      { label: 'C', text: 'Requiere menos espacio en disco' },
      { label: 'D', text: 'Garantiza zero data loss' },
    ],
    correctAnswer: 'B',
    explanation:
      'El registro lógico (basado en filas) describe cambios a nivel de datos (inserciones, actualizaciones, eliminaciones) independientemente del formato interno del motor. Esto permite que líder y seguidores usen versiones o motores de almacenamiento diferentes, facilitando actualizaciones sin downtime.',
  },

  // ── Section 2: Problemas con el Retraso de Replicación ──────────────
  {
    sectionTitle: 'Problemas con el Retraso de Replicación',
    positionAfterHeading: 'Lectura de tus propias escrituras',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'La consistencia read-your-writes garantiza que todos los usuarios vean los datos más recientes de la base de datos.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Read-your-writes solo garantiza que un usuario específico vea sus PROPIAS escrituras recientes. Otros usuarios pueden ver datos obsoletos hasta que la replicación se propague. No dice nada sobre la visibilidad entre usuarios distintos.',
  },
  {
    sectionTitle: 'Problemas con el Retraso de Replicación',
    positionAfterHeading: 'Lecturas Monotónicas',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Qué problema resuelven las lecturas monotónicas?',
    options: [
      { label: 'A', text: 'Que un usuario vea datos y luego, al refrescar, vea una versión anterior' },
      { label: 'B', text: 'Que las escrituras no se confirmen al cliente' },
      { label: 'C', text: 'Que dos usuarios vean datos diferentes al mismo tiempo' },
      { label: 'D', text: 'Que las transacciones se ejecuten fuera de orden' },
    ],
    correctAnswer: 'A',
    explanation:
      'Las lecturas monotónicas previenen que un usuario "retroceda en el tiempo" — si consulta dos réplicas diferentes, la segunda no debería mostrar datos más antiguos que los que ya vio. Se implementa típicamente asignando cada usuario a una réplica consistente.',
  },
  {
    sectionTitle: 'Problemas con el Retraso de Replicación',
    positionAfterHeading: 'Lecturas de Prefijo Consistente',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'El problema de lecturas de prefijo consistente solo ocurre en bases de datos particionadas.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'En bases de datos sin particiones, las escrituras se aplican en orden global. Las lecturas de prefijo consistente son un problema específico de bases de datos particionadas, donde cada partición opera independientemente y no hay un orden global de escrituras.',
  },

  // ── Section 3: Replicación Multi-Líder ──────────────────────────────
  {
    sectionTitle: 'Replicación Multi-Líder',
    positionAfterHeading: 'Casos de Uso para la Replicación Multi-Líder',
    sortOrder: 0,
    format: 'mc',
    questionText: '¿En cuál de estos escenarios la replicación multi-líder ofrece mayor ventaja?',
    options: [
      { label: 'A', text: 'Una aplicación con un solo centro de datos y muchas lecturas' },
      { label: 'B', text: 'Una aplicación con múltiples centros de datos distribuidos geográficamente' },
      { label: 'C', text: 'Una aplicación que necesita transacciones ACID estrictas' },
      { label: 'D', text: 'Un sistema de archivos que solo procesa lecturas' },
    ],
    correctAnswer: 'B',
    explanation:
      'Multi-líder brilla cuando hay múltiples centros de datos: cada datacenter tiene su propio líder, reduciendo la latencia de escritura (no necesita cruzar continentes). Para un solo datacenter, la complejidad de resolución de conflictos no se justifica.',
  },
  {
    sectionTitle: 'Replicación Multi-Líder',
    positionAfterHeading: 'Manejo de Conflictos de Escritura',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La estrategia "last write wins" (LWW) puede perder datos de forma silenciosa, incluso cuando todas las escrituras se confirmaron exitosamente.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'LWW resuelve conflictos descartando todas las escrituras concurrentes excepto la que tiene el timestamp más reciente. Esto significa que escrituras confirmadas exitosamente al cliente pueden ser silenciosamente eliminadas durante la resolución de conflictos.',
  },
  {
    sectionTitle: 'Replicación Multi-Líder',
    positionAfterHeading: 'Evitar conflictos',
    sortOrder: 2,
    format: 'mc',
    questionText: '¿Cuál es la estrategia más recomendada para manejar conflictos en multi-líder?',
    options: [
      { label: 'A', text: 'Implementar CRDTs para merge automático' },
      { label: 'B', text: 'Evitar conflictos enrutando escrituras al mismo líder por entidad' },
      { label: 'C', text: 'Usar timestamps para resolver conflictos automáticamente' },
      { label: 'D', text: 'Requerir intervención manual del usuario' },
    ],
    correctAnswer: 'B',
    explanation:
      'El enfoque más simple y frecuentemente recomendado es evitar conflictos por completo: enrutar todas las escrituras de una entidad al mismo líder. Aunque CRDTs son prometedores, la prevención de conflictos es más práctica y predecible.',
  },
  {
    sectionTitle: 'Replicación Multi-Líder',
    positionAfterHeading: 'Topologías de Replicación Multi-Líder',
    sortOrder: 3,
    format: 'mc',
    questionText: '¿Qué problema tiene la topología circular o en estrella en comparación con all-to-all?',
    options: [
      { label: 'A', text: 'Requiere más ancho de banda de red' },
      { label: 'B', text: 'Un solo nodo que falle puede interrumpir el flujo de replicación' },
      { label: 'C', text: 'No soporta más de 3 líderes' },
      { label: 'D', text: 'Tiene mayor latencia en lecturas' },
    ],
    correctAnswer: 'B',
    explanation:
      'En topologías circular y estrella, la falla de un nodo puede interrumpir el flujo de mensajes de replicación entre otros nodos. All-to-all es más tolerante a fallos porque cada nodo envía directamente a todos los demás, aunque tiene su propio problema de ordenamiento de mensajes.',
  },

  // ── Section 4: Replicación sin Líder ────────────────────────────────
  {
    sectionTitle: 'Replicación sin Líder',
    positionAfterHeading: 'Escritura en la base de datos cuando un nodo está caído',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'En replicación sin líder, si un nodo está caído durante una escritura, esa escritura se pierde permanentemente.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'En sistemas leaderless (como Dynamo), las escrituras se envían a múltiples réplicas en paralelo. Si un nodo está caído, la escritura sigue teniendo éxito en los otros nodos. Cuando el nodo caído se recupera, se actualiza mediante read repair o anti-entropy.',
  },
  {
    sectionTitle: 'Replicación sin Líder',
    positionAfterHeading: 'Quórum para lectura y escritura',
    sortOrder: 1,
    format: 'mc',
    questionText:
      'Si hay n=5 réplicas y w=3, ¿cuál es el valor mínimo de r para garantizar lectura actualizada?',
    options: [
      { label: 'A', text: 'r = 2' },
      { label: 'B', text: 'r = 3' },
      { label: 'C', text: 'r = 4' },
      { label: 'D', text: 'r = 5' },
    ],
    correctAnswer: 'B',
    explanation:
      'La condición de quórum es w + r > n. Con n=5 y w=3, necesitamos r > 5-3 = 2, es decir r ≥ 3. Con r=3, tenemos w+r = 6 > 5, garantizando al menos un nodo en común entre los conjuntos de escritura y lectura.',
  },
  {
    sectionTitle: 'Replicación sin Líder',
    positionAfterHeading: 'Limitaciones de la Consistencia de Quórum',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Si w + r > n se cumple, la base de datos garantiza que siempre leerás el valor más reciente.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Incluso con w + r > n, hay edge cases: escrituras concurrentes con conflictos de orden, escrituras concurrentes con lecturas, nodos que fallan durante la escritura con menos de w confirmaciones restaurados desde un nodo obsoleto, y otros escenarios. El quórum es probabilístico, no una garantía absoluta.',
  },
  {
    sectionTitle: 'Replicación sin Líder',
    positionAfterHeading: 'Cuórums relajados y entrega con sugerencia',
    sortOrder: 3,
    format: 'mc',
    questionText: '¿Qué sacrificio implica usar sloppy quorums?',
    options: [
      { label: 'A', text: 'Mayor latencia de escritura' },
      { label: 'B', text: 'Menor disponibilidad del sistema' },
      { label: 'C', text: 'No se garantiza leer el valor más reciente (w + r > n ya no aplica)' },
      { label: 'D', text: 'Se requieren más nodos en el cluster' },
    ],
    correctAnswer: 'C',
    explanation:
      'Los sloppy quorums aceptan escrituras en nodos que no son los "home" del dato (hinted handoff). Esto aumenta la disponibilidad de escritura, pero rompe la garantía de quórum: los nodos de lectura pueden no incluir al nodo temporal que aceptó la escritura.',
  },

  // ── Section 5: Escrituras Concurrentes ──────────────────────────────
  {
    sectionTitle: 'Escrituras Concurrentes',
    positionAfterHeading: 'Última escritura gana (descartando escrituras concurrentes)',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'En "last write wins" (LWW), el orden de las escrituras se determina por el timestamp de la operación, lo cual siempre refleja el orden real en que ocurrieron.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Los timestamps no son confiables en sistemas distribuidos: los relojes de diferentes nodos no están perfectamente sincronizados. LWW asigna un orden artificial basado en timestamps, que puede no reflejar la causalidad real de las operaciones.',
  },
  {
    sectionTitle: 'Escrituras Concurrentes',
    positionAfterHeading: 'La relación "sucede antes" y la concurrencia',
    sortOrder: 1,
    format: 'mc',
    questionText: '¿Cuándo se consideran "concurrentes" dos operaciones A y B?',
    options: [
      { label: 'A', text: 'Cuando ocurren exactamente al mismo tiempo' },
      { label: 'B', text: 'Cuando ninguna de las dos sabe de la otra al momento de ejecutarse' },
      { label: 'C', text: 'Cuando ambas modifican el mismo registro' },
      { label: 'D', text: 'Cuando provienen de diferentes clientes' },
    ],
    correctAnswer: 'B',
    explanation:
      'La concurrencia en sistemas distribuidos no depende del tiempo real (pueden ocurrir en momentos diferentes). Dos operaciones son concurrentes si ninguna "sabe" de la otra — es decir, ninguna puede haber sido causada por la otra. Si A causó B, son secuenciales (happens-before), no concurrentes.',
  },
  {
    sectionTitle: 'Escrituras Concurrentes',
    positionAfterHeading: 'Fusión de valores escritos concurrentemente',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué estructura de datos permite rastrear la causalidad en replicación sin líder con múltiples réplicas?',
    options: [
      { label: 'A', text: 'Timestamps lógicos de Lamport' },
      { label: 'B', text: 'Vectores de versión' },
      { label: 'C', text: 'Merkle trees' },
      { label: 'D', text: 'Bloom filters' },
    ],
    correctAnswer: 'B',
    explanation:
      'Los vectores de versión mantienen un contador de versión por réplica (no solo por clave), permitiendo distinguir entre escrituras que se sobreescriben (causales) y escrituras concurrentes que deben fusionarse. Los Lamport timestamps solo dan un orden total, no detectan concurrencia.',
  },

  // ── Additional quizzes for coverage ─────────────────────────────────
  {
    sectionTitle: 'Líderes y Seguidores',
    positionAfterHeading: 'Líderes y Seguidores',
    sortOrder: 4,
    format: 'mc',
    questionText: '¿Cuál es la responsabilidad principal de un seguidor en la replicación basada en líder?',
    options: [
      { label: 'A', text: 'Procesar escrituras de los clientes cuando el líder está ocupado' },
      { label: 'B', text: 'Aplicar los cambios del líder en el mismo orden y servir lecturas' },
      { label: 'C', text: 'Votar en el proceso de elección de líder' },
      { label: 'D', text: 'Resolver conflictos entre escrituras concurrentes' },
    ],
    correctAnswer: 'B',
    explanation:
      'En replicación basada en líder, los seguidores solo reciben y aplican el log de cambios del líder, manteniéndose como una copia del líder. Pueden servir lecturas pero NO aceptan escrituras directas de clientes. La elección de líder y la resolución de conflictos son aspectos del failover y multi-líder, respectivamente.',
  },
  {
    sectionTitle: 'Problemas con el Retraso de Replicación',
    positionAfterHeading: 'Soluciones para el Retraso de Replicación',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'Las transacciones son la única forma de proporcionar garantías más fuertes en sistemas con retraso de replicación.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Aunque las transacciones son una herramienta importante, no son la única solución. Técnicas como enrutar lecturas al líder después de una escritura (read-your-writes), asignar usuarios a réplicas específicas (lecturas monotónicas), y causal consistency a nivel de la aplicación también proporcionan garantías sin necesitar transacciones.',
  },
  {
    sectionTitle: 'Replicación sin Líder',
    positionAfterHeading: 'Reparación de lectura y anti-entropía',
    sortOrder: 4,
    format: 'mc',
    questionText: '¿Cuál es la diferencia principal entre read repair y anti-entropy?',
    options: [
      { label: 'A', text: 'Read repair es más rápido que anti-entropy' },
      { label: 'B', text: 'Read repair ocurre durante lecturas del cliente; anti-entropy es un proceso de fondo' },
      { label: 'C', text: 'Anti-entropy solo funciona con quórum estricto' },
      { label: 'D', text: 'Read repair requiere coordinación con el líder' },
    ],
    correctAnswer: 'B',
    explanation:
      'Read repair detecta y corrige datos obsoletos cuando un cliente lee de múltiples réplicas y nota versiones inconsistentes. Anti-entropy es un proceso de fondo que compara datos entre réplicas periódicamente. Ambos son complementarios y no requieren un líder.',
  },
  {
    sectionTitle: 'Replicación Multi-Líder',
    positionAfterHeading: 'Clientes con operación sin conexión',
    sortOrder: 4,
    format: 'tf',
    questionText:
      'Una aplicación móvil que funciona offline y sincroniza al reconectarse es esencialmente un caso de replicación multi-líder.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Cada dispositivo actúa como un "líder" local que acepta escrituras sin conexión. Al reconectarse, debe sincronizar con el servidor (otro líder), resolviendo posibles conflictos. Es exactamente el modelo multi-líder con replicación asíncrona.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching Ch5 section IDs from Supabase...\n');

  // Fetch all sections for ddia-ch5
  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch5')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch5. Run seed-sections.ts first.');
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

  console.log('\nCleared existing quizzes for Ch5 sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch5`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to missing sections)`);
  }

  // Summary by section
  const countBySection = new Map<string, number>();
  for (const q of toInsert) {
    const title = [...titleToId.entries()].find(([, id]) => id === q.section_id)?.[0] ?? 'unknown';
    countBySection.set(title, (countBySection.get(title) ?? 0) + 1);
  }
  console.log('\nPer-section breakdown:');
  for (const [title, count] of countBySection) {
    console.log(`  ${title}: ${count} quizzes`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
