#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch11 (Stream Processing) sections.
 *
 * Fetches section IDs from Supabase, then inserts MC/TF/MC2 quizzes
 * positioned after specific bold headings in the content.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-ch11.ts
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
  // ── Section 0: Transmisión de Flujos de Eventos ─────────────────────────

  {
    sectionTitle: 'Transmisión de Flujos de Eventos',
    positionAfterHeading: 'Transmisión de Flujos de Eventos',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia fundamental entre un sistema de mensajería y una base de datos en el contexto del procesamiento de flujos?',
    options: [
      { label: 'A', text: 'Un sistema de mensajería persiste datos y una base de datos no' },
      { label: 'B', text: 'Un sistema de mensajería notifica activamente a los consumidores de nuevos eventos, mientras que una base de datos espera a que se le consulte' },
      { label: 'C', text: 'Una base de datos puede manejar más throughput que un sistema de mensajería' },
      { label: 'D', text: 'Un sistema de mensajería garantiza exactamente una entrega y una base de datos no' },
    ],
    correctAnswer: 'B',
    explanation:
      'La distinción clave es el modelo push vs pull: un sistema de mensajería notifica proactivamente a los suscriptores cuando llega un nuevo evento, mientras que una base de datos almacena datos pasivamente esperando queries. Esto no tiene que ver con persistencia (los brokers modernos persisten) ni con throughput o garantías de entrega.',
  },
  {
    sectionTitle: 'Transmisión de Flujos de Eventos',
    positionAfterHeading: 'Sistemas de mensajería',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'En un sistema de mensajería pub/sub, si los consumidores procesan mensajes más lento de lo que el productor los envía, el sistema siempre descarta los mensajes sobrantes.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Hay tres estrategias ante esta situación: (1) descartar mensajes (drop), (2) almacenarlos en buffer (lo cual puede agotar memoria o disco), o (3) aplicar backpressure/flow control para que el productor deje de enviar. La estrategia depende del sistema y su configuración, no hay un comportamiento universal.',
  },
  {
    sectionTitle: 'Transmisión de Flujos de Eventos',
    positionAfterHeading: 'Brokers de mensajes',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Qué ocurre con los mensajes en un broker de mensajería tradicional (como RabbitMQ) una vez que son confirmados (acknowledged) por los consumidores?',
    options: [
      { label: 'A', text: 'Se mueven a una tabla de archivo para auditoría' },
      { label: 'B', text: 'Se eliminan del broker' },
      { label: 'C', text: 'Se mantienen indefinidamente para permitir re-lectura' },
      { label: 'D', text: 'Se comprimen y almacenan en disco secundario' },
    ],
    correctAnswer: 'B',
    explanation:
      'Los brokers tradicionales eliminan mensajes tras el acknowledgment. Esto significa que no puedes volver atrás y reprocesar mensajes viejos. Es un modelo pensado para cargas de trabajo transitorias, no para almacenamiento duradero. Los log-based brokers como Kafka cambian esta semántica radicalmente.',
    justificationHint:
      'Compara este comportamiento con el de Kafka, donde los mensajes se retienen en el log independientemente de si fueron consumidos. ¿Qué implicaciones tiene para escenarios donde necesitas reprocesar eventos históricos?',
  },
  {
    sectionTitle: 'Transmisión de Flujos de Eventos',
    positionAfterHeading: 'Múltiples consumidores',
    sortOrder: 3,
    format: 'mc',
    questionText:
      '¿Cuál es la diferencia entre los patrones "load balancing" y "fan-out" en sistemas de mensajería con múltiples consumidores?',
    options: [
      { label: 'A', text: 'Load balancing envía cada mensaje a todos los consumidores; fan-out a uno solo' },
      { label: 'B', text: 'Load balancing reparte mensajes entre consumidores para paralelizar; fan-out entrega cada mensaje a todos los consumidores' },
      { label: 'C', text: 'Fan-out requiere que los consumidores estén en el mismo data center' },
      { label: 'D', text: 'Load balancing preserva el orden de los mensajes; fan-out no' },
    ],
    correctAnswer: 'B',
    explanation:
      'En load balancing, cada mensaje se entrega a exactamente UN consumidor del grupo, repartiendo el trabajo. En fan-out, cada mensaje se entrega a TODOS los consumidores independientemente (cada uno recibe su propia copia). Ambos patrones se pueden combinar: dos grupos de consumidores en fan-out, cada grupo con load balancing interno.',
  },

  // ── Section 1: Logs Particionados ───────────────────────────────────────

  {
    sectionTitle: 'Logs Particionados',
    positionAfterHeading: 'Logs Particionados',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Un log particionado como Kafka combina la durabilidad de una base de datos con la notificación de baja latencia de un sistema de mensajería.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Exactamente. Kafka y sistemas similares (Amazon Kinesis, Twitter DistributedLog) almacenan mensajes de forma duradera en un log append-only particionado en disco, como una base de datos. Al mismo tiempo, notifican a los consumidores en tiempo real cuando llegan nuevos mensajes, como un sistema de mensajería.',
  },
  {
    sectionTitle: 'Logs Particionados',
    positionAfterHeading: 'Uso de logs para almacenamiento de mensajes',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Cómo se asigna el orden de los mensajes en un log-based broker como Kafka?',
    options: [
      { label: 'A', text: 'Orden global garantizado entre todas las particiones mediante relojes vectoriales' },
      { label: 'B', text: 'Orden total dentro de cada partición, pero sin garantía de orden entre particiones distintas' },
      { label: 'C', text: 'Orden basado en timestamps del productor con resolución de conflictos' },
      { label: 'D', text: 'No hay garantía de orden; los consumidores deben ordenar por sí mismos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Cada partición es un log append-only que asigna offsets monotónicamente crecientes. Dentro de una partición, el orden es total y determinista. Sin embargo, no hay garantía de orden entre mensajes de particiones distintas. Por eso, si necesitas orden estricto para cierto tipo de eventos, debes asegurar que vayan a la misma partición (misma clave).',
  },
  {
    sectionTitle: 'Logs Particionados',
    positionAfterHeading: 'Desplazamientos del consumidor',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Por qué el manejo de offsets en un log-based broker es más eficiente que el tracking de acknowledgments individuales en un broker tradicional?',
    options: [
      { label: 'A', text: 'Porque los offsets se almacenan en memoria y los acknowledgments en disco' },
      { label: 'B', text: 'Porque un solo número (el offset actual) indica todos los mensajes procesados, en vez de rastrear cada mensaje individualmente' },
      { label: 'C', text: 'Porque los offsets se replican automáticamente y los acknowledgments no' },
      { label: 'D', text: 'Porque los offsets usan compresión y los acknowledgments no' },
    ],
    correctAnswer: 'B',
    explanation:
      'En un log-based broker, el consumidor solo necesita almacenar un número: su offset actual. Todos los mensajes con offset menor ya fueron procesados, todos los mayores aún no. En un broker tradicional, cada mensaje necesita un acknowledgment individual, lo que requiere rastrear el estado de potencialmente millones de mensajes.',
    justificationHint:
      'Piensa en la analogía con un bookmark en un libro: un solo número de página te dice todo lo que ya leíste. Sin bookmark, tendrías que marcar cada párrafo individualmente.',
  },

  // ── Section 2: Bases de Datos y Flujos ──────────────────────────────────

  {
    sectionTitle: 'Bases de Datos y Flujos',
    positionAfterHeading: 'Bases de datos y flujos',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'La replicación de una base de datos se puede ver conceptualmente como un flujo de eventos: cada escritura es un evento que las réplicas procesan en orden.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'El log de replicación de una base de datos es, en esencia, un flujo de eventos de escritura. Cada réplica consume este flujo y aplica los cambios en el mismo orden, exactamente como un consumidor de un log de eventos. Esta conexión entre bases de datos y stream processing es central en el capítulo.',
  },
  {
    sectionTitle: 'Bases de Datos y Flujos',
    positionAfterHeading: 'Captura de datos de cambio (Change Data Capture)',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Qué problema resuelve Change Data Capture (CDC)?',
    options: [
      { label: 'A', text: 'Elimina la necesidad de tener índices secundarios en la base de datos' },
      { label: 'B', text: 'Permite mantener sistemas derivados (caches, índices de búsqueda, data warehouses) sincronizados con la base de datos de origen' },
      { label: 'C', text: 'Reemplaza el log de transacciones de la base de datos con un formato más eficiente' },
      { label: 'D', text: 'Garantiza consistencia fuerte entre microservicios sin necesidad de transacciones distribuidas' },
    ],
    correctAnswer: 'B',
    explanation:
      'CDC captura cada cambio (insert, update, delete) en la base de datos de origen y los publica como un flujo de eventos. Otros sistemas (Elasticsearch, caches Redis, data warehouses) consumen este flujo para mantenerse sincronizados. Es la solución al problema de mantener múltiples representaciones de los mismos datos consistentes entre sí.',
    justificationHint:
      'Piensa en el escenario clásico: tienes Postgres como fuente de verdad, Elasticsearch para búsqueda, y Redis para cache. Sin CDC, ¿cómo mantienes los tres sincronizados? ¿Qué pasa cuando una actualización llega a Postgres pero no a Elasticsearch?',
  },
  {
    sectionTitle: 'Bases de Datos y Flujos',
    positionAfterHeading: 'Compactación de registros',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es el propósito de la log compaction en el contexto de CDC?',
    options: [
      { label: 'A', text: 'Comprimir los mensajes del log para ahorrar espacio en disco' },
      { label: 'B', text: 'Retener solo el valor más reciente de cada clave, descartando actualizaciones anteriores supersedidas' },
      { label: 'C', text: 'Eliminar mensajes duplicados causados por reintentos del productor' },
      { label: 'D', text: 'Fusionar múltiples particiones del log en una sola para reducir overhead' },
    ],
    correctAnswer: 'B',
    explanation:
      'La log compaction mantiene el último valor escrito para cada clave y descarta los valores anteriores. Esto permite que un nuevo consumidor pueda obtener un snapshot completo del estado actual sin necesidad de reprocesar todo el historial desde el inicio. Es esencial para CDC cuando el log crece indefinidamente.',
  },

  // ── Section 3: Event Sourcing e Inmutabilidad ───────────────────────────

  {
    sectionTitle: 'Event Sourcing e Inmutabilidad',
    positionAfterHeading: 'Event Sourcing',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuál es la diferencia clave entre CDC y Event Sourcing?',
    options: [
      { label: 'A', text: 'CDC captura cambios a nivel de fila de la base de datos; Event Sourcing registra eventos de dominio con intención de negocio' },
      { label: 'B', text: 'CDC es asíncrono y Event Sourcing es síncrono' },
      { label: 'C', text: 'Event Sourcing no requiere una base de datos' },
      { label: 'D', text: 'CDC funciona solo con bases de datos relacionales' },
    ],
    correctAnswer: 'A',
    explanation:
      'En CDC, los eventos son mutaciones de bajo nivel: "fila X actualizada en tabla Y". En Event Sourcing, los eventos reflejan intención del dominio: "usuario canceló reserva", "producto agregado al carrito". Los eventos de Event Sourcing tienen significado de negocio y son inmutables, mientras que CDC es una proyección técnica del log de la base de datos.',
    justificationHint:
      'Piensa en la diferencia entre "UPDATE orders SET status=\'cancelled\' WHERE id=123" (CDC) vs "OrderCancelled { orderId: 123, reason: \'user_request\', refundAmount: 50 }" (Event Sourcing). ¿Cuál captura más contexto? ¿Cuál permite derivar más insights?',
  },
  {
    sectionTitle: 'Event Sourcing e Inmutabilidad',
    positionAfterHeading: 'Derivando el estado actual desde el registro de eventos',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'En Event Sourcing, los eventos son la fuente de verdad y el estado actual de la aplicación se deriva de ellos mediante proyección.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'El log inmutable de eventos es la fuente de verdad primaria. El estado actual (la vista que los usuarios ven y consultan) se genera reprocesando los eventos desde el inicio o desde un snapshot. Si necesitas una nueva vista o corregir un bug en la lógica de derivación, puedes reconstruir el estado completo desde los eventos.',
  },
  {
    sectionTitle: 'Event Sourcing e Inmutabilidad',
    positionAfterHeading: 'Estado, Flujos e Inmutabilidad',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Qué relación hay entre el estado actual de una base de datos y el log de cambios, según Kleppmann?',
    options: [
      { label: 'A', text: 'El estado y el log son representaciones independientes que deben sincronizarse manualmente' },
      { label: 'B', text: 'El estado actual es el resultado de integrar el log de cambios a lo largo del tiempo: state = integral(events)' },
      { label: 'C', text: 'El log de cambios es un derivado del estado actual, generado periódicamente' },
      { label: 'D', text: 'El estado actual es siempre más confiable que el log de cambios' },
    ],
    correctAnswer: 'B',
    explanation:
      'Kleppmann usa la analogía matemática: el estado actual es la integral del flujo de eventos a lo largo del tiempo, y el flujo de eventos es la derivada del estado. Si tienes todos los eventos, puedes reconstruir cualquier estado pasado. Si solo tienes el estado actual, has perdido información sobre cómo llegaste ahí.',
  },
  {
    sectionTitle: 'Event Sourcing e Inmutabilidad',
    positionAfterHeading: 'Ventajas de los eventos inmutables',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'Un log de eventos inmutable nunca debe ser borrado porque hacerlo violaría las garantías de Event Sourcing.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Aunque la inmutabilidad es el principio general, hay casos legítimos donde eventos DEBEN ser eliminados: datos personales bajo GDPR/derecho al olvido, información erróneamente publicada, etc. Kleppmann reconoce que la "inmutabilidad" tiene límites prácticos y que sistemas como Datomic ofrecen mecanismos de excision para estos casos.',
  },

  // ── Section 4: Procesamiento de Flujos ──────────────────────────────────

  {
    sectionTitle: 'Procesamiento de Flujos',
    positionAfterHeading: 'Procesamiento de Flujos',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuáles son los tres tipos de joins que un procesador de flujos puede necesitar ejecutar?',
    options: [
      { label: 'A', text: 'Inner join, outer join, cross join' },
      { label: 'B', text: 'Stream-stream join (window join), stream-table join (enrichment), table-table join (materialized view)' },
      { label: 'C', text: 'Hash join, merge join, nested loop join' },
      { label: 'D', text: 'Broadcast join, shuffle join, sort-merge join' },
    ],
    correctAnswer: 'B',
    explanation:
      'Los tres tipos son: (1) stream-stream join: correlacionar eventos de dos flujos dentro de una ventana temporal; (2) stream-table join: enriquecer eventos del flujo con datos de una tabla (lookup); (3) table-table join: mantener una vista materializada que combina dos tablas que cambian con el tiempo. Cada tipo tiene semántica y desafíos distintos.',
  },
  {
    sectionTitle: 'Procesamiento de Flujos',
    positionAfterHeading: 'Usos del Procesamiento de Flujos',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Por qué CEP (Complex Event Processing) busca patrones en flujos de eventos en lugar de procesar eventos individuales?',
    options: [
      { label: 'A', text: 'Porque los eventos individuales son demasiado grandes para procesar en tiempo real' },
      { label: 'B', text: 'Porque ciertos eventos significativos solo se detectan como combinaciones o secuencias de múltiples eventos simples' },
      { label: 'C', text: 'Porque CEP necesita reducir el volumen de datos antes de almacenarlos' },
      { label: 'D', text: 'Porque los eventos individuales no tienen timestamps confiables' },
    ],
    correctAnswer: 'B',
    explanation:
      'CEP detecta patrones complejos como "si temperatura sube 10°C en 5 minutos Y presión baja simultáneamente → alerta". Ningún evento individual contiene esta información; es la combinación temporal y lógica de múltiples eventos lo que genera conocimiento nuevo. CEP invierte el modelo: las queries son persistentes y los datos fluyen a través de ellas.',
  },
  {
    sectionTitle: 'Procesamiento de Flujos',
    positionAfterHeading: 'Razonamiento sobre el tiempo',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Por qué es problemático usar el tiempo de procesamiento (processing time) en lugar del tiempo del evento (event time) para ventanas temporales?',
    options: [
      { label: 'A', text: 'Porque el processing time consume más CPU que el event time' },
      { label: 'B', text: 'Porque eventos retrasados o reprocesados se asignarían a la ventana incorrecta, distorsionando los resultados' },
      { label: 'C', text: 'Porque el processing time no es monotónico en sistemas distribuidos' },
      { label: 'D', text: 'Porque el event time es siempre más preciso que el processing time' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si un evento ocurre a las 10:01 pero llega al procesador a las 10:05 (por retraso de red, buffering o reprocesamiento), usar processing time lo pondría en la ventana de 10:05, no en la de 10:01 donde realmente pertenece. Esto es especialmente grave en reprocesamiento de datos históricos, donde horas de eventos se procesan en segundos.',
    justificationHint:
      'Imagina que reprocesas un día completo de eventos en 10 minutos. Con processing time, todos los eventos caerían en ventanas de esos 10 minutos. Con event time, cada evento cae en la ventana del momento en que realmente ocurrió. ¿Cuál refleja la realidad?',
  },
  {
    sectionTitle: 'Procesamiento de Flujos',
    positionAfterHeading: 'Razonamiento sobre el tiempo',
    sortOrder: 3,
    format: 'tf',
    questionText:
      'Un procesador de flujos puede determinar con certeza absoluta que ya no llegarán más eventos con timestamp anterior a un punto dado.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'No hay forma de saber con certeza que no llegarán más eventos rezagados (stragglers). Los sistemas usan heurísticas como watermarks para estimar "probablemente ya llegaron todos los eventos hasta el tiempo T", pero siempre existe la posibilidad de eventos tardíos. Los sistemas deben decidir si ignorarlos, publicar correcciones, o mantener ventanas abiertas más tiempo.',
  },

  // ── Section 5: Resumen ──────────────────────────────────────────────────

  {
    sectionTitle: 'Resumen',
    positionAfterHeading: 'Resumen',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es la idea central que Kleppmann presenta en este capítulo sobre la relación entre bases de datos y stream processing?',
    options: [
      { label: 'A', text: 'Stream processing reemplazará a las bases de datos tradicionales en los próximos años' },
      { label: 'B', text: 'Las bases de datos y el stream processing son complementarios pero fundamentalmente incompatibles' },
      { label: 'C', text: 'La replicación, CDC, event sourcing y el mantenimiento de vistas materializadas son todos formas de procesamiento de flujos' },
      { label: 'D', text: 'El stream processing es solo útil para datos en tiempo real, no para datos históricos' },
    ],
    correctAnswer: 'C',
    explanation:
      'El insight unificador del capítulo es que muchas cosas que consideramos separadas (replicación de DB, ETL a data warehouses, mantenimiento de caches, búsquedas full-text, notificaciones en tiempo real) son todas instancias del mismo patrón: consumir un flujo de eventos y derivar algo a partir de ellos. Esta perspectiva unificada permite diseñar sistemas más robustos y extensibles.',
  },
];

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('Fetching Ch11 section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch11')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch11. Seed sections first.');
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

  console.log('\nCleared existing quizzes for Ch11 sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch11`);
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
