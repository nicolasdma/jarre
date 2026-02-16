#!/usr/bin/env npx tsx
/**
 * Seed inline quizzes for DDIA Ch4 (Encoding and Evolution) sections.
 *
 * Usage:
 *   npx tsx scripts/seed-inline-quizzes-ch4.ts
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
  // ── Section 0: Formatos de Codificación de Datos ──────────────────────

  {
    sectionTitle: 'Formatos de Codificación de Datos',
    positionAfterHeading: 'Formatos de Codificación de Datos',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cuál es el problema principal con las codificaciones nativas de lenguajes como java.io.Serializable o pickle de Python?',
    options: [
      { label: 'A', text: 'Son demasiado lentas para producción' },
      { label: 'B', text: 'Están vinculadas a un lenguaje específico, tienen problemas de seguridad, y no gestionan bien la evolución de schemas' },
      { label: 'C', text: 'No soportan tipos de datos complejos' },
      { label: 'D', text: 'Requieren demasiada memoria' },
    ],
    correctAnswer: 'B',
    explanation:
      'Las codificaciones nativas de lenguaje tienen tres problemas fundamentales: (1) acoplan los datos a un lenguaje específico, (2) pueden ser vectores de ejecución remota de código al instanciar clases arbitrarias, y (3) no están diseñadas para compatibilidad entre versiones.',
  },
  {
    sectionTitle: 'Formatos de Codificación de Datos',
    positionAfterHeading: 'JSON, XML y CSV',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'JSON puede representar de forma segura enteros de 64 bits sin pérdida de precisión.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'JSON no distingue enteros de punto flotante. JavaScript usa IEEE 754 double-precision que solo puede representar exactamente enteros hasta 2^53. Twitter, por ejemplo, incluye sus IDs de 64 bits como strings en JSON para evitar corrupción silenciosa.',
  },
  {
    sectionTitle: 'Formatos de Codificación de Datos',
    positionAfterHeading: 'Codificaciones Binarias de JSON y XML',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Por qué MessagePack (codificación binaria de JSON) solo ahorra ~18% respecto a JSON texto?',
    options: [
      { label: 'A', text: 'Porque usa compresión ineficiente' },
      { label: 'B', text: 'Porque los nombres de campo (como "userName") siguen incluyéndose en los datos codificados' },
      { label: 'C', text: 'Porque JSON texto ya es bastante compacto' },
      { label: 'D', text: 'Porque MessagePack agrega metadata de tipos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Sin un schema, las codificaciones binarias de JSON deben incluir los nombres de campo completos en cada registro. Los formatos con schema (Thrift, Protobuf, Avro) reemplazan nombres por números o los eliminan completamente, logrando ~60% de ahorro.',
  },

  // ── Section 1: Thrift y Protocol Buffers ──────────────────────────────

  {
    sectionTitle: 'Thrift y Protocol Buffers',
    positionAfterHeading: 'El Rol de los Field Tags',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Qué permite que Protocol Buffers codifique el mismo documento JSON de 81 bytes en solo 33 bytes?',
    options: [
      { label: 'A', text: 'Compresión gzip aplicada automáticamente' },
      { label: 'B', text: 'Los field tags (números) reemplazan los nombres de campo, y se usan variable-length integers' },
      { label: 'C', text: 'Los valores string se truncan' },
      { label: 'D', text: 'Los campos opcionales no se incluyen' },
    ],
    correctAnswer: 'B',
    explanation:
      'Protocol Buffers codifica el tag number (1, 2, 3) en lugar del nombre del campo ("userName", etc.), y usa varints que representan números pequeños con menos bytes. Esto reduce el overhead por campo de ~10 bytes (nombre) a 1-2 bytes (tag).',
  },
  {
    sectionTitle: 'Thrift y Protocol Buffers',
    positionAfterHeading: 'Evolución del Schema: Field Tags',
    sortOrder: 1,
    format: 'mc2',
    questionText:
      '¿Cuáles de estas acciones rompen la compatibilidad en Protocol Buffers/Thrift?',
    options: [
      { label: 'A', text: 'Renombrar un campo (cambiar el nombre pero mantener el tag)' },
      { label: 'B', text: 'Cambiar el número de tag de un campo existente' },
      { label: 'C', text: 'Agregar un campo nuevo con un tag nuevo marcado como required' },
      { label: 'D', text: 'Agregar un campo nuevo con un tag nuevo marcado como optional' },
    ],
    correctAnswer: '[B,C]',
    explanation:
      'Cambiar un tag number invalida todos los datos existentes (los bytes codificados referencian el tag viejo). Agregar un campo required rompe backward compatibility: código nuevo esperará ese campo en registros viejos que no lo tienen. Renombrar es seguro porque los nombres no se codifican. Agregar optional es seguro.',
    justificationHint:
      'El nombre del campo nunca aparece en los bytes codificados — solo el tag number. Por eso renombrar es seguro pero cambiar el tag es catastrófico.',
  },
  {
    sectionTitle: 'Thrift y Protocol Buffers',
    positionAfterHeading: 'Cambio de Tipos de Datos',
    sortOrder: 2,
    format: 'tf',
    questionText:
      'En Protocol Buffers, es seguro cambiar un campo optional (single-value) a repeated (multi-value) porque ambos usan la misma codificación.',
    options: null,
    correctAnswer: 'true',
    explanation:
      'Protocol Buffers codifica repeated como múltiples apariciones del campo con el mismo tag. Un campo optional es simplemente un campo que aparece 0 o 1 veces. Código viejo (que espera optional) leerá solo el último valor si encuentra múltiples; código nuevo (que espera repeated) tratará un solo valor como un array de un elemento.',
  },

  // ── Section 2: Apache Avro ────────────────────────────────────────────

  {
    sectionTitle: 'Apache Avro',
    positionAfterHeading: 'La Diferencia Radical: Sin Field Tags',
    sortOrder: 0,
    format: 'mc',
    questionText:
      '¿Cómo logra Avro codificar datos sin field tags ni nombres de campo?',
    options: [
      { label: 'A', text: 'Usa posiciones fijas: los campos siempre van en el mismo orden definido por el schema' },
      { label: 'B', text: 'Incluye un mini-schema comprimido al inicio de cada registro' },
      { label: 'C', text: 'Usa un diccionario compartido entre codificador y decodificador' },
      { label: 'D', text: 'Comprime los nombres de campo con Huffman encoding' },
    ],
    correctAnswer: 'A',
    explanation:
      'Avro simplemente concatena los valores en el orden definido por el writer\'s schema. El decodificador debe tener acceso al writer\'s schema para saber qué campo corresponde a cada posición. Esto lo hace el más compacto de todos (32 bytes para el ejemplo estándar) pero requiere que el reader tenga acceso al writer\'s schema.',
  },
  {
    sectionTitle: 'Apache Avro',
    positionAfterHeading: 'Writer\'s Schema y Reader\'s Schema',
    sortOrder: 1,
    format: 'tf',
    questionText:
      'En Avro, el writer\'s schema y el reader\'s schema deben ser idénticos para que la decodificación funcione.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Pueden ser diferentes. Avro hace "schema resolution": compara ambos schemas por nombre de campo. Si el reader tiene un campo que el writer no escribió, usa el valor por defecto. Si el writer escribió un campo que el reader no conoce, lo ignora. Esto es la base de la evolución de schemas en Avro.',
  },
  {
    sectionTitle: 'Apache Avro',
    positionAfterHeading: 'Schemas Generados Dinámicamente',
    sortOrder: 2,
    format: 'mc',
    questionText:
      '¿Cuál es la ventaja principal de Avro sobre Thrift/Protobuf para exportar datos desde bases de datos relacionales?',
    options: [
      { label: 'A', text: 'Avro es más rápido de codificar' },
      { label: 'B', text: 'Sin field tags, puedes generar schemas dinámicamente desde la definición de tablas sin gestionar asignación manual de tags' },
      { label: 'C', text: 'Avro soporta más tipos de datos que Protobuf' },
      { label: 'D', text: 'Avro comprime mejor los datos tabulares' },
    ],
    correctAnswer: 'B',
    explanation:
      'Si la tabla SQL cambia (agregan una columna), solo generas un nuevo schema Avro y los datos escritos con ambos schemas coexisten. Con Thrift/Protobuf necesitarías asignar field tags manuales a cada columna nueva, haciendo la generación automática frágil.',
  },

  // ── Section 3: Evolución de Schemas y Compatibilidad ──────────────────

  {
    sectionTitle: 'Evolución de Schemas y Compatibilidad',
    positionAfterHeading: 'Forward y Backward Compatibility',
    sortOrder: 0,
    format: 'mc2',
    questionText:
      '¿Cuándo necesitas AMBAS direcciones de compatibilidad (forward y backward) simultáneamente?',
    options: [
      { label: 'A', text: 'Solo cuando usas Avro' },
      { label: 'B', text: 'Durante un rolling upgrade donde algunos servidores corren la versión nueva y otros la vieja' },
      { label: 'C', text: 'Solo para bases de datos, no para APIs' },
      { label: 'D', text: 'Nunca, una sola dirección es suficiente' },
    ],
    correctAnswer: 'B',
    explanation:
      'Durante un rolling upgrade, servidores con versión nueva escriben datos que servidores con versión vieja deben leer (forward compatibility), y servidores nuevos leen datos escritos antes del upgrade (backward compatibility). Ambas direcciones son necesarias simultáneamente.',
  },
  {
    sectionTitle: 'Evolución de Schemas y Compatibilidad',
    positionAfterHeading: 'Los Méritos de los Schemas',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Cuál de estas NO es una ventaja de los formatos con schema (Protobuf, Avro) sobre JSON?',
    options: [
      { label: 'A', text: 'Mayor compactación de datos' },
      { label: 'B', text: 'Documentación que siempre está actualizada' },
      { label: 'C', text: 'Legibilidad humana directa de los datos codificados' },
      { label: 'D', text: 'Verificación de compatibilidad antes del despliegue' },
    ],
    correctAnswer: 'C',
    explanation:
      'Los formatos binarios con schema NO son legibles por humanos — necesitas el schema para interpretar los bytes. JSON es legible directamente. Las ventajas reales son: compactación, documentación viva (el schema), y verificación automática de compatibilidad en CI/CD.',
  },

  // ── Section 4: Modos de Flujo de Datos ────────────────────────────────

  {
    sectionTitle: 'Modos de Flujo de Datos',
    positionAfterHeading: 'Flujo de Datos a Través de Bases de Datos',
    sortOrder: 0,
    format: 'tf',
    questionText:
      'Si un proceso con schema nuevo escribe un registro y luego un proceso con schema viejo lo lee, modifica y reescribe, los campos nuevos se preservan automáticamente.',
    options: null,
    correctAnswer: 'false',
    explanation:
      'Este es el problema de "data outliving code": el proceso viejo decodifica el registro, ve solo los campos que conoce, y al re-codificarlo puede perder los campos nuevos. Los ORMs son particularmente propensos a esto: mapean la fila a un objeto con solo los campos del modelo y al guardar eliminan columnas desconocidas.',
  },
  {
    sectionTitle: 'Modos de Flujo de Datos',
    positionAfterHeading: 'RPC: La Ilusión de las Llamadas Locales',
    sortOrder: 1,
    format: 'mc',
    questionText:
      '¿Por qué una llamada RPC es fundamentalmente diferente de una llamada a función local?',
    options: [
      { label: 'A', text: 'Porque RPC es más lento pero siempre funciona' },
      { label: 'B', text: 'Porque puede fallar por timeout sin saber si se ejecutó, tiene latencia impredecible, y no se pueden pasar referencias locales' },
      { label: 'C', text: 'Porque RPC solo funciona con lenguajes compilados' },
      { label: 'D', text: 'Porque RPC no soporta argumentos complejos' },
    ],
    correctAnswer: 'B',
    explanation:
      'Una llamada de red puede: (1) fallar por timeout sin que sepas si se ejecutó, (2) tardar de milisegundos a segundos impredeciblemente, (3) no puede recibir punteros o referencias de memoria. Retrías son peligrosos si la operación no es idempotente. Los frameworks modernos como gRPC hacen estas diferencias explícitas.',
  },
  {
    sectionTitle: 'Modos de Flujo de Datos',
    positionAfterHeading: 'Flujo de Datos Asíncrono: Message Passing',
    sortOrder: 2,
    format: 'mc2',
    questionText:
      '¿Qué ventajas tiene el message passing asíncrono sobre RPC directo?',
    options: [
      { label: 'A', text: 'Mayor velocidad de transmisión' },
      { label: 'B', text: 'Desacoplamiento temporal: el consumidor no necesita estar disponible al momento de enviar' },
      { label: 'C', text: 'Fan-out: un mensaje puede entregarse a múltiples consumidores' },
      { label: 'D', text: 'No necesita codificación de datos' },
    ],
    correctAnswer: '[B,C]',
    explanation:
      'El message broker actúa como buffer (desacoplamiento temporal) y puede entregar copias a múltiples consumidores (fan-out). No es necesariamente más rápido que RPC, y sí necesita codificación de datos — las mismas consideraciones de schema evolution aplican a los mensajes.',
    justificationHint:
      'Piensa en un sistema donde el servicio de emails está caído. Con RPC, el request falla. Con message passing, el mensaje espera en la cola hasta que el servicio se recupere.',
  },
];

async function main() {
  console.log('Fetching Ch4 section IDs from Supabase...\n');

  const { data: sections, error: sectionsError } = await supabase
    .from('resource_sections')
    .select('id, section_title')
    .eq('resource_id', 'ddia-ch4')
    .order('sort_order');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  if (!sections || sections.length === 0) {
    console.error('No sections found for ddia-ch4. Seed sections first.');
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

  console.log('\nCleared existing quizzes for Ch4 sections.');

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

  console.log(`\n✓ Inserted ${toInsert.length} inline quizzes for DDIA Ch4`);
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
