/**
 * Seed section-scoped questions for the question_bank.
 *
 * These questions are tagged with resource_section_id so the learn flow
 * can fetch questions relevant to the specific section being studied,
 * rather than pulling any question from the shared concept_id.
 *
 * Run with: npx tsx scripts/seed-section-questions.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Section questions keyed by resource_id + sort_order
// ============================================================================

interface SectionQuestion {
  type: 'definition' | 'fact' | 'property' | 'guarantee' | 'complexity' | 'comparison';
  question_text: string;
  expected_answer: string;
  difficulty: 1 | 2 | 3;
}

// Questions grouped by resource_id → sort_order
const questionsBySection: Record<string, Record<number, SectionQuestion[]>> = {
  'ddia-ch5': {
    // Section 0: Líderes y Seguidores
    0: [
      {
        type: 'definition',
        question_text: '¿Cómo funciona la replicación basada en líder (leader-based) y cuál es el rol de cada nodo?',
        expected_answer: 'Un nodo se designa como líder (leader/primary). Todas las escrituras van al líder. Los seguidores (followers/replicas) reciben un log de replicación del líder y actualizan su copia local en el mismo orden. Las lecturas pueden ir a cualquier nodo, pero las escrituras solo al líder.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué diferencia hay entre replicación síncrona y asíncrona, y cuál es el trade-off?',
        expected_answer: 'Síncrona: el líder espera confirmación del follower antes de reportar éxito al cliente. Garantiza que el follower tiene una copia actualizada, pero si el follower no responde, la escritura se bloquea. Asíncrona: el líder envía el cambio pero no espera. Menor latencia y mayor disponibilidad, pero si el líder falla antes de que el follower reciba el cambio, se pierde data.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué sucede cuando un follower se desconecta y luego se reconecta al líder?',
        expected_answer: 'El follower sabe la última transacción que procesó. Al reconectarse, solicita al líder todos los cambios desde esa posición en el log de replicación (catch-up recovery). Aplica los cambios en orden hasta estar al día. No necesita una copia completa nueva.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué pasos se siguen en un failover cuando el líder falla, y qué puede salir mal?',
        expected_answer: 'Pasos: (1) detectar que el líder falló (generalmente por timeout), (2) elegir un nuevo líder (el follower más actualizado), (3) reconfigurar el sistema para que clientes y followers usen el nuevo líder. Riesgos: el nuevo líder puede no tener todas las escrituras recientes (data loss), split-brain si el viejo líder vuelve creyendo que sigue siendo líder, y elegir el timeout correcto (muy corto causa failovers innecesarios).',
        difficulty: 2,
      },
    ],

    // Section 1: Problemas con el Retraso de Replicación
    1: [
      {
        type: 'definition',
        question_text: '¿Qué es el replication lag y por qué ocurre en sistemas con replicación asíncrona?',
        expected_answer: 'El replication lag es la diferencia de tiempo entre cuando una escritura se aplica en el líder y cuando se refleja en un follower. Ocurre porque en replicación asíncrona el líder no espera a los followers. Bajo carga normal el lag es pequeño (fracciones de segundo), pero bajo alta carga, problemas de red, o si un follower opera cerca de su capacidad, puede crecer a segundos o minutos.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es la garantía de "read-after-write consistency" y cómo se puede implementar?',
        expected_answer: 'Garantiza que si un usuario escribe un dato y luego lo lee, verá su propia escritura (no una versión vieja). Implementaciones: (1) leer del líder para datos que el usuario pudo haber modificado, (2) trackear el timestamp de la última escritura del usuario y asegurar que el follower esté al día, (3) hacer que el cliente recuerde el timestamp de su última escritura y no acepte lecturas de replicas más atrasadas.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué son las "monotonic reads" y qué problema resuelven?',
        expected_answer: 'Monotonic reads garantizan que si un usuario lee un valor en un momento, lecturas posteriores no verán un estado más viejo. Sin esta garantía, un usuario podría leer de un follower actualizado y luego de uno atrasado, viendo datos "viajar al pasado". Se implementa haciendo que cada usuario siempre lea del mismo follower (por ejemplo, eligiendo follower basado en hash del user ID).',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre "read-after-write consistency", "monotonic reads" y "consistent prefix reads"?',
        expected_answer: 'Read-after-write: ves tus propias escrituras inmediatamente. Monotonic reads: nunca ves datos más viejos que los que ya leíste (no hay "viaje al pasado"). Consistent prefix reads: si hay una secuencia causal (A→B), siempre ves A antes que B. Cada una resuelve un problema diferente del replication lag. Son independientes entre sí: puedes tener una sin las otras.',
        difficulty: 3,
      },
    ],

    // Section 2: Replicación Multi-Líder
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es la replicación multi-líder y en qué casos tiene sentido usarla?',
        expected_answer: 'Multi-leader permite que más de un nodo acepte escrituras. Cada líder actúa como follower de los otros líderes. Tiene sentido en: (1) operación multi-datacenter (un líder por DC reduce latencia de escritura), (2) clientes que necesitan funcionar offline (cada dispositivo es un líder local), (3) edición colaborativa en tiempo real (cada usuario escribe localmente).',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué son los conflictos de escritura en multi-leader y qué estrategias existen para resolverlos?',
        expected_answer: 'Conflictos ocurren cuando dos líderes modifican el mismo dato concurrentemente. Estrategias: (1) evitar conflictos rutando todas las escrituras del mismo registro al mismo líder, (2) last-write-wins (LWW) usando timestamps — simple pero pierde datos, (3) merge automático de valores (ej: unión de sets), (4) registrar el conflicto y dejar que la aplicación/usuario lo resuelva después.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las ventajas y desventajas de multi-leader vs single-leader replication?',
        expected_answer: 'Ventajas multi-leader: mejor latencia de escritura (escribe al líder local), mayor tolerancia a fallos de datacenter/red (cada líder opera independientemente). Desventajas: conflictos de escritura que deben resolverse (complejidad significativa), posibles inconsistencias sutiles (auto-increment, triggers, constraints), más difícil de debuggear. Single-leader es más simple, sin conflictos, y suficiente para la mayoría de los casos.',
        difficulty: 2,
      },
    ],

    // Section 3: Replicación sin Líder
    3: [
      {
        type: 'definition',
        question_text: '¿Cómo funciona la replicación sin líder (leaderless) y qué es un quorum de lectura/escritura?',
        expected_answer: 'En replicación leaderless, el cliente envía escrituras a varios nodos directamente (o a través de un coordinador). No hay líder fijo. Para garantizar lecturas consistentes se usa quorum: con n réplicas, se escribe a w nodos y se lee de r nodos. Si w + r > n, al menos un nodo tendrá el valor más reciente. Típicamente w = r = (n+1)/2.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué mecanismos existen para que las réplicas converjan después de que un nodo estuvo offline?',
        expected_answer: 'Dos mecanismos principales: (1) Read repair: cuando un cliente lee de múltiples nodos y detecta un valor desactualizado, escribe el valor correcto de vuelta al nodo atrasado. Funciona bien para datos que se leen frecuentemente. (2) Anti-entropy process: un proceso en background compara datos entre réplicas y copia los que faltan. No garantiza orden y puede haber delay significativo.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿En qué situaciones un quorum estricto (w + r > n) puede igualmente devolver datos desactualizados?',
        expected_answer: 'Incluso con quorum estricto: (1) escrituras concurrentes — si llegan al mismo tiempo, no está claro cuál es "la más reciente", (2) escritura y lectura concurrentes — la escritura puede haberse aplicado solo en algunos nodos, (3) si un nodo con la escritura falla y se restaura desde uno desactualizado, se pierde el quorum, (4) edge cases con "sloppy quorums" donde los nodos w y r no se solapan.',
        difficulty: 3,
      },
    ],

    // Section 4: Escrituras Concurrentes
    4: [
      {
        type: 'definition',
        question_text: '¿Qué significa que dos escrituras sean "concurrentes" en un sistema distribuido?',
        expected_answer: 'Dos operaciones son concurrentes si ninguna de las dos sabe de la otra al momento de ejecutarse. No depende del tiempo físico (reloj) sino de la causalidad: si A no causó B y B no causó A, son concurrentes. Esto es importante porque sin un orden causal, el sistema debe tener una estrategia para decidir qué valor conservar.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué la estrategia "last write wins" (LWW) puede causar pérdida de datos y cuándo es aceptable?',
        expected_answer: 'LWW asigna un timestamp a cada escritura y descarta las más viejas. Pero si dos escrituras son concurrentes (no causales), una se pierde arbitrariamente. Los timestamps no capturan causalidad. Es aceptable cuando cada key se escribe una sola vez (immutable) o cuando perder escrituras es tolerable (ej: cache). No es aceptable cuando todas las escrituras deben preservarse.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Cómo funciona el algoritmo de version vectors para detectar concurrencia entre escrituras?',
        expected_answer: 'Cada réplica mantiene un número de versión por cada key. Cuando un cliente lee, recibe el valor y el version vector. Cuando escribe, envía el version vector que leyó junto con el nuevo valor. El servidor puede comparar versiones: si una versión es estrictamente mayor, hay orden causal y se puede sobrescribir. Si las versiones son incomparables (ni una contiene a la otra), las escrituras son concurrentes y deben guardarse como siblings para resolución posterior.',
        difficulty: 3,
      },
    ],
  },
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Seeding Section-Scoped Questions ===\n');

  let totalInserted = 0;

  for (const [resourceId, sections] of Object.entries(questionsBySection)) {
    console.log(`Resource: ${resourceId}`);

    // Fetch all sections for this resource
    const { data: dbSections, error: secErr } = await supabase
      .from('resource_sections')
      .select('id, section_title, sort_order, concept_id')
      .eq('resource_id', resourceId)
      .order('sort_order');

    if (secErr || !dbSections) {
      console.error(`  Failed to fetch sections for ${resourceId}:`, secErr);
      continue;
    }

    for (const [sortOrderStr, questions] of Object.entries(sections)) {
      const sortOrder = parseInt(sortOrderStr, 10);
      const section = dbSections.find(s => s.sort_order === sortOrder);

      if (!section) {
        console.error(`  Section with sort_order=${sortOrder} not found, skipping`);
        continue;
      }

      console.log(`  Section ${sortOrder}: "${section.section_title}" (${section.id})`);
      console.log(`    Inserting ${questions.length} questions...`);

      const rows = questions.map(q => ({
        concept_id: section.concept_id,
        resource_section_id: section.id,
        type: q.type,
        question_text: q.question_text,
        expected_answer: q.expected_answer,
        difficulty: q.difficulty,
        is_active: true,
      }));

      const { error: insErr } = await supabase.from('question_bank').insert(rows);

      if (insErr) {
        console.error(`    Insert error:`, insErr);
        continue;
      }

      totalInserted += questions.length;
      console.log(`    Done.`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total section-scoped questions inserted: ${totalInserted}`);
}

main().catch(console.error);
