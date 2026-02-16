#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch7 (Transactions) sections.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-ch7.ts
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
  // ── Section 0: Conceptos de Transacciones y ACID ──────────────────────

  {
    sectionTitle: 'Conceptos de Transacciones y ACID',
    positionAfterHeading: 'El Significado de ACID',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Qué significa realmente "Atomicity" en el contexto de ACID?',
    options: [
      { label: 'A', text: 'Que las operaciones son indivisibles a nivel de CPU' },
      { label: 'B', text: 'Que si una transacción falla en algún punto, todas sus escrituras se deshacen completamente' },
      { label: 'C', text: 'Que las transacciones se ejecutan sin interrupción' },
      { label: 'D', text: 'Que no puede haber concurrencia durante la transacción' },
    ],
    correctAnswer: 'B',
    explanation:
      'En ACID, atomicidad NO se refiere a concurrencia ni a indivisibilidad. Significa "abortability": si algo sale mal en cualquier punto de la transacción, todo se revierte. No hay escrituras parciales. Kleppmann sugiere que "abortability" sería un nombre más preciso.',
  },
  {
    sectionTitle: 'Conceptos de Transacciones y ACID',
    positionAfterHeading: 'El Significado de ACID',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La "C" (Consistency) en ACID es una propiedad de la base de datos que se implementa internamente en el motor.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Consistency en ACID es una propiedad de la APLICACIÓN, no de la base de datos. La aplicación define los invariantes (ej: "créditos = débitos"). La DB proporciona atomicidad y aislamiento como herramientas, pero es la aplicación quien debe escribir transacciones que preserven los invariantes. Kleppmann dice que la "C" es un relleno para completar el acrónimo.',
  },
  {
    sectionTitle: 'Conceptos de Transacciones y ACID',
    positionAfterHeading: 'Single-Object vs Multi-Object Operations',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿En qué caso son necesarias las transacciones multi-object?',
    options: [
      { label: 'A', text: 'Para cualquier operación INSERT' },
      { label: 'B', text: 'Cuando necesitas actualizar un registro y sus índices secundarios de forma consistente' },
      { label: 'C', text: 'Solo para bases de datos relacionales' },
      { label: 'D', text: 'Cuando el documento es mayor a 16KB' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las transacciones multi-object son necesarias cuando una operación lógica toca múltiples objetos: actualizar una fila y sus índices, insertar en una tabla y actualizar foreign keys en otra, transferir dinero entre cuentas. Sin ellas, un fallo entre las escrituras deja datos inconsistentes.',
  },

  // ── Section 1: Niveles de Aislamiento Débil ───────────────────────────

  {
    sectionTitle: 'Niveles de Aislamiento Débil',
    positionAfterHeading: 'Read Committed',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué dos garantías proporciona el nivel de aislamiento Read Committed?',
    options: [
      { label: 'A', text: 'No dirty reads: solo lees datos que han sido commiteados' },
      { label: 'B', text: 'No dirty writes: solo sobrescribes datos que han sido commiteados' },
      { label: 'C', text: 'No read skew: siempre ves un snapshot consistente' },
      { label: 'D', text: 'No lost updates: las actualizaciones concurrentes nunca se pierden' },
    ],
    correctAnswer: '[A,B]',
    explanation:
      'Read Committed solo garantiza no dirty reads y no dirty writes. NO previene read skew (ver datos de diferentes puntos en el tiempo) ni lost updates. Es el nivel por defecto en PostgreSQL, Oracle y SQL Server, pero deja vulnerabilidades de concurrencia significativas.',
    justificationHint:
      'Alice ve $500 en cuenta 1 (antes de la transferencia) y $600 en cuenta 2 (después de la transferencia). Ambas lecturas son de datos commiteados, pero son de diferentes puntos en el tiempo. Eso es read skew y Read Committed lo permite.',
  },
  {
    sectionTitle: 'Niveles de Aislamiento Débil',
    positionAfterHeading: 'Snapshot Isolation (Aislamiento por Instantánea)',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cómo implementa la base de datos snapshot isolation?',
    options: [
      { label: 'A', text: 'Bloqueando todas las escrituras durante la lectura' },
      { label: 'B', text: 'Usando MVCC: manteniendo múltiples versiones de cada objeto y aplicando reglas de visibilidad por transaction ID' },
      { label: 'C', text: 'Haciendo una copia completa de la base de datos al inicio de cada transacción' },
      { label: 'D', text: 'Usando timestamps de reloj del sistema para ordenar las operaciones' },
    ],
    correctAnswer: 'B',
    explanation:
      'Multi-Version Concurrency Control (MVCC) mantiene múltiples versiones de cada fila. Cada transacción recibe un ID al comenzar. Las lecturas solo ven versiones creadas por transacciones con ID menor que ya estaban commiteadas. Esto permite que lectores y escritores no se bloqueen mutuamente.',
  },
  {
    sectionTitle: 'Niveles de Aislamiento Débil',
    positionAfterHeading: 'Snapshot Isolation (Aislamiento por Instantánea)',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'En Oracle, el nivel de aislamiento llamado "SERIALIZABLE" realmente implementa serializabilidad completa.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'En Oracle, lo que llaman "SERIALIZABLE" es en realidad snapshot isolation — no proporciona serializabilidad verdadera. Permite write skew y phantoms. PostgreSQL también llamaba a snapshot isolation "REPEATABLE READ" (antes de la versión 9.1). Las inconsistencias en nomenclatura entre bases de datos son una fuente constante de confusión.',
  },

  // ── Section 2: Prevención de Actualizaciones Perdidas ─────────────────

  {
    sectionTitle: 'Prevención de Actualizaciones Perdidas',
    positionAfterHeading: 'Prevención de Actualizaciones Perdidas',
    sortOrder: 0,
    format: 'mc',
    questionText:
      'Dos usuarios incrementan un contador simultáneamente. ¿Cuál solución es la más simple y segura?',
    options: [
      { label: 'A', text: 'Leer el valor, sumar 1, y escribir el resultado' },
      { label: 'B', text: 'Usar UPDATE counters SET value = value + 1, que la base de datos ejecuta atómicamente' },
      { label: 'C', text: 'Usar un lock distribuido externo' },
      { label: 'D', text: 'Desactivar concurrencia para esa tabla' },
    ],
    correctAnswer: 'B',
    explanation:
      'La operación atómica UPDATE value = value + 1 es ejecutada por la DB como una unidad indivisible: toma un lock, lee, incrementa y escribe sin que otra transacción pueda interferir. El patrón read-modify-write manual (opción A) es exactamente lo que causa lost updates.',
  },
  {
    sectionTitle: 'Prevención de Actualizaciones Perdidas',
    positionAfterHeading: '2. Explicit Locking (FOR UPDATE)',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'SELECT FOR UPDATE bloquea las filas seleccionadas para que otras transacciones no puedan modificarlas hasta que la transacción actual commitee.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'FOR UPDATE indica a la base de datos que planeas actualizar las filas retornadas. La DB toma un lock exclusivo sobre ellas. Cualquier otra transacción que intente SELECT FOR UPDATE o UPDATE sobre las mismas filas se bloqueará hasta que la primera commitee o aborte.',
  },
  {
    sectionTitle: 'Prevención de Actualizaciones Perdidas',
    positionAfterHeading: '4. Compare-and-Set (CAS)',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Por qué compare-and-set puede fallar silenciosamente en detectar lost updates?',
    options: [
      { label: 'A', text: 'Porque no funciona con tipos de datos string' },
      { label: 'B', text: 'Porque si la DB evalúa la condición WHERE sobre un snapshot MVCC desactualizado, puede ver el valor viejo y permitir la escritura' },
      { label: 'C', text: 'Porque CAS solo funciona en bases de datos in-memory' },
      { label: 'D', text: 'Porque las redes pueden perder el resultado' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si la base de datos lee el valor para evaluar la condición WHERE desde un snapshot (como en snapshot isolation), puede ver el valor viejo incluso si otra transacción ya lo cambió. La condición se cumple sobre datos stale, y la escritura se aplica, perdiendo la actualización de la otra transacción.',
  },

  // ── Section 3: Write Skew y Phantoms ──────────────────────────────────

  {
    sectionTitle: 'Write Skew y Phantoms',
    positionAfterHeading: 'El Ejemplo Clásico: Doctores de Guardia',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Qué diferencia al write skew del lost update?',
    options: [
      { label: 'A', text: 'Write skew es más rápido de ejecutar' },
      { label: 'B', text: 'En write skew, las transacciones escriben objetos DIFERENTES basándose en datos que ambas leyeron, violando un invariante colectivamente' },
      { label: 'C', text: 'Lost update solo ocurre en bases de datos relacionales' },
      { label: 'D', text: 'Write skew solo ocurre con más de 3 transacciones concurrentes' },
    ],
    correctAnswer: 'B',
    explanation:
      'En lost update, dos transacciones escriben el MISMO objeto. En write skew, escriben objetos DIFERENTES, pero basan su decisión en datos que la otra transacción está a punto de invalidar. Cada escritura es válida individualmente, pero colectivamente violan el invariante.',
  },
  {
    sectionTitle: 'Write Skew y Phantoms',
    positionAfterHeading: 'Phantoms',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'SELECT FOR UPDATE puede prevenir phantoms porque lockea todas las filas que cumplen la condición, incluyendo las que aún no existen.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'SELECT FOR UPDATE solo toma locks sobre filas que EXISTEN y que el SELECT retorna. Si el phantom es un INSERT de una fila que no existe aún, no hay nada que lockear. Por eso los phantoms son particularmente difíciles de prevenir con locks — necesitas predicate locks o index-range locks.',
  },
  {
    sectionTitle: 'Write Skew y Phantoms',
    positionAfterHeading: 'Materializing Conflicts',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué es "materializing conflicts" y por qué es considerado un hack?',
    options: [
      { label: 'A', text: 'Es una técnica de compresión de logs de conflictos' },
      { label: 'B', text: 'Es pre-crear filas artificiales solo para poder tomar locks sobre ellas, contaminando el modelo de datos' },
      { label: 'C', text: 'Es un algoritmo de detección de deadlocks' },
      { label: 'D', text: 'Es una técnica de particionamiento para reducir conflictos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Para el ejemplo de meeting rooms: pre-creas una fila por cada combinación sala+horario. Reservar se convierte en un UPDATE (no INSERT), permitiendo usar FOR UPDATE. Es un hack porque creas una tabla artificial que no tiene valor de negocio, solo existe para habilitar locking. Es preferible usar aislamiento serializable.',
  },

  // ── Section 4: Serializabilidad ───────────────────────────────────────

  {
    sectionTitle: 'Serializabilidad',
    positionAfterHeading: '1. Ejecución Serial Real (Actual Serial Execution)',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué condiciones hacen viable la ejecución serial real (un solo thread)?',
    options: [
      { label: 'A', text: 'Que el dataset completo quepa en memoria (sin I/O de disco)' },
      { label: 'B', text: 'Que las transacciones sean cortas y rápidas (stored procedures, sin esperas de red)' },
      { label: 'C', text: 'Que haya menos de 100 usuarios concurrentes' },
      { label: 'D', text: 'Que la base de datos use SSDs en lugar de HDDs' },
    ],
    correctAnswer: '[A,B]',
    explanation:
      'Si todo cabe en RAM, no hay espera de I/O. Si las transacciones son stored procedures (toda la lógica en un request), no hay espera de round-trips del cliente. Un solo thread de VoltDB o Redis puede procesar decenas de miles de transacciones por segundo bajo estas condiciones.',
    justificationHint:
      'Imagina una transacción que espera input del usuario: el thread se bloquea segundos mientras el usuario piensa. En ejecución serial, eso bloquea a TODAS las demás transacciones.',
  },
  {
    sectionTitle: 'Serializabilidad',
    positionAfterHeading: '2. Two-Phase Locking (2PL)',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia fundamental entre snapshot isolation y 2PL respecto a cómo tratan lectores y escritores?',
    options: [
      { label: 'A', text: 'No hay diferencia, ambos usan MVCC' },
      { label: 'B', text: 'En snapshot isolation, lectores no bloquean escritores. En 2PL, lectores SÍ bloquean escritores y viceversa' },
      { label: 'C', text: '2PL es más rápido porque usa locks optimistas' },
      { label: 'D', text: 'Snapshot isolation bloquea a todos, 2PL no bloquea a nadie' },
    ],
    correctAnswer: 'B',
    explanation:
      'En snapshot isolation (MVCC), las lecturas ven un snapshot viejo y nunca bloquean a los escritores. En 2PL, si una transacción ha leído un objeto, NADIE puede escribirlo hasta que commitee. Esto es significativamente más restrictivo pero previene todas las anomalías de concurrencia, incluyendo write skew.',
  },
  {
    sectionTitle: 'Serializabilidad',
    positionAfterHeading: '3. Serializable Snapshot Isolation (SSI)',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cómo funciona SSI (Serializable Snapshot Isolation)?',
    options: [
      { label: 'A', text: 'Ejecuta transacciones en serie, una a la vez' },
      { label: 'B', text: 'Es un control de concurrencia optimista: ejecuta sin bloquear y al commitear verifica si hubo violaciones de serializabilidad' },
      { label: 'C', text: 'Usa locks pesimistas como 2PL pero con timeouts más cortos' },
      { label: 'D', text: 'Replica la transacción en múltiples nodos y verifica consenso' },
    ],
    correctAnswer: 'B',
    explanation:
      'SSI es optimista: las transacciones se ejecutan contra un snapshot (como snapshot isolation) sin bloquear a nadie. Al hacer commit, la DB verifica si la transacción leyó datos que ya fueron modificados por otra transacción commiteada, o si sus escrituras afectan lecturas de transacciones en curso. Si detecta un conflicto, aborta la transacción.',
  },
  {
    sectionTitle: 'Serializabilidad',
    positionAfterHeading: 'Comparación de los Tres Enfoques',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'SSI siempre tiene mejor rendimiento que 2PL, sin importar el nivel de contención.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'SSI funciona bien con baja contención (pocas transacciones tocan los mismos datos) porque los aborts son raros. Con alta contención, muchas transacciones se abortan y deben reintentarse, desperdiciando trabajo. En ese caso, 2PL puede ser mejor porque las transacciones esperan en vez de ser abortadas y rehechas.',
  },
];

async function main() {
  console.log('Fetching Ch7 section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch7')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch7. Seed sections first.');
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections:`);
  const titleToId = new Map<string, string>();
  for (const s of sections) {
    console.log(`  ${s.section_title} → ${s.id}`);
    titleToId.set(s.section_title, s.id);
  }

  const sectionIds = sections.map((s) => s.id);
  const { error: deleteError } = await supabase
    .from('inline_quizzes')
    .delete()
    .in('section_id', sectionIds);

  if (deleteError) {
    console.error('Error clearing existing quizzes:', deleteError);
    process.exit(1);
  }

  console.log('\nCleared existing quizzes for Ch7 sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch7`);
  if (skipped > 0) {
    console.log(`  (${skipped} skipped due to missing sections)`);
  }

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
