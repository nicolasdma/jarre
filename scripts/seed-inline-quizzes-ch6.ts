#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch6 (Partitioning) sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-ch6.ts
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
  // ── Section 0: Estrategias de Particionamiento ────────────────────────

  {
    sectionTitle: 'Estrategias de Particionamiento',
    positionAfterHeading: 'Particionamiento de Datos Clave-Valor',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'La forma más simple de evitar hot spots es asignar registros a nodos de forma aleatoria.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Aunque la asignación aleatoria distribuye datos uniformemente, tiene una desventaja fatal: al buscar un registro específico, no sabes en qué nodo está, así que tendrías que consultar todos los nodos en paralelo. Las estrategias por rango o hash permiten localizar el nodo correcto directamente.',
  },
  {
    sectionTitle: 'Estrategias de Particionamiento',
    positionAfterHeading: 'Particionamiento por Rango de Claves',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Cuál es la principal ventaja del particionamiento por rango de claves?',
    options: [
      { label: 'A', text: 'Distribuye la carga de escritura uniformemente' },
      { label: 'B', text: 'Permite range scans eficientes dentro de una partición' },
      { label: 'C', text: 'Elimina completamente los hot spots' },
      { label: 'D', text: 'No requiere conocer los límites entre particiones' },
    ],
    correctAnswer: 'B',
    explanation:
      'Al mantener las claves ordenadas dentro de cada partición, los range scans son muy eficientes: puedes obtener todos los registros entre key_min y key_max de una sola partición. Esto es ideal para datos de series temporales con prefijo de sensor.',
    justificationHint:
      'Piensa en la analogía de la enciclopedia: los volúmenes A-B, C-D, etc. permiten buscar rangos rápidamente porque los datos están ordenados dentro de cada volumen.',
  },
  {
    sectionTitle: 'Estrategias de Particionamiento',
    positionAfterHeading: 'Particionamiento por Hash de la Clave',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué propiedad se pierde al usar particionamiento por hash en vez de por rango?',
    options: [
      { label: 'A', text: 'La tolerancia a fallos' },
      { label: 'B', text: 'La capacidad de hacer range queries eficientes' },
      { label: 'C', text: 'La capacidad de agregar nuevos nodos' },
      { label: 'D', text: 'La consistencia de los datos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Al hashear las claves, claves que eran adyacentes se dispersan por diferentes particiones. Esto destruye el orden y hace que los range queries deban enviarse a todas las particiones (scatter/gather), perdiendo la eficiencia.',
  },
  {
    sectionTitle: 'Estrategias de Particionamiento',
    positionAfterHeading: 'Hashing Consistente',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'El término "hashing consistente" se refiere a mantener consistencia entre réplicas.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'A pesar de su nombre, "hashing consistente" no tiene relación con la consistencia de réplicas (Ch5) ni con consistencia ACID (Ch7). Se refiere a una técnica para distribuir carga usando límites de partición elegidos al azar, evitando la necesidad de control centralizado. Kleppmann recomienda llamarlo simplemente "hash partitioning".',
  },

  // ── Section 1: Cargas Sesgadas y Puntos Calientes ─────────────────────

  {
    sectionTitle: 'Cargas Sesgadas y Puntos Calientes',
    positionAfterHeading: 'Cargas de Trabajo Sesgadas y Alivio de Puntos Calientes',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Qué técnica se puede usar para aliviar un hot spot cuando una clave específica recibe demasiadas escrituras?',
    options: [
      { label: 'A', text: 'Agregar más réplicas al nodo caliente' },
      { label: 'B', text: 'Agregar un número aleatorio como prefijo/sufijo a la clave' },
      { label: 'C', text: 'Usar particionamiento por rango en vez de hash' },
      { label: 'D', text: 'Duplicar los datos en todos los nodos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Al agregar un número aleatorio (ej: 2 dígitos = 100 variantes), las escrituras a esa clave se distribuyen entre ~100 particiones distintas. El tradeoff: las lecturas ahora deben consultar las 100 variantes y combinar los resultados.',
    justificationHint:
      'Piensa en el problema del celebrity tweet: todos escriben a la misma clave. Si la clave es "user_123" y le agregás un sufijo aleatorio "user_123_42", las escrituras se reparten. Pero ¿qué pasa cuando querés LEER todos los datos de user_123?',
  },
  {
    sectionTitle: 'Cargas Sesgadas y Puntos Calientes',
    positionAfterHeading: 'Cargas de Trabajo Sesgadas y Alivio de Puntos Calientes',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'La mayoría de los sistemas de datos actuales pueden detectar y compensar automáticamente las cargas de trabajo altamente sesgadas.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Hoy en día, la mayoría de los sistemas NO compensan automáticamente las cargas sesgadas. Es responsabilidad de la aplicación implementar técnicas como la dispersión de claves. Quizás en el futuro los sistemas lo hagan automáticamente.',
  },

  // ── Section 2: Índices Secundarios Particionados ──────────────────────

  {
    sectionTitle: 'Índices Secundarios Particionados',
    positionAfterHeading: 'Particionamiento e Índices Secundarios',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Los índices secundarios identifican un registro de forma única, igual que una clave primaria.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'A diferencia de las claves primarias, los índices secundarios NO identifican registros de forma única. Son una forma de buscar ocurrencias de un valor particular: "todos los autos rojos", "todos los artículos con la palabra X". Múltiples registros pueden compartir el mismo valor en un índice secundario.',
  },
  {
    sectionTitle: 'Índices Secundarios Particionados',
    positionAfterHeading: 'Particionamiento de Índices Secundarios por Documento',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Qué problema tiene el enfoque de índices secundarios particionados por documento (índice local)?',
    options: [
      { label: 'A', text: 'Las escrituras deben actualizarse en todas las particiones' },
      { label: 'B', text: 'Las lecturas requieren scatter/gather a todas las particiones' },
      { label: 'C', text: 'No soporta más de un índice secundario' },
      { label: 'D', text: 'Requiere transacciones distribuidas para funcionar' },
    ],
    correctAnswer: 'B',
    explanation:
      'Con índices locales, cada partición mantiene su propio índice solo para sus documentos. Las escrituras son simples (una sola partición), pero las lecturas por índice secundario deben hacer scatter/gather: consultar TODAS las particiones y combinar resultados, lo que es costoso y propenso a tail latency amplification.',
    justificationHint:
      'Imagina un marketplace de autos: los autos rojos están en la partición 0 Y en la partición 1. Si buscás "color:rojo", ¿a cuántas particiones tenés que preguntar? ¿Por qué eso es un problema de rendimiento?',
  },
  {
    sectionTitle: 'Índices Secundarios Particionados',
    positionAfterHeading: 'Particionamiento de Índices Secundarios por Término',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es el tradeoff principal del índice global (particionado por término)?',
    options: [
      { label: 'A', text: 'Lecturas más rápidas pero escrituras más lentas y complejas' },
      { label: 'B', text: 'Escrituras más rápidas pero lecturas requieren scatter/gather' },
      { label: 'C', text: 'No soporta range queries sobre el índice' },
      { label: 'D', text: 'Requiere ZooKeeper para funcionar' },
    ],
    correctAnswer: 'A',
    explanation:
      'El índice global (term-partitioned) hace las lecturas eficientes: solo necesitás consultar la partición que contiene el término buscado. Pero las escrituras son más complejas: un solo documento puede afectar múltiples particiones del índice (una por cada término). Las actualizaciones suelen ser asíncronas.',
  },

  // ── Section 3: Rebalanceo de Particiones ──────────────────────────────

  {
    sectionTitle: 'Rebalanceo de Particiones',
    positionAfterHeading: 'Cómo no hacerlo: hash mod N',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Por qué hash(key) mod N es una mala estrategia de particionamiento?',
    options: [
      { label: 'A', text: 'Porque la función hash produce colisiones frecuentes' },
      { label: 'B', text: 'Porque al cambiar N (agregar/quitar nodos), la mayoría de claves deben moverse' },
      { label: 'C', text: 'Porque no distribuye las claves uniformemente' },
      { label: 'D', text: 'Porque requiere hash functions criptográficas' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si hash(key) = 123456 y hay 10 nodos, la clave va al nodo 6 (123456 mod 10). Si agregas 1 nodo (N=11), ahora va al nodo 3 (123456 mod 11). Casi todas las claves cambian de nodo, causando un rebalanceo masivo e innecesario.',
    justificationHint:
      'Calculá: 123456 mod 10 = 6. Ahora 123456 mod 11 = 3. ¿Y mod 12? = 0. ¿Ves el patrón? Cada vez que cambia N, cambia el destino. ¿Qué impacto tiene mover tantos datos en la red?',
  },
  {
    sectionTitle: 'Rebalanceo de Particiones',
    positionAfterHeading: 'Número fijo de particiones',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Con número fijo de particiones, al agregar un nodo nuevo NO se necesita reparticionar las claves.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Con particiones fijas (ej: 1000 particiones en 10 nodos = 100 por nodo), un nodo nuevo simplemente "roba" particiones completas de los nodos existentes. Las claves no cambian de partición; solo cambia la asignación de particiones a nodos. Es mucho más eficiente que hash mod N.',
  },
  {
    sectionTitle: 'Rebalanceo de Particiones',
    positionAfterHeading: 'Particionamiento dinámico',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué problema tiene el particionamiento dinámico con una base de datos vacía?',
    options: [
      { label: 'A', text: 'No puede determinar los límites de las particiones' },
      { label: 'B', text: 'Todas las escrituras van a una sola partición hasta que crece lo suficiente para dividirse' },
      { label: 'C', text: 'Requiere un nodo coordinador centralizado' },
      { label: 'D', text: 'No soporta hash partitioning' },
    ],
    correctAnswer: 'B',
    explanation:
      'Una DB vacía empieza con UNA partición. Todas las escrituras van ahí hasta que alcanza el umbral de split (ej: 10GB en HBase). Mientras tanto, los demás nodos están ociosos. La solución es pre-splitting: configurar particiones iniciales, aunque requiere conocer la distribución de claves.',
  },
  {
    sectionTitle: 'Rebalanceo de Particiones',
    positionAfterHeading: 'Particionamiento proporcional a los nodos',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'En el particionamiento proporcional a los nodos, el número de particiones crece cuando crece el dataset.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'En este enfoque (usado por Cassandra), el número de particiones es proporcional al número de NODOS, no al tamaño del dataset. Cada nodo tiene un número fijo de particiones (256 por defecto en Cassandra). Al agregar nodos, el número de particiones crece; al crecer solo los datos, las particiones se hacen más grandes.',
  },
  {
    sectionTitle: 'Rebalanceo de Particiones',
    positionAfterHeading: 'Operaciones: Rebalanceo Automático o Manual',
    sortOrder: 4,
    format: 'mc2',
    questionText:
      '¿Por qué puede ser peligroso el rebalanceo completamente automático?',
    options: [
      { label: 'A', text: 'Porque el algoritmo es impredecible y puede perder datos' },
      { label: 'B', text: 'Porque puede confundir un nodo lento con un nodo muerto y empeorar la situación' },
      { label: 'C', text: 'Porque requiere detener la base de datos durante el proceso' },
      { label: 'D', text: 'Porque no respeta la localidad de datos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si un nodo está temporalmente sobrecargado (lento pero no muerto), el detector de fallos automático puede concluir que está muerto y disparar un rebalanceo. Esto agrega más carga al nodo sobrecargado y a la red, potencialmente causando un fallo en cascada. Un humano en el loop puede evitar estas decisiones contraproducentes.',
    justificationHint:
      'Imagina: un nodo responde lento → el sistema asume que murió → inicia rebalanceo → mueve datos DESDE el nodo lento → el nodo se sobrecarga aún más → ahora sí muere. ¿Cómo un operador humano manejaría mejor esto?',
  },

  // ── Section 4: Enrutamiento de Solicitudes ────────────────────────────

  {
    sectionTitle: 'Enrutamiento de Solicitudes',
    positionAfterHeading: 'Enrutamiento de Solicitudes',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuáles son los tres enfoques principales para el enrutamiento de solicitudes a la partición correcta?',
    options: [
      { label: 'A', text: 'DNS, load balancer, service mesh' },
      { label: 'B', text: 'Cualquier nodo reenvía, routing tier dedicado, cliente partition-aware' },
      { label: 'C', text: 'ZooKeeper, gossip protocol, coordinador centralizado' },
      { label: 'D', text: 'Round-robin, hashing consistente, asignación estática' },
    ],
    correctAnswer: 'B',
    explanation:
      'Los tres enfoques son: (1) contactar cualquier nodo, que reenvía si no es el correcto; (2) un routing tier que actúa como load balancer partition-aware; (3) que el cliente mismo sepa qué partición contiene cada clave. ZooKeeper/gossip son mecanismos para mantener el metadata actualizado, no enfoques de routing en sí.',
  },
  {
    sectionTitle: 'Enrutamiento de Solicitudes',
    positionAfterHeading: 'Enrutamiento de Solicitudes',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'Cassandra y Riak usan ZooKeeper para el enrutamiento de solicitudes.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Cassandra y Riak NO usan ZooKeeper. En cambio, usan un gossip protocol entre los nodos para diseminar cambios en el estado del cluster. Las solicitudes pueden enviarse a cualquier nodo, que reenviará al nodo correcto. HBase, SolrCloud y Kafka sí usan ZooKeeper.',
  },
  {
    sectionTitle: 'Enrutamiento de Solicitudes',
    positionAfterHeading: 'Ejecución Paralela de Consultas',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'Las bases de datos MPP (massively parallel processing) pueden dividir una query compleja en múltiples etapas que se ejecutan en paralelo en diferentes nodos.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Las bases de datos MPP, usadas principalmente en analytics/data warehousing, tienen optimizadores de queries sofisticados que descomponen queries complejas (con joins, filtros, agregaciones) en etapas de ejecución paralela distribuidas entre los nodos del cluster.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching Ch6 section IDs from Supabase...\n');

  // Fetch all sections for ddia-ch6
  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch6')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch6. Run reseed-ch6-sections.ts first.');
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

  console.log('\nCleared existing quizzes for Ch6 sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch6`);
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
