/**
 * Seed section-scoped questions for the question_bank.
 *
 * These questions are tagged with resource_section_id so the learn flow
 * can fetch questions relevant to the specific section being studied,
 * rather than pulling any question from the shared concept_id.
 *
 * Run with: npx tsx scripts/seed-section-questions.ts
 *
 * Options:
 *   --resource <id>   Only seed questions for a specific resource
 *   --clear           Clear existing section-scoped questions before inserting
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

  // ========================================================================
  // DDIA CHAPTER 1 — Reliable, Scalable, and Maintainable Applications
  // Sections from chapter-01-translated.json (sort_order 0-3)
  // ========================================================================
  'ddia-ch1': {
    // Section 0: Fiabilidad
    0: [
      {
        type: 'definition',
        question_text: '¿Cuál es la diferencia entre un fallo (fault) y un failure en el contexto de fiabilidad de sistemas?',
        expected_answer: 'Un fallo (fault) es cuando un componente individual del sistema se desvía de su especificación esperada. Un failure es cuando el sistema en su totalidad deja de proporcionar el servicio requerido al usuario. El objetivo de la tolerancia a fallos es evitar que los faults se conviertan en failures del sistema completo.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Qué diferencias hay entre fallos de hardware, fallos de software y errores humanos en términos de patrones y mitigación?',
        expected_answer: 'Fallos de hardware: aleatorios, independientes entre sí, se mitigan con redundancia (RAID, fuentes duales). Fallos de software: sistemáticos, pueden ser correlacionados (afectan muchas instancias a la vez), permanecen latentes hasta condiciones inusuales, se mitigan con testing y monitoreo. Errores humanos: la causa más común de interrupciones (no hardware), se mitigan con buen diseño de APIs, sandboxes, rollback rápido y telemetría.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué es preferible diseñar sistemas tolerantes a fallos en vez de intentar prevenir todos los fallos?',
        expected_answer: 'Es imposible reducir la probabilidad de fallos a cero. Los fallos de hardware son estadísticamente inevitables (un disco de 10K tiene MTTF de 10-50 años, pero en un clúster grande muere uno por día), los fallos de software son latentes e impredecibles, y los errores humanos son inherentes. Por eso es mejor asumir que los fallos ocurrirán y diseñar mecanismos que prevengan que causen failures del sistema completo.',
        difficulty: 2,
      },
    ],

    // Section 1: Escalabilidad
    1: [
      {
        type: 'definition',
        question_text: '¿Qué son los parámetros de carga y por qué son importantes para describir la escalabilidad?',
        expected_answer: 'Los parámetros de carga son números que describen la carga actual del sistema: solicitudes/segundo, ratio lecturas/escrituras, usuarios simultáneos, tasa de aciertos en caché, etc. Son importantes porque antes de poder discutir cómo escalar, necesitas describir cuantitativamente la carga actual. La elección de qué parámetros importan depende de la arquitectura del sistema.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué los percentiles (p50, p95, p99) son mejores que el promedio para medir tiempos de respuesta, y qué es la amplificación de latencia de cola?',
        expected_answer: 'El promedio oculta outliers. Los percentiles muestran la distribución real: p50 (mediana) indica la experiencia típica, p95/p99 revelan los peores casos. Amazon usa p99.9 porque los clientes más lentos suelen ser los más valiosos (más datos). La amplificación de latencia de cola ocurre en sistemas con fan-out: al llamar múltiples backends en paralelo, basta una respuesta lenta para ralentizar todo el request.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cómo resolvió Twitter el problema del fan-out en su timeline, y por qué no bastó con un solo enfoque?',
        expected_answer: 'Twitter probó dos enfoques: (1) consultar al leer — JOIN de tweets de seguidos al pedir la timeline, simple pero no escalaba con 300K lecturas/seg. (2) Fan-out al escribir — pre-computar la timeline de cada usuario insertando cada tweet en los cachés de todos los seguidores, mejor para lecturas pero costoso para celebridades (30M+ escrituras por tweet). La solución final es un híbrido: fan-out para usuarios normales, y los tweets de celebridades se mezclan al momento de leer.',
        difficulty: 2,
      },
    ],

    // Section 2: Mantenibilidad
    2: [
      {
        type: 'definition',
        question_text: '¿Cuáles son los tres principios de diseño para la mantenibilidad y qué busca cada uno?',
        expected_answer: 'Operabilidad: facilitar la vida del equipo de operaciones (monitoreo, automatización, documentación, comportamiento predecible). Simplicidad: gestionar la complejidad usando abstracciones para eliminar complejidad accidental (no la esencial del problema). Evolucionabilidad: facilitar cambios futuros, ligada a la simplicidad — sistemas simples son más fáciles de modificar.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es la complejidad accidental y cómo se diferencia de la complejidad esencial? ¿Cuál es la mejor herramienta para combatirla?',
        expected_answer: 'La complejidad esencial es inherente al problema que el software resuelve. La complejidad accidental surge de la implementación: acoplamiento, dependencias enredadas, hacks de rendimiento, nomenclatura inconsistente. La mejor herramienta para eliminar complejidad accidental es la abstracción: una fachada limpia que oculta detalle de implementación, es reusable, y permite mejorar los componentes internos beneficiando a todos los consumidores.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Por qué dice Kleppmann que la mayor parte del costo del software NO está en su desarrollo inicial?',
        expected_answer: 'El costo principal está en el mantenimiento continuo: corregir bugs, mantener sistemas operativos, investigar fallos, adaptarse a nuevas plataformas, modificar para nuevos casos de uso, pagar deuda técnica y agregar funcionalidades. El desarrollo inicial es solo una fracción del costo total del ciclo de vida del software.',
        difficulty: 1,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 2 — Data Models and Query Languages
  // Sections from chapter-02-translated.json (sort_order 0-1)
  // ========================================================================
  'ddia-ch2': {
    // Section 0: Modelos de datos y lenguajes de consulta
    0: [
      {
        type: 'comparison',
        question_text: '¿Cuáles son las principales diferencias entre el modelo relacional y el modelo de documentos, y cuándo elegirías uno sobre otro?',
        expected_answer: 'Relacional: datos normalizados en tablas con relaciones (JOINs), esquema rígido (schema-on-write), bueno para relaciones many-to-many y datos altamente interconectados. Documentos: datos anidados en estructuras autocontenidas (JSON), esquema flexible (schema-on-read), bueno para datos con estructura de árbol (one-to-many) y cuando los documentos se cargan completos. Elegir documentos cuando la app tiene estructura de documentos natural; relacional cuando hay muchas relaciones entre entidades.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es la impedance mismatch y qué problema genera entre las aplicaciones y las bases de datos relacionales?',
        expected_answer: 'La impedance mismatch es la desconexión entre el modelo relacional (tablas, filas, columnas) y los objetos/estructuras de datos que usan las aplicaciones (objetos con atributos anidados, listas, etc.). Requiere una capa de traducción (ORM) entre ambos modelos. Los modelos de documentos (JSON) reducen esta brecha porque su estructura se asemeja más a los objetos de la aplicación.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué diferencia hay entre schema-on-read y schema-on-write, y cuál es el trade-off?',
        expected_answer: 'Schema-on-write (relacional): la estructura de los datos se define explícitamente y la BD la valida al escribir. Garantiza consistencia pero hace costosos los cambios de esquema (ALTER TABLE). Schema-on-read (documentos): la estructura es implícita, se interpreta al leer. Más flexible para datos heterogéneos o cuando el esquema cambia frecuentemente, pero no hay garantía de estructura y los errores se descubren en tiempo de lectura.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 3 — Storage and Retrieval
  // Sections from chapter-03-translated.json (sort_order 0-1)
  // ========================================================================
  'ddia-ch3': {
    // Section 0: Motores de almacenamiento
    0: [
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias fundamentales entre un motor basado en LSM-tree y uno basado en B-tree?',
        expected_answer: 'LSM-tree: escrituras secuenciales (append-only), usa SSTables en disco + memtable en memoria, compactación en background, mejor throughput de escritura. B-tree: escrituras in-place, estructura de árbol balanceado con páginas de tamaño fijo, usa WAL para crash recovery, mejor para lecturas puntuales. LSM-trees pueden tener compactación que interfiere con lecturas; B-trees tienen amplificación de escritura por actualizar páginas completas.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es una SSTable (Sorted String Table) y qué ventajas ofrece sobre un log no ordenado?',
        expected_answer: 'Una SSTable es un archivo donde los pares clave-valor están ordenados por clave. Ventajas: (1) merge eficiente de segmentos usando merge-sort (similar a merge de archivos ordenados), (2) no necesitas un índice completo en memoria — con un índice sparse puedes encontrar rangos y escanear, (3) compresión de bloques entre entradas del índice sparse ahorra espacio en disco y reduce I/O.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Para qué sirve un Bloom filter en el contexto de un motor LSM-tree?',
        expected_answer: 'Un Bloom filter es una estructura de datos probabilística que puede decir con certeza que una clave NO existe, o con cierta probabilidad que SÍ existe. En un LSM-tree, evita lecturas innecesarias de SSTables en disco: si el Bloom filter dice que la clave no está en un segmento, se salta ese segmento sin leerlo. Esto optimiza lecturas de claves inexistentes, que de otro modo requerirían revisar todos los segmentos.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 5 — Replication
  // Sections from chapter-05-resegmented.json (sort_order 0-4)
  // ========================================================================
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

  // ========================================================================
  // DDIA CHAPTER 6 — Partitioning
  // Sections from chapter-06-resegmented.json (sort_order 0-4)
  // ========================================================================
  'ddia-ch6': {
    // Section 0: Estrategias de Particionamiento
    0: [
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias entre particionar por rango de clave y particionar por hash de clave?',
        expected_answer: 'Por rango: las claves se ordenan y se asignan rangos contiguos a particiones. Permite escaneos eficientes por rango, pero es susceptible a hot spots si las claves tienen patrones de acceso sesgados (ej: timestamps). Por hash: se aplica una función hash a la clave para distribuir uniformemente. Elimina hot spots pero pierde la capacidad de escaneos por rango (claves adyacentes van a particiones diferentes).',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo se combinan particionamiento y replicación, y por qué es necesario combinarlos?',
        expected_answer: 'Cada partición se replica en múltiples nodos para tolerancia a fallos. Un nodo puede almacenar múltiples particiones. Si se usa replicación líder-seguidor, cada partición tiene su propio líder (posiblemente en nodos diferentes). Es necesario combinarlos porque el particionamiento solo distribuye la carga, pero sin replicación, la pérdida de un nodo significaría perder todas las particiones que almacena.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es un hot spot en el contexto del particionamiento y por qué es problemático?',
        expected_answer: 'Un hot spot ocurre cuando una partición recibe una proporción desproporcionada del tráfico (lecturas o escrituras). Es problemático porque anula el propósito del particionamiento: en vez de distribuir la carga uniformemente, un nodo se convierte en cuello de botella. Puede ocurrir por claves populares (ej: una celebridad en redes sociales) o por patrones de acceso sesgados (ej: todas las escrituras del día van a la misma partición de timestamp).',
        difficulty: 1,
      },
    ],

    // Section 1: Cargas Sesgadas y Puntos Calientes
    1: [
      {
        type: 'property',
        question_text: '¿Por qué el hashing de claves no elimina completamente los hot spots, y qué técnica se puede usar como último recurso?',
        expected_answer: 'El hashing distribuye uniformemente claves distintas, pero si una misma clave recibe tráfico extremo (ej: un ID de celebridad), todas las solicitudes van a la misma partición. Como último recurso, la aplicación puede agregar un número aleatorio al inicio/final de la clave caliente, dividiendo las escrituras entre múltiples particiones. El trade-off es que las lecturas deben consultar todas las variantes y combinar resultados.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Por qué la mayoría de los sistemas de datos no compensan automáticamente las cargas sesgadas?',
        expected_answer: 'Compensar automáticamente requiere conocimiento sobre qué claves son calientes y cómo distribuirlas, lo cual depende de la lógica de la aplicación. Los sistemas de datos no tienen ese contexto. Por eso la responsabilidad de mitigar hot spots recae en la capa de aplicación, que conoce los patrones de acceso específicos.',
        difficulty: 1,
      },
    ],

    // Section 2: Índices Secundarios Particionados
    2: [
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre un índice secundario por documento (local) y un índice secundario por término (global)?',
        expected_answer: 'Por documento (local): cada partición mantiene su propio índice secundario, cubriendo solo los documentos de esa partición. Las escrituras son rápidas (actualizan una sola partición) pero las lecturas por índice secundario requieren scatter/gather a todas las particiones. Por término (global): el índice se particiona de forma diferente a los datos. Las lecturas son eficientes (van a una sola partición del índice) pero las escrituras son más lentas y complejas (pueden requerir transacciones distribuidas).',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es el patrón scatter/gather y por qué puede ser costoso?',
        expected_answer: 'Scatter/gather ocurre cuando una consulta debe enviarse a TODAS las particiones y los resultados se combinan. Es necesario cuando se busca por un índice secundario local (cada partición puede tener documentos relevantes). Es costoso porque: (1) la latencia está dominada por la partición más lenta (tail latency), (2) genera carga en todos los nodos aunque la mayoría no tengan resultados, (3) no escala linealmente con el número de particiones.',
        difficulty: 2,
      },
    ],

    // Section 3: Rebalanceo de Particiones
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es el rebalanceo de particiones y por qué es necesario?',
        expected_answer: 'El rebalanceo es el proceso de mover datos entre nodos para redistribuir la carga cuando las condiciones cambian: se añaden nuevos nodos (más capacidad), nodos fallan y otros deben asumir su carga, o el volumen de datos crece de forma desigual. Durante el rebalanceo, el sistema debe seguir atendiendo solicitudes de lectura y escritura.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Por qué usar "hash mod N" es una mala estrategia de particionamiento, y qué alternativas existen?',
        expected_answer: 'Hash mod N es malo porque al cambiar N (añadir/quitar nodos), la mayoría de las claves cambian de partición, requiriendo mover enormes cantidades de datos. Alternativas: (1) particiones fijas — crear muchas más particiones que nodos y reasignar particiones enteras entre nodos, (2) particionamiento dinámico — dividir particiones cuando crecen demasiado (como B-trees), (3) particionamiento proporcional a nodos — número fijo de particiones por nodo, se re-dividen al añadir nodos.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué es peligroso el rebalanceo completamente automático y qué enfoque prefieren muchos sistemas?',
        expected_answer: 'El rebalanceo automático puede causar cascadas: si un nodo está lento (no caído), el sistema podría reasignar sus particiones a otros nodos, aumentando la carga sobre ellos y la red, lo que puede hacer que más nodos parezcan lentos, desencadenando más rebalanceos. Muchos sistemas prefieren rebalanceo semi-automático: el sistema sugiere un plan de reasignación, pero un administrador humano lo aprueba antes de ejecutarlo.',
        difficulty: 2,
      },
    ],

    // Section 4: Enrutamiento de Solicitudes
    4: [
      {
        type: 'definition',
        question_text: '¿Cuáles son las tres estrategias principales para el enrutamiento de solicitudes en un sistema particionado?',
        expected_answer: 'Tres enfoques: (1) El cliente contacta cualquier nodo; si ese nodo tiene la partición, responde directamente, si no, reenvía al nodo correcto. (2) Usar una capa de enrutamiento (routing tier) que determina el nodo correcto para cada solicitud. (3) El cliente conoce la asignación de particiones a nodos y contacta directamente al nodo correcto. El problema central es cómo mantener actualizada la información de qué partición vive en qué nodo.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo usa ZooKeeper para resolver el problema de enrutamiento de particiones?',
        expected_answer: 'ZooKeeper mantiene un registro autoritativo de la asignación de particiones a nodos. Cada nodo se registra en ZooKeeper. Los componentes de enrutamiento (o los clientes) se suscriben a ZooKeeper para recibir notificaciones cuando cambia la asignación. Así, cuando hay un rebalanceo, ZooKeeper notifica a los interesados y las solicitudes se redirigen al nodo correcto. Sistemas como HBase, Kafka y SolrCloud usan ZooKeeper para esto.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 8 — The Trouble with Distributed Systems
  // Sections from chapter-08-resegmented.json (sort_order 0-4, skip 5=Resumen)
  // ========================================================================
  'ddia-ch8': {
    // Section 0: Fallas y Fallos Parciales
    0: [
      {
        type: 'comparison',
        question_text: '¿En qué se diferencia el comportamiento de un programa en un solo ordenador del comportamiento en un sistema distribuido?',
        expected_answer: 'En un solo ordenador, el comportamiento es determinista: funciona correctamente o falla completamente (crash). El hardware es diseñado para ser siempre correcto. En un sistema distribuido hay fallos parciales: algunos componentes pueden funcionar mientras otros fallan, de formas no deterministas. No sabes si un mensaje llegó, si un nodo está caído o solo lento. Esta incertidumbre es la dificultad fundamental de los sistemas distribuidos.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué los sistemas distribuidos deben construirse sobre supuestos pesimistas en vez de optimistas?',
        expected_answer: 'Porque en un sistema distribuido a escala, algo siempre está roto. Con miles de nodos, la probabilidad de que al menos un componente falle es estadísticamente cercana a 1 en todo momento. Si el sistema depende de que todo funcione perfectamente, fallará frecuentemente. Los algoritmos y protocolos deben diseñarse asumiendo que cualquier componente puede fallar en cualquier momento, y el sistema debe seguir funcionando correctamente a pesar de ello.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es un fallo parcial y por qué es particularmente difícil de manejar?',
        expected_answer: 'Un fallo parcial ocurre cuando parte del sistema funciona correctamente mientras otra parte falla o se comporta de forma impredecible. Es difícil de manejar porque: (1) puede ser no determinista — el mismo request puede funcionar a veces y fallar otras, (2) puede ser difícil de detectar — no sabes si un nodo está caído o simplemente lento, (3) no puedes confiar en la información que recibes — los mensajes pueden perderse, duplicarse o retrasarse.',
        difficulty: 1,
      },
    ],

    // Section 1: Redes No Fiables
    1: [
      {
        type: 'definition',
        question_text: '¿Qué tipos de problemas pueden ocurrir al enviar un mensaje por la red en un sistema distribuido?',
        expected_answer: 'El request puede: (1) perderse (nunca llega al destino), (2) estar en una cola esperando ser entregado, (3) el nodo remoto puede haber fallado, (4) el nodo remoto puede haber dejado de responder temporalmente (pausa GC, por ejemplo), (5) la respuesta puede haberse perdido en la red, (6) la respuesta puede estar retrasada en una cola. El emisor no puede distinguir entre estos casos — solo sabe que no recibió respuesta.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué no se puede distinguir entre un nodo caído y un nodo lento en un sistema con red asíncrona, y cómo se maneja?',
        expected_answer: 'En una red asíncrona no hay límite superior garantizado para la entrega de mensajes. Si no recibes respuesta, puede ser que el nodo esté caído, que el mensaje se perdió, o que la respuesta está tardando. La única herramienta práctica es el timeout: si no recibes respuesta en un tiempo determinado, asumes que algo falló. Pero elegir el timeout correcto es difícil: muy corto causa falsos positivos (declarar muerto a un nodo lento), muy largo retrasa la detección de fallos reales.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre una red de circuitos (como telefonía) y una red de paquetes (como Internet), y por qué importa para los sistemas distribuidos?',
        expected_answer: 'Red de circuitos: establece un circuito dedicado con ancho de banda garantizado para toda la comunicación. Latencia predecible, sin congestión en ese circuito, pero desperdicia capacidad si no se usa. Red de paquetes: los datos se dividen en paquetes que compiten por el ancho de banda. Más eficiente en utilización pero sin garantías de latencia — los paquetes pueden encolarse, retrasarse o perderse. Internet usa paquetes, por eso los tiempos de entrega son impredecibles y los timeouts deben ser heurísticos.',
        difficulty: 2,
      },
    ],

    // Section 2: Relojes No Confiables
    2: [
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre un reloj de tiempo real (time-of-day clock) y un reloj monótono, y cuándo usar cada uno?',
        expected_answer: 'Time-of-day clock: retorna la fecha/hora actual (epoch time), se sincroniza con NTP, puede saltar hacia atrás o adelante al sincronizarse. Útil para correlacionar eventos entre máquinas. Reloj monótono: siempre avanza, nunca salta hacia atrás, pero su valor absoluto es arbitrario (solo sirve para medir diferencias de tiempo en la misma máquina). Usar monótono para medir duraciones (timeouts, latencia). Usar time-of-day solo cuando necesitas una referencia temporal compartida, y con precaución.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué es peligroso usar timestamps de relojes para ordenar eventos en un sistema distribuido?',
        expected_answer: 'Los relojes de diferentes máquinas no están perfectamente sincronizados: NTP tiene precisión limitada (milisegundos en el mejor caso, segundos si hay problemas). Si dos nodos escriben "al mismo tiempo", sus timestamps no reflejan el orden real. En estrategias como last-write-wins (LWW), esto puede causar pérdida silenciosa de escrituras: una escritura con timestamp mayor (pero que realmente ocurrió antes) sobrescribe a la otra. Los relojes también pueden saltar hacia atrás al sincronizarse.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué son las pausas de proceso (process pauses) y cómo pueden causar problemas en algoritmos distribuidos?',
        expected_answer: 'Un proceso puede pausarse durante un tiempo arbitrario: garbage collection (GC stop-the-world), swapping a disco, suspensión de la VM, Ctrl-Z del usuario. Durante la pausa, el proceso no ejecuta código pero no sabe que fue pausado. Ejemplo: un líder obtiene un lease (contrato temporal), ejecuta GC de 15 segundos, cuando retoma cree que sigue siendo líder pero el lease ya expiró y otro nodo asumió el liderazgo. Esto puede causar violaciones de seguridad (dos líderes operando simultáneamente).',
        difficulty: 2,
      },
    ],

    // Section 3: Conocimiento, Verdad y Mentiras
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es un "quorum" en el contexto de la toma de decisiones en sistemas distribuidos, y por qué un nodo no puede confiar en sí mismo?',
        expected_answer: 'Un quorum es una votación entre nodos: una decisión requiere un número mínimo de votos de nodos (típicamente la mayoría). Un nodo no puede confiar en sí mismo porque puede estar equivocado: quizá fue declarado muerto por los demás (por timeout), su lease expiró durante una pausa GC, o está experimentando un fallo parcial. La "verdad" en un sistema distribuido se define por lo que la mayoría de nodos acuerdan, no por la perspectiva individual de un nodo.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es un fencing token y qué problema resuelve?',
        expected_answer: 'Un fencing token es un número monótonamente creciente que se emite cada vez que se otorga un lock o lease. Cuando un cliente accede a un recurso compartido, presenta su fencing token. El recurso rechaza operaciones con tokens más viejos que el último que ha visto. Esto resuelve el problema de un cliente que cree tener un lock válido cuando en realidad ya expiró (por pausa GC o red lenta): su token será más viejo que el del nuevo titular y será rechazado.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre un fallo bizantino y los fallos que típicamente asumimos en sistemas distribuidos?',
        expected_answer: 'Fallos típicos (crash-stop/crash-recovery): los nodos pueden caerse o no responder, pero si responden, lo hacen honestamente siguiendo el protocolo. Fallos bizantinos: los nodos pueden comportarse de forma arbitraria, incluyendo enviar mensajes falsos, contradecirse, o actuar maliciosamente. La tolerancia a fallos bizantinos es mucho más costosa (requiere >2/3 de nodos honestos). La mayoría de los sistemas internos no necesitan tolerancia bizantina — asumen que los nodos son "honestos pero torpes".',
        difficulty: 3,
      },
    ],

    // Section 4: Modelos de Sistema y Corrección
    4: [
      {
        type: 'definition',
        question_text: '¿Cuáles son los tres modelos de sistema respecto a temporización (timing) y qué asume cada uno?',
        expected_answer: 'Modelo síncrono: asume límites superiores acotados para retrasos de red, pausas de proceso y drift de relojes. No es realista para la mayoría de sistemas. Modelo parcialmente síncrono: se comporta como síncrono la mayor parte del tiempo, pero ocasionalmente excede los límites. Es el modelo más realista. Modelo asíncrono: no asume nada sobre temporización — ni siquiera se puede usar un timeout. Es el más restrictivo pero algunos algoritmos están diseñados para él.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre los modelos crash-stop, crash-recovery y bizantino para fallos de nodos?',
        expected_answer: 'Crash-stop: un nodo falla dejando de responder permanentemente, nunca vuelve. Crash-recovery: un nodo puede fallar y luego recuperarse con su almacenamiento estable intacto (la memoria se pierde). Es el modelo más realista para la mayoría de sistemas. Bizantino: un nodo puede hacer absolutamente cualquier cosa, incluyendo engañar a otros nodos. Es el modelo más general pero requiere protocolos mucho más complejos.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué son las propiedades de safety y liveness de un algoritmo, y por qué es importante distinguirlas?',
        expected_answer: 'Safety: "nada malo sucede" — si se viola, puedes señalar el momento exacto. Ejemplo: unicidad (no hay dos nodos que crean ser el líder simultáneamente). Liveness: "algo bueno eventualmente sucede" — no puede violarse en un punto finito. Ejemplo: disponibilidad (un request eventualmente recibe respuesta). Es importante distinguirlas porque los algoritmos distribuidos típicamente deben garantizar safety siempre (incluso durante fallos) pero solo necesitan liveness bajo supuestos de que los fallos son temporales.',
        difficulty: 3,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 9 — Consistency and Consensus
  // Sections from chapter-09-resegmented.json (sort_order 0-4, skip 5=Resumen)
  // ========================================================================
  'ddia-ch9': {
    // Section 0: Linearizabilidad
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es la linearizabilidad y cómo se diferencia de la serializabilidad?',
        expected_answer: 'Linearizabilidad: garantía de que cada operación parece tener efecto atómicamente en un punto entre su inicio y fin, como si hubiera una sola copia de los datos. Es una garantía de recencia. Serializabilidad: garantía de que las transacciones se ejecutan como si fueran secuenciales (algún orden serial). Es una garantía de aislamiento. Son conceptos diferentes: linearizabilidad aplica a operaciones individuales sobre un registro, serializabilidad aplica a transacciones (grupos de operaciones).',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿En qué casos prácticos es necesaria la linearizabilidad y no basta con consistencia eventual?',
        expected_answer: 'Es necesaria para: (1) elección de líder — todos deben estar de acuerdo en quién es el líder, no puede haber split-brain, (2) locks y semáforos distribuidos — un lock debe ser mutuamente exclusivo, (3) restricciones de unicidad — como nombres de usuario únicos o dos personas reservando el mismo asiento, (4) transacciones cross-channel — cuando la comunicación ocurre por múltiples canales (ej: escribir a DB y enviar a cola de mensajes).',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué métodos de replicación pueden proporcionar linearizabilidad y cuáles no?',
        expected_answer: 'Pueden proporcionar: replicación single-leader (si lees del líder o de followers sincrónicos). No proporcionan: replicación multi-leader (escrituras concurrentes en diferentes líderes causan conflictos, no son linearizables), replicación leaderless con sloppy quorums (los nodos w y r pueden no solaparse). Incluso con quorum estricto (w+r>n), la linearizabilidad no está garantizada sin mecanismos adicionales de sincronización.',
        difficulty: 2,
      },
    ],

    // Section 1: El Costo de la Linearizabilidad
    1: [
      {
        type: 'definition',
        question_text: '¿Qué establece el teorema CAP y qué significa en la práctica?',
        expected_answer: 'El teorema CAP dice que ante una partición de red (P), un sistema debe elegir entre consistencia (C, linearizabilidad) o disponibilidad (A, seguir respondiendo). No es realmente "elige 2 de 3" — las particiones de red ocurren inevitablemente, así que la elección real es: ante una partición, ¿priorizas consistencia (rechazar requests) o disponibilidad (responder con datos posiblemente desactualizados)?',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué muchos sistemas distribuidos eligen no proporcionar linearizabilidad, incluso cuando no hay partición de red?',
        expected_answer: 'Porque la linearizabilidad tiene un costo de rendimiento significativo. Cada operación linearizable requiere coordinación entre nodos (esperar confirmaciones, verificar que se está leyendo el valor más reciente), lo que incrementa latencia. Muchas aplicaciones toleran consistencia eventual o garantías más débiles, obteniendo mejor latencia y throughput. La linearizabilidad se sacrifica no solo por particiones de red, sino por rendimiento.',
        difficulty: 2,
      },
    ],

    // Section 2: Garantías de Ordenación
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es el orden causal y por qué es una alternativa atractiva a la linearizabilidad?',
        expected_answer: 'El orden causal garantiza que si un evento A causó un evento B, todos los nodos verán A antes que B. Eventos concurrentes (sin relación causal) pueden ordenarse arbitrariamente. Es atractivo porque: (1) preserva la causalidad que los usuarios esperan (no verás una respuesta antes que la pregunta), (2) no requiere coordinación en tiempo real como la linearizabilidad, (3) puede implementarse de forma más eficiente, y (4) es la garantía de consistencia más fuerte que no sacrifica rendimiento.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué son los relojes de Lamport y por qué no son suficientes por sí solos para implementar sistemas distribuidos?',
        expected_answer: 'Los relojes de Lamport asignan un número (counter, nodeID) a cada evento tal que si A causó B, el timestamp de A es menor que el de B. Proporcionan un orden total consistente con la causalidad. Sin embargo, no son suficientes porque el orden total solo se conoce después del hecho — no puedes tomar decisiones en tiempo real. Por ejemplo, para comprobar unicidad de un nombre de usuario, necesitarías esperar a ver todos los eventos posibles para saber si alguien más reclamó el mismo nombre primero.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es el total order broadcast y qué propiedades garantiza?',
        expected_answer: 'Total order broadcast es un protocolo que garantiza: (1) entrega fiable — si un mensaje se entrega a un nodo, se entrega a todos los nodos, y (2) orden total — todos los nodos entregan los mensajes en el mismo orden. Es equivalente a tener un log donde todos los nodos escriben y leen en el mismo orden. Es equivalente en poder al consenso: si tienes total order broadcast puedes implementar consenso, y viceversa.',
        difficulty: 2,
      },
    ],

    // Section 3: Transacciones Distribuidas y Consenso
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es el protocolo two-phase commit (2PC) y cómo funciona?',
        expected_answer: '2PC es un protocolo para transacciones atómicas distribuidas coordinado por un nodo coordinador. Fase 1 (prepare): el coordinador pregunta a cada participante si puede hacer commit. Cada participante responde sí (promete que puede) o no. Fase 2 (commit/abort): si todos dijeron sí, el coordinador ordena commit. Si alguno dijo no, ordena abort. Una vez que un participante dijo sí, está "prometido" y debe esperar la decisión del coordinador, incluso si este falla.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cuál es el problema fundamental del 2PC y por qué se considera un protocolo bloqueante?',
        expected_answer: 'Si el coordinador falla después de enviar "prepare" pero antes de enviar la decisión, los participantes quedan en estado de duda (in-doubt): prometieron que pueden hacer commit, pero no saben si deben hacerlo o abortarlo. No pueden decidir unilateralmente porque otro participante podría haber recibido la decisión opuesta. Deben esperar a que el coordinador se recupere. Esto puede bloquear recursos (locks) indefinidamente. Por eso 2PC es "bloqueante" y no es tolerante a fallos del coordinador.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿En qué se diferencia el 2PC del consenso tolerante a fallos (como Raft o Paxos)?',
        expected_answer: '2PC: requiere que TODOS los participantes voten sí (veto power), usa un coordinador fijo que es punto único de fallo, bloqueante si el coordinador falla. Consenso (Raft/Paxos): requiere la mayoría (quorum), tiene elección de líder integrada (si el líder falla, se elige otro), no es bloqueante porque la mayoría puede progresar sin el resto. 2PC garantiza atomicidad entre participantes heterogéneos; consenso es para acuerdo dentro de un grupo homogéneo de nodos.',
        difficulty: 3,
      },
    ],

    // Section 4: Consenso Tolerante a Fallos
    4: [
      {
        type: 'definition',
        question_text: '¿Qué propiedades debe satisfacer un algoritmo de consenso?',
        expected_answer: 'Un algoritmo de consenso debe satisfacer: (1) Acuerdo uniforme: todos los nodos que deciden, deciden el mismo valor. (2) Integridad: ningún nodo decide dos veces. (3) Validez: si un nodo decide un valor v, algún nodo propuso v (no se inventa valores). (4) Terminación: todo nodo que no falla eventualmente decide. Las tres primeras son propiedades de safety (siempre se cumplen), la terminación es liveness (requiere que la mayoría de nodos funcione).',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué papel juega la elección de líder en algoritmos de consenso como Raft y cómo evitan el split-brain?',
        expected_answer: 'En Raft, un líder propone valores y los followers votan. El líder necesita la mayoría (quorum) para que un valor sea decidido. Evitan split-brain con epochs/terms numerados: cada época tiene a lo sumo un líder. Antes de decidir, el líder verifica que sigue siendo líder obteniendo votos de la mayoría. Si un nodo encuentra un líder con época mayor, reconoce al nuevo líder. Como se necesita la mayoría en cada paso, y dos mayorías siempre se solapan, no pueden existir dos líderes legítimos simultáneamente.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Por qué ZooKeeper y etcd son tan usados en infraestructura distribuida, y qué servicio proveen?',
        expected_answer: 'Implementan consenso tolerante a fallos (basado en Zab/Raft) y lo exponen como un servicio reutilizable. Proveen: (1) almacenamiento linearizable de configuración y metadata, (2) elección de líder como servicio, (3) locks distribuidos, (4) notificaciones de cambios (watches). Esto permite que otros sistemas (Kafka, HBase, Kubernetes) deleguen los problemas difíciles de consenso a una herramienta especializada en vez de reimplementarlos.',
        difficulty: 1,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 11 — Stream Processing
  // Sections from chapter-11-resegmented.json (sort_order 0-4, skip 5=Resumen)
  // ========================================================================
  'ddia-ch11': {
    // Section 0: Transmisión de Flujos de Eventos
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es un evento en el contexto de stream processing y cómo se diferencia de un registro en batch processing?',
        expected_answer: 'Un evento es un registro pequeño e inmutable que contiene los detalles de algo que ocurrió en un momento específico: una acción de usuario, una lectura de sensor, una escritura en BD. A diferencia de batch processing donde los registros están en archivos delimitados, en streaming los eventos se generan continuamente por un "productor" y pueden ser consumidos por múltiples "consumidores" en tiempo real. Un evento se genera una vez pero puede ser procesado por múltiples consumidores.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre mensajería directa y usar un message broker, y cuándo usar cada uno?',
        expected_answer: 'Mensajería directa (UDP multicast, ZeroMQ, webhooks): el productor envía directamente al consumidor, sin intermediario. Rápida y simple, pero si el consumidor está offline o lento, los mensajes se pierden. Message broker: intermediario que almacena mensajes temporalmente, permite que los consumidores procesen a su ritmo. Más robusto, desacopla productores de consumidores, permite múltiples consumidores. Usar directa para baja latencia cuando la pérdida es tolerable; broker cuando necesitas durabilidad y desacoplamiento.',
        difficulty: 2,
      },
    ],

    // Section 1: Logs Particionados
    1: [
      {
        type: 'definition',
        question_text: '¿Qué es un log-based message broker y cómo difiere de un broker tradicional como RabbitMQ?',
        expected_answer: 'Un log-based broker (como Kafka) almacena mensajes de forma durable en un log append-only particionado. Los consumidores leen del log secuencialmente, cada uno con su propio offset. A diferencia de brokers tradicionales que eliminan el mensaje después de entregarlo (acknowledgment), el log lo mantiene y múltiples consumidores pueden leer independientemente. Esto permite releer mensajes, agregar nuevos consumidores que procesen todo el historial, y mantener un registro durable de eventos.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo funciona el particionamiento en Kafka y qué trade-off implica para el paralelismo de consumidores?',
        expected_answer: 'Un topic se divide en particiones, cada una es un log ordenado independiente. Dentro de una partición, el orden se preserva. Un consumer group asigna cada partición a exactamente un consumidor del grupo. El trade-off: el paralelismo máximo es igual al número de particiones (no puedes tener más consumidores activos que particiones en un grupo). Más particiones = más paralelismo, pero más overhead de coordinación y menos garantías de ordenación global.',
        difficulty: 2,
      },
    ],

    // Section 2: Bases de Datos y Flujos
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es Change Data Capture (CDC) y para qué se usa?',
        expected_answer: 'CDC es el proceso de capturar los cambios que ocurren en una base de datos (inserts, updates, deletes) y hacerlos disponibles como un flujo de eventos para otros sistemas. Se usa para: mantener índices de búsqueda sincronizados, alimentar data warehouses, actualizar caches, replicar datos a otros servicios. Típicamente se implementa leyendo el log de replicación/WAL de la BD, convirtiendo cada cambio en un evento en un stream (como un topic de Kafka).',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué CDC es mejor que dual writes (escribir a la BD y al cache/índice en la misma operación)?',
        expected_answer: 'Dual writes tienen problemas de: (1) race conditions — dos escrituras concurrentes pueden llegar en diferente orden a los dos sistemas, causando inconsistencia permanente, (2) fallo parcial — si una escritura tiene éxito y la otra falla, los sistemas quedan inconsistentes. CDC resuelve ambos problemas: la BD es la fuente de verdad, y los cambios se propagan en orden desde el log de la BD, garantizando el mismo orden en todos los sistemas derivados.',
        difficulty: 2,
      },
    ],

    // Section 3: Event Sourcing e Inmutabilidad
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es Event Sourcing y cómo se diferencia de CDC?',
        expected_answer: 'Event Sourcing almacena todos los cambios de estado como eventos inmutables de dominio (no mutaciones de fila como en CDC). Ejemplo: en vez de UPDATE account SET balance=90, almacenas "UserWithdrew $10 from account X". La diferencia con CDC es el nivel de abstracción: CDC captura cambios a nivel de fila de BD (bajo nivel), Event Sourcing captura intenciones de negocio (alto nivel). En Event Sourcing el log de eventos ES la fuente de verdad, las vistas actuales se derivan de él.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Cuáles son las ventajas de almacenar datos como un log inmutable de eventos en vez de estado mutable?',
        expected_answer: 'Ventajas: (1) auditoría completa — puedes rastrear exactamente cómo se llegó al estado actual, (2) debugging — puedes reproducir eventos para entender bugs, (3) nuevas vistas — puedes derivar nuevas representaciones de los datos reprocesando el log, (4) separación de escrituras y lecturas — el log captura los hechos, las vistas se optimizan para consultas específicas, (5) análisis temporal — puedes reconstruir el estado en cualquier punto del pasado.',
        difficulty: 2,
      },
    ],

    // Section 4: Procesamiento de Flujos
    4: [
      {
        type: 'comparison',
        question_text: '¿Cuáles son las tres categorías de joins en stream processing y en qué se diferencian?',
        expected_answer: 'Stream-stream join: correlaciona eventos de dos streams por una ventana temporal (ej: matching clicks con impresiones de ads). Stream-table join (enrichment): enriquece cada evento del stream con datos de una tabla/BD (ej: agregar nombre de usuario a cada evento de actividad). Table-table join (materialized view): mantiene actualizada una vista que combina datos de dos tablas, ambas representadas como changelogs. La diferencia principal es qué se combina: eventos con eventos, eventos con estado, o estado con estado.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es exactamente una "ventana" en stream processing y cuáles son los tipos principales?',
        expected_answer: 'Una ventana agrupa eventos por intervalos de tiempo para procesamiento. Tipos: (1) Tumbling window: intervalos fijos sin solapamiento (ej: cada 5 minutos). (2) Hopping window: intervalos fijos con solapamiento (ej: ventanas de 5 min que avanzan cada 1 min). (3) Sliding window: contiene todos los eventos dentro de un intervalo alrededor de cada evento. (4) Session window: agrupa eventos del mismo usuario sin gaps largos entre ellos, sin tamaño fijo.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es el problema del tiempo en stream processing y por qué no se puede usar simplemente el reloj del sistema?',
        expected_answer: 'El event time (cuando ocurrió) puede diferir del processing time (cuando se procesa) por retrasos de red, colas, reprocesamiento. Usar processing time causa: (1) resultados no reproducibles, (2) eventos tardíos caen en la ventana equivocada. Pero usar event time tiene el problema de los stragglers: no sabes cuándo han llegado todos los eventos de una ventana. Se usan watermarks — estimaciones de progreso — que declaran "probablemente ya llegaron todos los eventos hasta tiempo T", aceptando que algunos tardíos se perderán o manejarán especialmente.',
        difficulty: 3,
      },
    ],
  },

  // ========================================================================
  // THE TAIL AT SCALE — Google Paper
  // Sections from tail-scale-resegmented.json (sort_order 0-4)
  // ========================================================================
  'tail-at-scale-paper': {
    // Section 0: El Problema de la Latencia de Cola
    0: [
      {
        type: 'definition',
        question_text: '¿Por qué la latencia promedio es una métrica engañosa y qué métrica es más reveladora?',
        expected_answer: 'El promedio oculta los outliers: un servicio con 10ms promedio puede tener p99 de 1 segundo. Los percentiles altos (p95, p99, p99.9) revelan la experiencia de los usuarios más afectados. Además, a escala (millones de requests), un p99 de 1s significa que miles de usuarios experimentan esa degradación cada minuto. Amazon demostró que la latencia del p99.9 correlaciona directamente con pérdida de revenue.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo amplifica el fan-out el impacto de la latencia de cola?',
        expected_answer: 'En sistemas con fan-out (un request del usuario dispara N sub-requests en paralelo), la latencia del request completo está determinada por el sub-request más lento. Con 100 sub-requests y p99 de 10ms, la probabilidad de que al menos uno sea lento es 1-(0.99)^100 ≈ 63%. Así, el p99 a nivel de un servidor se convierte en el caso común a nivel del request agregado. A mayor fan-out, peor el efecto.',
        difficulty: 2,
      },
    ],

    // Section 1: Causas de Variabilidad
    1: [
      {
        type: 'fact',
        question_text: '¿Cuáles son las principales causas de variabilidad de latencia en servidores, desde el hardware hasta la aplicación?',
        expected_answer: 'Nivel de hardware: contención de recursos compartidos (CPU cache, bus de memoria, network bandwidth), background tasks (garbage collection, compactación de datos), interferencia entre VMs co-localizadas. Nivel de red: congestión, retransmisiones, encolamiento en switches. Nivel de aplicación: tamaño variable de datos, diferentes rutas de código, head-of-line blocking. La variabilidad es emergente: múltiples causas pequeñas se amplifican cuando interactúan en sistemas de gran escala.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué la variabilidad de latencia empeora con la escala del sistema y no se puede eliminar?',
        expected_answer: 'A más servidores, más probabilidad de que al menos uno sea lento en un momento dado. Las causas son inherentes al hardware y software modernos (GC, multi-tenancy, virtualización, caches jerárquicas). Se puede reducir pero no eliminar porque: (1) muchas optimizaciones de throughput promedio introducen variabilidad, (2) la co-ubicación de cargas es necesaria para eficiencia de costos, (3) eventos raros a nivel de un servidor son comunes a nivel de sistema.',
        difficulty: 2,
      },
    ],

    // Section 2: Técnicas Within-Request
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es un hedged request y cómo reduce la latencia de cola?',
        expected_answer: 'Un hedged request envía la misma solicitud a múltiples réplicas y usa la primera respuesta que llega, descartando las demás. Reduce la latencia de cola porque la probabilidad de que TODAS las réplicas sean lentas es mucho menor que la de que UNA sea lenta. La variante más práctica es "hedging with delay": esperas un tiempo breve (ej: p95), y solo si no hay respuesta, envías la segunda solicitud. Esto reduce el overhead a ~5% de requests adicionales mientras elimina la mayoría de outliers.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es "tied requests" y por qué es mejor que hedged requests simple?',
        expected_answer: 'En tied requests, envías la solicitud a dos réplicas simultáneamente, pero con un "tie": cada réplica sabe de la otra y pueden cancelar mutuamente el trabajo. Cuando una empieza a ejecutar, notifica a la otra que ya la está procesando, y la otra puede descartarla. Es mejor que hedging simple porque: (1) reduce trabajo redundante (una cancela a la otra), (2) maneja mejor el encolamiento (una réplica con cola vacía puede empezar inmediatamente mientras la otra cancela), (3) genera menos overhead.',
        difficulty: 2,
      },
    ],

    // Section 3: Técnicas Cross-Request
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es micro-partitioning y cómo ayuda a reducir la latencia de cola?',
        expected_answer: 'Micro-partitioning divide los datos en muchas más particiones que servidores (ej: 10-20x). Esto permite rebalancear carga dinámicamente moviendo micro-particiones entre servidores. Ayuda porque: (1) reduce la variabilidad de tamaño de partición, (2) permite migrar carga rápidamente de servidores lentos a rápidos, (3) la recuperación de fallos es más rápida (muchos servidores absorben una pequeña parte cada uno).',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Cómo funciona el selective replication para mitigar hot spots?',
        expected_answer: 'Selective replication detecta elementos especialmente populares (hot items) y los replica en más servidores que los datos normales. En vez de replicar uniformemente todo, se aumenta la replicación solo de los items que generan carga desproporcionada. Esto permite que las solicitudes para esos items se distribuyan entre más servidores, reduciendo la probabilidad de congestión. Requiere detección dinámica de popularidad y replicación selectiva.',
        difficulty: 2,
      },
    ],

    // Section 4: Tolerancia y Degradación
    4: [
      {
        type: 'definition',
        question_text: '¿Qué son los "good enough" results y cómo se aplican para tolerar latencia de cola?',
        expected_answer: 'En vez de esperar a que TODOS los sub-requests respondan, el sistema puede retornar resultados parciales cuando tiene "suficientes" respuestas. Ejemplo: si 98 de 100 shards respondieron rápidamente, retornar el resultado con 98 shards en vez de esperar a los 2 lentos. La calidad se degrada ligeramente (resultados incompletos) pero la latencia mejora dramáticamente. Requiere que la aplicación tolere resultados aproximados y comunique al usuario si faltan datos.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es la degradación controlada (graceful degradation) y cómo se diferencia de simplemente fallar?',
        expected_answer: 'La degradación controlada reduce la calidad del servicio proporcionalmente a la presión, en vez de colapsar. Técnicas: (1) retornar resultados de caché (posiblemente stale) en vez de consultar el backend lento, (2) reducir la complejidad del procesamiento (ej: ranking más simple), (3) servir features esenciales y deshabilitar features no-críticas, (4) limitar fan-out a los N shards más rápidos. A diferencia de fallar (timeout → error), el usuario recibe algo útil aunque imperfecto.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // ATTENTION IS ALL YOU NEED — Paper
  // Sections from attention-resegmented.json (sort_order 0-4)
  // ========================================================================
  'attention-paper': {
    // Section 0: El Problema de las Secuencias
    0: [
      {
        type: 'comparison',
        question_text: '¿Cuáles eran las limitaciones de las RNNs/LSTMs para procesar secuencias que el Transformer buscó resolver?',
        expected_answer: 'Limitaciones principales: (1) procesamiento secuencial — no se pueden paralelizar porque cada paso depende del anterior, lo que limita la velocidad de entrenamiento, (2) dependencias de largo alcance — la información de tokens lejanos debe pasar por muchos pasos, degradándose (vanishing/exploding gradients, incluso con LSTM), (3) cuello de botella de información — en seq2seq, toda la secuencia se comprime en un solo vector de contexto fijo. El Transformer resuelve las tres: paraleliza completamente, conecta cualquier par de tokens directamente, y usa atención para acceso selectivo.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es el mecanismo de atención de Bahdanau y qué problema resolvió en las RNNs?',
        expected_answer: 'La atención de Bahdanau permitió que el decoder, al generar cada token de salida, "mirara" directamente a todas las posiciones del encoder en vez de depender solo del vector de contexto fijo. Calcula pesos de atención que indican qué partes de la entrada son más relevantes para el token que se está generando. Resolvió el cuello de botella de información del seq2seq: ya no era necesario comprimir toda la secuencia de entrada en un solo vector.',
        difficulty: 1,
      },
    ],

    // Section 1: Self-Attention
    1: [
      {
        type: 'definition',
        question_text: '¿Cómo funciona el mecanismo de self-attention con queries, keys y values?',
        expected_answer: 'Cada token genera tres vectores: Query (Q, lo que busca), Key (K, lo que ofrece para ser encontrado), y Value (V, la información que contiene). La atención se calcula como: score = QK^T/√d_k, luego softmax para obtener pesos, luego suma ponderada de V. Intuitivamente: Q pregunta "¿qué es relevante para mí?", K responde "esto es lo que yo represento", y el score determina cuánta información de V se incorpora. Cada posición atiende a TODAS las demás posiciones simultáneamente.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué se divide por √d_k en scaled dot-product attention?',
        expected_answer: 'Sin la escala, cuando la dimensión d_k es grande, los productos punto tienden a tener magnitudes grandes, lo que empuja al softmax hacia regiones con gradientes extremadamente pequeños (saturación). Dividir por √d_k normaliza la varianza de los productos punto a ~1, independientemente de la dimensión. Esto mantiene los gradientes en un rango saludable para el entrenamiento. Es un detalle técnico simple pero crucial para la estabilidad del entrenamiento.',
        difficulty: 2,
      },
    ],

    // Section 2: Multi-Head Attention
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es Multi-Head Attention y por qué es mejor que un solo head de atención?',
        expected_answer: 'Multi-Head Attention ejecuta h mecanismos de atención en paralelo, cada uno con sus propias proyecciones lineales de Q, K, V a un subespacio de menor dimensión (d_k/h). Los resultados se concatenan y se proyectan de vuelta. Es mejor porque: (1) cada head puede aprender a atender a diferentes tipos de relaciones (sintaxis, semántica, posición), (2) un solo head debe comprimir toda la información en una distribución softmax, forzando promediar señales diferentes, (3) el costo computacional es similar al de un single-head de dimensión completa.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué diferentes tipos de relaciones aprenden los distintos heads de atención?',
        expected_answer: 'Investigaciones han mostrado que diferentes heads se especializan en: (1) relaciones posicionales (atender al token anterior o siguiente), (2) relaciones sintácticas (sujeto-verbo, modificador-sustantivo), (3) relaciones semánticas (correferencia, sinónimos), (4) patrones de copia (atender a tokens que deben repetirse). Esta especialización emerge del entrenamiento — no está hardcoded. Es análogo a cómo diferentes filtros en una CNN capturan diferentes features visuales.',
        difficulty: 2,
      },
    ],

    // Section 3: La Arquitectura Transformer
    3: [
      {
        type: 'definition',
        question_text: '¿Cuáles son los componentes principales de un bloque Transformer (encoder o decoder) y qué hace cada uno?',
        expected_answer: 'Cada bloque contiene: (1) Multi-Head Self-Attention — permite que cada posición atienda a todas las demás, (2) Feed-Forward Network (FFN) — dos capas lineales con activación no-lineal, aplicada independientemente a cada posición, (3) Residual connections — sumando la entrada al output de cada sub-capa (skip connections), (4) Layer Normalization — normaliza las activaciones para estabilizar el entrenamiento. El decoder añade además masked self-attention (para no ver tokens futuros) y cross-attention encoder-decoder.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué son necesarios los positional encodings en el Transformer y cómo funcionan los sinusoidales?',
        expected_answer: 'Self-attention es invariante al orden: sin información posicional, "el gato come al ratón" y "el ratón come al gato" producirían la misma representación. Los positional encodings suman un vector de posición a cada embedding. Los sinusoidales usan funciones sin/cos de diferentes frecuencias para cada dimensión: PE(pos,2i)=sin(pos/10000^(2i/d)), PE(pos,2i+1)=cos(pos/10000^(2i/d)). Ventaja: permite generalizar a secuencias más largas que las vistas en entrenamiento, y las diferencias relativas de posición se pueden aprender como transformaciones lineales.',
        difficulty: 3,
      },
    ],

    // Section 4: Resultados e Impacto
    4: [
      {
        type: 'fact',
        question_text: '¿Qué resultados obtuvo el Transformer original en traducción y cómo se comparó con modelos anteriores en costo de entrenamiento?',
        expected_answer: 'El Transformer big logró 28.4 BLEU en WMT 2014 English-to-German y 41.0 en English-to-French, superando todos los modelos previos incluyendo ensembles. Lo notable fue el costo: se entrenó en 3.5 días en 8 GPUs P100, mientras que modelos anteriores requerían semanas o meses. El paper demostró que la atención sola (sin recurrencia ni convoluciones) era suficiente, y que la paralelización del Transformer hacía el entrenamiento mucho más eficiente.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo derivó la arquitectura Transformer en los paradigmas encoder-only, decoder-only y encoder-decoder?',
        expected_answer: 'El paper original propuso encoder-decoder para traducción. Después: (1) Encoder-only (BERT): usa solo el encoder con atención bidireccional, excelente para comprensión/clasificación de texto, pre-entrenado con masked language modeling. (2) Decoder-only (GPT, LLaMA): usa solo el decoder con atención causal (masked), excelente para generación, escaló mejor con modelo/datos más grandes y domina hoy. (3) Encoder-decoder (T5, BART): mantiene la estructura original, bueno para tareas seq2seq. La industria convergió en decoder-only por su simplicidad y escalabilidad.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // SCALING LAWS — Paper
  // Sections from scaling-laws-resegmented.json (sort_order 0-4)
  // ========================================================================
  'scaling-laws-paper': {
    // Section 0: Power Laws en Deep Learning
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es una power law en el contexto de scaling laws para modelos de lenguaje?',
        expected_answer: 'Una power law es una relación donde L(x) = (x₀/x)^α, donde L es el loss, x es un recurso (parámetros, datos, cómputo), x₀ es una constante, y α es el exponente. En log-log plot aparece como una línea recta. Kaplan et al. descubrieron que el loss de modelos de lenguaje sigue power laws respecto a N (parámetros), D (datos) y C (cómputo). Esto significa que el rendimiento mejora predeciblemente al escalar, pero con retornos decrecientes (necesitas ~10x más recursos para cada mejora incremental).',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué fue revolucionario el descubrimiento de que el loss sigue power laws predecibles?',
        expected_answer: 'Antes, escalar modelos era empírico: "entrenemos algo más grande y veamos si mejora". Las scaling laws permiten: (1) predecir el rendimiento de un modelo grande entrenando solo modelos pequeños, (2) estimar costos de cómputo antes de entrenar, (3) decidir cómo asignar presupuesto entre modelo más grande vs más datos, (4) planificar desarrollo a largo plazo (cuánto cómputo para qué nivel de rendimiento). Transformó el entrenamiento de LLMs de arte experimental a ingeniería cuantitativa.',
        difficulty: 2,
      },
    ],

    // Section 1: Las Leyes de Escala
    1: [
      {
        type: 'property',
        question_text: '¿Cuáles son las tres scaling laws principales de Kaplan et al. y qué relación describen?',
        expected_answer: 'Las tres power laws: (1) L(N) ∝ N^(-0.076) — el loss decrece como power law del número de parámetros (sin límite de datos). (2) L(D) ∝ D^(-0.095) — el loss decrece como power law de la cantidad de datos (sin límite de modelo). (3) L(C) ∝ C^(-0.050) — el loss decrece como power law del cómputo (con asignación óptima de N y D). Importante: los exponentes son pequeños, lo que significa retornos fuertemente decrecientes — cada 10x de recursos reduce el loss solo un ~20-25%.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿En qué difieren las conclusiones de Kaplan et al. (2020) y Hoffmann et al. (Chinchilla, 2022) sobre cómo escalar?',
        expected_answer: 'Kaplan et al.: recomendaron escalar el modelo (N) más rápido que los datos (D). Su análisis sugirió que dado un presupuesto fijo de cómputo, es mejor tener un modelo grande entrenado con menos datos. Chinchilla (Hoffmann et al.): demostró que N y D deben escalarse al mismo ritmo — para cada duplicación de cómputo, duplicar tanto parámetros como datos. Chinchilla 70B con más datos superó a Gopher 280B con menos datos, probando que los modelos previos estaban "sub-entrenados" (demasiados parámetros para sus datos).',
        difficulty: 3,
      },
    ],

    // Section 2: Entrenamiento Compute-Optimal
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es el entrenamiento compute-optimal y qué pregunta práctica responde?',
        expected_answer: 'El entrenamiento compute-optimal responde: "dado un presupuesto fijo de cómputo C (FLOPs), ¿qué tamaño de modelo (N) y cuántos datos (D) debo usar para minimizar el loss?" Según Chinchilla, la regla es ~20 tokens por parámetro. Si tienes presupuesto para entrenar un modelo de 10B parámetros, necesitas ~200B tokens. Si no tienes suficientes datos, un modelo más pequeño entrenado con los datos que tienes podría ser mejor que uno grande sub-entrenado.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo se usan las scaling laws para predecir el rendimiento de un modelo antes de entrenarlo?',
        expected_answer: 'Se entrenan varios modelos pequeños (ej: 10M-1B parámetros) con diferentes combinaciones de N y D, midiendo el loss. Se ajustan las constantes de las power laws a estos puntos. Luego se extrapola la curva para predecir el loss de modelos más grandes. La relación es L(N,D) = L₀ + (N₀/N)^αN + (D₀/D)^αD, donde L₀ es el loss irreducible. Esto permite estimar que, por ejemplo, un modelo de 100B necesitará X FLOPs y Y tokens para alcanzar un loss de Z.',
        difficulty: 2,
      },
    ],

    // Section 3: Overfitting y Requisitos de Datos
    3: [
      {
        type: 'property',
        question_text: '¿Cómo predicen las scaling laws cuándo un modelo empezará a sobreajustar (overfitting)?',
        expected_answer: 'Las scaling laws cuantifican que el overfitting depende del ratio N/D (parámetros/datos). Si N crece más rápido que D, el modelo empieza a memorizar en vez de generalizar. La fórmula predice que para evitar penalización significativa por overfitting, D debe crecer proporcionalmente a N^(αN/αD). En la práctica, esto significa que para cada 10x de parámetros, necesitas ~10x más datos (según Chinchilla). Sin suficientes datos, hacer el modelo más grande eventualmente deja de ayudar.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué implica el concepto de "loss irreducible" (L₀) en las scaling laws?',
        expected_answer: 'L₀ es el loss mínimo que ningún modelo puede superar, sin importar cuántos parámetros o datos tenga. Representa la entropía intrínseca del lenguaje: la incertidumbre que no se puede eliminar porque el lenguaje natural es inherentemente ambiguo y estocástico. Las scaling laws predicen L = L₀ + términos_de_escala, así que cada recurso adicional solo reduce los términos de escala, nunca L₀. Esto significa que hay un límite absoluto para la mejora por escalar.',
        difficulty: 2,
      },
    ],

    // Section 4: Implicaciones Prácticas
    4: [
      {
        type: 'property',
        question_text: '¿Cómo se usan las scaling laws para planificar el hardware y el presupuesto de entrenamiento de un LLM?',
        expected_answer: 'Proceso: (1) definir el objetivo de rendimiento (loss target), (2) usar la scaling law L(C) para estimar los FLOPs necesarios, (3) determinar N y D óptimos con la regla compute-optimal (ej: 20 tokens/parámetro para Chinchilla), (4) traducir FLOPs a horas-GPU según el throughput del hardware (ej: A100 a 312 TFLOPS), (5) calcular costo = horas-GPU × precio/hora. Ejemplo: si necesitas 10^23 FLOPs con A100s a 50% utilización → ~100 GPUs × ~3 semanas → $X millones.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las limitaciones de las scaling laws y cuándo no aplican?',
        expected_answer: 'Limitaciones: (1) predicen loss en tokens aleatorios, no rendimiento en tareas específicas (emergent abilities pueden aparecer a escalas impredecibles), (2) asumen arquitectura Transformer estándar — cambios arquitectónicos pueden alterar los exponentes, (3) calidad de datos importa tanto como cantidad, pero las scaling laws solo miden cantidad, (4) no capturan el efecto de técnicas de alineación (RLHF, instruction tuning), (5) los exponentes pueden cambiar en diferentes regímenes de escala. Son una guía útil, no una verdad absoluta.',
        difficulty: 3,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 4 — Encoding and Evolution
  // Sections: 0-4 (encoding-formats, thrift-protobuf, avro, schema-evolution, dataflow-modes)
  // ========================================================================
  'ddia-ch4': {
    // Section 0: Formatos de Codificación de Datos
    0: [
      {
        type: 'definition',
        question_text: '¿Cuál es la diferencia entre encoding (serialización) y decoding (deserialización)?',
        expected_answer: 'Encoding (serialización/marshalling) es traducir datos de su representación en memoria (objetos, structs, punteros) a una secuencia de bytes autocontenida para almacenamiento o transmisión por red. Decoding (deserialización/unmarshalling) es el proceso inverso: reconstruir la representación en memoria a partir de la secuencia de bytes.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Qué problemas tiene JSON para representar números comparado con formatos binarios?',
        expected_answer: 'JSON no distingue entre enteros y punto flotante, y no especifica precisión. JavaScript usa IEEE 754 doubles que solo representan exactamente enteros hasta 2^53. Enteros de 64 bits (como Twitter IDs) se corrompen silenciosamente. Además, JSON no soporta datos binarios nativamente — hay que usar Base64, que aumenta el tamaño ~33%. Los formatos binarios (Protobuf, Avro) tienen tipos explícitos para int32, int64, float, double, y bytes.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Por qué MessagePack solo ahorra ~18% respecto a JSON texto?',
        expected_answer: 'Porque MessagePack es una codificación binaria de JSON sin schema: los nombres de campo completos ("userName", "favoriteNumber") siguen incluyéndose en cada registro codificado. Solo se ahorra eliminando comillas, dos puntos y usando codificación binaria de tipos. El verdadero ahorro viene de eliminar los nombres de campo con schemas (Protobuf: ~60% ahorro, Avro: ~65%).',
        difficulty: 1,
      },
    ],

    // Section 1: Thrift y Protocol Buffers
    1: [
      {
        type: 'definition',
        question_text: '¿Qué son los field tags en Thrift y Protocol Buffers y por qué son fundamentales?',
        expected_answer: 'Los field tags son números únicos asignados a cada campo en el schema (ej: 1, 2, 3). En la codificación binaria, solo el tag (1-2 bytes) se incluye en lugar del nombre completo del campo. Esto reduce drásticamente el tamaño. Son fundamentales para schema evolution: el decodificador identifica campos por tag, así que renombrar un campo es gratis y agregar campos nuevos con tags nuevos no rompe lectores viejos (que ignoran tags desconocidos).',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué reglas deben seguirse al modificar un schema de Protocol Buffers para mantener forward y backward compatibility?',
        expected_answer: 'Reglas: (1) NUNCA cambiar el número de tag de un campo existente — invalida todos los datos. (2) NUNCA agregar un campo nuevo como required — código nuevo fallaría al leer registros viejos sin ese campo. (3) Solo agregar campos optional o con valor por defecto. (4) Solo eliminar campos que sean optional (y nunca reutilizar su tag). Renombrar campos es seguro porque los nombres no se codifican.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Qué diferencia hay entre Thrift BinaryProtocol (34 bytes), Thrift CompactProtocol (26 bytes) y Protocol Buffers (33 bytes)?',
        expected_answer: 'BinaryProtocol: cada campo tiene tipo (1 byte) + tag (2 bytes fijos) + valor. CompactProtocol: empaqueta tipo y tag en un solo byte, usa variable-length integers para valores numéricos. Protocol Buffers: similar a CompactProtocol, usa varints. La diferencia principal es la representación: BinaryProtocol es simple pero desperdicia bytes, CompactProtocol y Protobuf optimizan con codificación de longitud variable.',
        difficulty: 2,
      },
    ],

    // Section 2: Apache Avro
    2: [
      {
        type: 'definition',
        question_text: '¿Qué son el writer\'s schema y el reader\'s schema en Avro y cómo interactúan?',
        expected_answer: 'El writer\'s schema es el schema usado para codificar los datos (determina el orden y tipos de los bytes). El reader\'s schema es el schema que el código lector espera. Pueden ser diferentes. Avro hace "schema resolution": compara ambos por nombre de campo. Campos en el writer pero no en el reader se ignoran. Campos en el reader pero no en el writer se rellenan con el valor por defecto del reader\'s schema.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué Avro no necesita field tags y cómo logra ser el formato más compacto?',
        expected_answer: 'Avro simplemente concatena los valores en el orden del schema, sin ningún identificador de campo (ni tags ni nombres). El decodificador sabe qué campo es cuál porque tiene acceso al writer\'s schema y lee los valores en el mismo orden. Esto logra la máxima compacidad (32 bytes para el ejemplo estándar vs 33 de Protobuf y 81 de JSON) pero requiere que el reader tenga el writer\'s schema disponible.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la ventaja de Avro sobre Protobuf para generar schemas automáticamente desde tablas SQL?',
        expected_answer: 'Sin field tags, Avro puede generar schemas dinámicamente: generas un schema Avro desde la definición de la tabla (columna → campo). Si la tabla cambia (agregan columna), generas un nuevo schema y los datos escritos con ambos schemas coexisten — Avro los resuelve por nombre. Con Protobuf, necesitarías asignar y gestionar field tags manualmente para cada columna nueva, lo que hace la generación automática frágil.',
        difficulty: 2,
      },
    ],

    // Section 3: Evolución de Schemas y Compatibilidad
    3: [
      {
        type: 'definition',
        question_text: '¿Qué significan forward compatibility y backward compatibility en el contexto de schemas?',
        expected_answer: 'Backward compatibility: código nuevo puede leer datos escritos por código viejo (fácil — el desarrollador conoce el formato viejo). Forward compatibility: código viejo puede leer datos escritos por código nuevo (más difícil — requiere ignorar graciosamente campos desconocidos). Ambas son necesarias simultáneamente durante rolling upgrades, donde servidores con versión nueva y vieja coexisten.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cuáles son las ventajas prácticas de los formatos con schema (Protobuf, Avro) sobre JSON?',
        expected_answer: '(1) Compactación: datos significativamente más pequeños al omitir nombres de campo. (2) Documentación viva: el schema está garantizado de estar actualizado (si no, la codificación falla). (3) Compatibilidad verificable: puedes detectar rupturas de compatibilidad en CI/CD antes de desplegar. (4) Generación de código: para lenguajes con tipos estáticos, se generan clases/structs que habilitan type-checking en compilación.',
        difficulty: 2,
      },
    ],

    // Section 4: Modos de Flujo de Datos
    4: [
      {
        type: 'comparison',
        question_text: '¿Cuáles son los tres modos principales de flujo de datos y qué implicaciones tiene cada uno para schema evolution?',
        expected_answer: '(1) Via base de datos: los datos pueden sobrevivir al código que los escribió (data outliving code). Un proceso viejo que lee-modifica-reescribe puede perder campos nuevos. (2) Via servicios (REST/RPC): la evolución de API se gestiona con versionado de URL o schema del servicio. RPC no es como llamada local: timeouts, retries, latencia variable. (3) Via message passing: asíncrono, desacoplado. Productores y consumidores evolucionan independientemente manteniendo compatibilidad en los mensajes.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué una llamada RPC es fundamentalmente diferente de una llamada a función local?',
        expected_answer: 'Diferencias: (1) Puede fallar por timeout sin saber si se ejecutó — retrías pueden causar doble ejecución si la operación no es idempotente. (2) Latencia impredecible (nanosegundos vs milisegundos a segundos). (3) No se pueden pasar punteros o referencias de memoria. (4) El cliente y servidor pueden estar en lenguajes diferentes, requiriendo serialización. Los frameworks modernos (gRPC) hacen estas diferencias explícitas en vez de ocultarlas.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Qué ventajas tiene el message passing asíncrono (brokers como Kafka/RabbitMQ) sobre comunicación directa por RPC?',
        expected_answer: '(1) Desacoplamiento temporal: el productor no necesita que el consumidor esté disponible — el broker actúa como buffer. (2) Desacoplamiento de identidad: el productor no necesita la dirección del consumidor, solo el nombre del topic/queue. (3) Fan-out: un mensaje puede entregarse a múltiples consumidores. (4) Retry implícito: si el consumidor falla, el mensaje se reentrega. Trade-off: no recibes respuesta inmediata del consumidor.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // DDIA CHAPTER 7 — Transactions
  // Sections: 0-4 (transaction-concepts, weak-isolation, preventing-lost-updates, write-skew, serializability)
  // ========================================================================
  'ddia-ch7': {
    // Section 0: Conceptos de Transacciones y ACID
    0: [
      {
        type: 'definition',
        question_text: '¿Qué significa cada letra de ACID y cuál es realmente una propiedad de la aplicación, no de la base de datos?',
        expected_answer: 'A (Atomicity): si la transacción falla, todas las escrituras se deshacen — mejor nombre sería "abortability". C (Consistency): los invariantes de la aplicación se preservan — es propiedad de la APP, no de la DB (la "C" es de relleno). I (Isolation): transacciones concurrentes no interfieren entre sí. D (Durability): datos commiteados sobreviven crashes (WAL + replicación). La C depende de que la aplicación escriba transacciones correctas; la DB solo provee A, I, D como herramientas.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre transacciones single-object y multi-object, y por qué se necesitan las multi-object?',
        expected_answer: 'Single-object: atomicidad y aislamiento para un solo registro (WAL para crash recovery, CAS/locks para concurrencia). Multi-object: agrupar lecturas y escrituras a múltiples objetos en una unidad atómica. Se necesitan cuando: (1) actualizar una fila y sus índices secundarios, (2) actualizar foreign keys en otra tabla, (3) transferir dinero entre cuentas, (4) actualizar documentos desnormalizados. Sin multi-object, un fallo entre escrituras deja datos inconsistentes.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué sutilezas tiene el retry de transacciones abortadas?',
        expected_answer: '(1) Si la transacción tuvo éxito pero la red perdió la confirmación, retrías ejecutan la transacción dos veces. (2) Si el error fue por sobrecarga del servidor, retrías empeoran la situación (necesitas backoff exponencial). (3) Si hubo side effects fuera de la DB (enviar email, cobrar tarjeta), esos no se deshacen al abortar. (4) Si el cliente falla durante el retry, los datos pendientes de escribir se pierden.',
        difficulty: 2,
      },
    ],

    // Section 1: Niveles de Aislamiento Débil
    1: [
      {
        type: 'definition',
        question_text: '¿Qué dos garantías proporciona Read Committed y qué anomalía NO previene?',
        expected_answer: '(1) No dirty reads: solo lees datos commiteados. Si otra transacción escribió pero no commiteó, ves el valor viejo. (2) No dirty writes: solo sobrescribes datos commiteados. Si otra transacción tiene un write pendiente, esperas a que commitee. NO previene read skew: puedes leer datos de diferentes puntos en el tiempo dentro de la misma transacción (ej: Alice ve cuenta A antes de la transferencia y cuenta B después).',
        difficulty: 1,
      },
      {
        type: 'definition',
        question_text: '¿Qué es snapshot isolation y cómo se implementa con MVCC?',
        expected_answer: 'Snapshot isolation: cada transacción lee de un snapshot consistente de la DB tomado al inicio. Aunque otras transacciones modifiquen datos, esta transacción ve los datos tal como estaban al comenzar. Se implementa con MVCC (Multi-Version Concurrency Control): la DB mantiene múltiples versiones de cada fila. Cada transacción recibe un ID. Las lecturas aplican reglas de visibilidad: solo ven versiones creadas por transacciones con ID menor que ya estaban commiteadas.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Por qué los nombres de los niveles de aislamiento son confusos entre bases de datos?',
        expected_answer: 'Oracle llama "SERIALIZABLE" a lo que realmente es snapshot isolation (no previene write skew). PostgreSQL llamaba "REPEATABLE READ" a snapshot isolation. MySQL InnoDB tiene "REPEATABLE READ" que no implementa snapshot isolation completo. El estándar SQL define niveles basados en anomalías, pero no prescribe implementaciones, y las DBs implementan garantías diferentes bajo los mismos nombres. Esta confusión es un problema real que causa bugs de concurrencia.',
        difficulty: 2,
      },
    ],

    // Section 2: Prevención de Actualizaciones Perdidas
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es el lost update problem y cuándo ocurre?',
        expected_answer: 'Ocurre en el patrón read-modify-write: dos transacciones leen el mismo valor, lo modifican, y lo escriben. La segunda escritura sobrescribe la primera sin incluir su cambio. Ejemplo: dos usuarios incrementan un contador de 42 a 43 en vez de a 44. Otro ejemplo: dos usuarios editan un wiki — el segundo guardado pierde los cambios del primero. Ocurre con Read Committed y Snapshot Isolation si no se toman precauciones adicionales.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las 5 técnicas para prevenir lost updates y cuándo usar cada una?',
        expected_answer: '(1) Operaciones atómicas (UPDATE x = x + 1): la más simple, para incrementos/appends. (2) Explicit locking (SELECT FOR UPDATE): cuando la lógica de la app es compleja. Riesgo: olvidar el FOR UPDATE. (3) Detección automática: la DB aborta al detectar conflicto (PostgreSQL repeatable read, Oracle serializable). Lo más conveniente. (4) Compare-and-set (WHERE value = old_value): para DBs sin transacciones. Cuidado con snapshots MVCC stale. (5) Conflict resolution: para multi-líder/leaderless. Operaciones conmutativas o merge manual.',
        difficulty: 2,
      },
    ],

    // Section 3: Write Skew y Phantoms
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es write skew y en qué se diferencia del lost update?',
        expected_answer: 'En lost update, dos transacciones escriben el MISMO objeto. En write skew, escriben objetos DIFERENTES basándose en datos que ambas leyeron. Ejemplo: dos doctores de guardia verifican "hay 2 de guardia" y ambos se retiran → 0 doctores. Cada escritura es válida individualmente, pero colectivamente violan el invariante. Write skew sigue el patrón: (1) SELECT WHERE condición, (2) decidir basado en resultado, (3) WRITE que invalida la condición del paso 1 para la otra transacción.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Qué es un phantom y por qué SELECT FOR UPDATE no lo previene?',
        expected_answer: 'Un phantom ocurre cuando una transacción inserta una fila que afecta el resultado de un SELECT WHERE de otra transacción. Ejemplo: dos personas reservan la misma sala — ambas verifican "no hay reservas" (SELECT WHERE), no encuentran nada, e insertan. SELECT FOR UPDATE solo lockea filas que EXISTEN y que el SELECT retorna. Si el SELECT no retorna filas (porque la reserva no existe aún), no hay nada que lockear. La solución es materializar conflictos o usar aislamiento serializable.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es "materializing conflicts" y por qué se considera un hack?',
        expected_answer: 'Es pre-crear filas artificiales solo para poder tomar locks sobre ellas. Ejemplo para meeting rooms: crear una fila por cada combinación sala+horario. Reservar se convierte en UPDATE (no INSERT), permitiendo usar FOR UPDATE. Es un hack porque: (1) creas una tabla sin valor de negocio, solo para locking, (2) contamina el modelo de datos, (3) es propenso a errores si olvidas crear combinaciones. Es preferible usar aislamiento serializable que resuelve el problema en general.',
        difficulty: 2,
      },
    ],

    // Section 4: Serializabilidad
    4: [
      {
        type: 'comparison',
        question_text: '¿Cuáles son los tres enfoques para lograr serializabilidad y cuáles son los trade-offs de cada uno?',
        expected_answer: '(1) Ejecución serial: un solo thread, cero concurrencia. Funciona si todo cabe en RAM y transacciones son stored procedures cortas. Pro: simple. Contra: no escala a múltiples particiones. (2) 2PL: lectores bloquean escritores y viceversa. Pro: correcto, funciona cross-partition. Contra: throughput bajo, deadlocks, latencia impredecible. (3) SSI: optimista — ejecuta sin bloquear, verifica al commitear. Pro: alto throughput con baja contención. Contra: muchos aborts con alta contención.',
        difficulty: 2,
      },
      {
        type: 'definition',
        question_text: '¿Cómo funciona Serializable Snapshot Isolation (SSI) y qué detecta al commitear?',
        expected_answer: 'SSI ejecuta transacciones contra un snapshot MVCC sin bloquear a nadie (como snapshot isolation). Al commitear, la DB verifica dos condiciones: (1) ¿se leyeron datos que otra transacción ya modificó y commiteó? (lecturas stale). (2) ¿las escrituras de esta transacción afectan lecturas de otra transacción en curso? Si detecta conflicto, aborta la transacción y la app reintenta. Es optimista: asume que los conflictos son raros.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Cuándo es 2PL preferible a SSI y viceversa?',
        expected_answer: 'SSI es preferible con baja contención (pocas transacciones tocan los mismos datos): el throughput es cercano a snapshot isolation y los aborts son raros. 2PL es preferible con alta contención: las transacciones esperan en vez de ser abortadas, evitando desperdiciar trabajo. Si la tasa de conflictos es alta, SSI puede gastar más tiempo abortando y rehaciendo transacciones que 2PL esperando locks. En la práctica, la mayoría de workloads tienen baja contención, favoreciendo SSI.',
        difficulty: 3,
      },
    ],
  },

  // ========================================================================
  // OPENCLAW CASE STUDY — Production AI Agent System Architecture
  // Sections: ACP, Plugins, Skills, Memory, A2UI (sort_order 0-4)
  // ========================================================================
  'openclaw-casestudy': {
    // Section 0: Protocolo de Comunicación de Agentes (ACP)
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es el Agent Client Protocol (ACP) de OpenClaw y por qué no usa REST estándar?',
        expected_answer: 'ACP es un protocolo de comunicación basado en NDJSON streams que conecta clientes interactivos con un gateway backend. No usa REST porque los agentes necesitan comunicación bidireccional continua: enviar tool calls, actualizaciones de estado parciales, y texto streaming en una misma interacción. REST es request-response, inadecuado para flujos conversacionales largos con múltiples eventos intermedios.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo maneja OpenClaw las sesiones de agente y qué rol juega el AbortController?',
        expected_answer: 'Las sesiones se gestionan con un in-memory store de objetos AcpSession. El session-mapper resuelve claves de sesión desde metadata de requests, permite resetear sesiones, y asociar sesiones con runs activos. AbortController permite cancelar sesiones en curso de forma limpia, propagando la señal de cancelación a través de todo el pipeline de procesamiento del agente.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Qué diferencias hay entre el patrón de traducción del AcpGatewayAgent y un API gateway tradicional como Kong o Envoy?',
        expected_answer: 'Un API gateway tradicional hace routing/proxy de HTTP requests, rate limiting, y auth. El AcpGatewayAgent es un traductor semántico: convierte solicitudes ACP (con contexto conversacional, estado de sesión, y selección de modelo) en comandos específicos del gateway backend, procesando eventos bidireccionales. Es stateful (mantiene sesiones) y domain-specific (entiende el flujo de un agente), mientras que Kong/Envoy son stateless y domain-agnostic.',
        difficulty: 3,
      },
    ],

    // Section 1: Arquitectura de Plugins y Gestión de Canales
    1: [
      {
        type: 'definition',
        question_text: '¿Qué es un ChannelDock en OpenClaw y qué problema resuelve?',
        expected_answer: 'Un ChannelDock es una representación ligera de un canal de comunicación que proporciona una interfaz consistente para acceder a su metadata y capacidades, independientemente de la plataforma subyacente (Discord, Telegram, WhatsApp, etc.). Resuelve el problema de normalizar 15+ APIs de chat diferentes bajo una abstracción uniforme que el core del sistema puede consumir sin conocer los detalles de cada plataforma.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo implementa OpenClaw la seguridad en canales con DM policies, group policies, y command gating?',
        expected_answer: 'OpenClaw tiene tres capas de seguridad por canal: (1) DM policy determina quién puede enviar mensajes directos al agente (pairing, allowlist por user ID). (2) Group policy controla el comportamiento en grupos (open, allowlist, disabled). (3) Command gating verifica si un comando específico está autorizado para el remitente, usando resolveCommandAuthorizedFromAuthorizers que evalúa access groups y listas de autorizadores. Adicionalmente, mention gating controla si el agente responde solo cuando es mencionado.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Qué se gana y qué se pierde al abstraer todas las plataformas de chat bajo una interfaz ChannelDock uniforme?',
        expected_answer: 'Se gana: código core independiente de plataformas, facilidad para agregar nuevos canales sin tocar el núcleo, testing uniforme, y políticas de seguridad consistentes. Se pierde: features específicos de cada plataforma (threads en Discord, polls, rich cards en LINE, reactions complejas) quedan limitados a lo que la abstracción expone. El diseño de OpenClaw mitiga esto permitiendo que los plugins implementen capabilities opcionales, pero la tensión entre abstracción y especificidad es inherente.',
        difficulty: 3,
      },
    ],

    // Section 2: Skills y Orquestación de Herramientas
    2: [
      {
        type: 'definition',
        question_text: '¿Cómo funciona el sistema de skills de OpenClaw y qué metadata contiene SKILL.md?',
        expected_answer: 'Cada skill es un módulo que integra una herramienta externa (CLI, API, etc.). SKILL.md contiene un bloque metadata.openclaw con el id del skill, kind (tipo), y bins (ejecutables requeridos). También documenta instrucciones de instalación, métodos de autenticación, acciones disponibles, y restricciones de seguridad. El sistema usa esta metadata para automatizar el provisioning de skills.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué OpenClaw delega en CLIs externos (gh, op, gog) en vez de implementar integraciones nativas?',
        expected_answer: 'Delegando en CLIs externos: (1) se aprovecha el mantenimiento del equipo original de cada herramienta, (2) las actualizaciones de la herramienta se obtienen gratis, (3) se reduce la superficie de código propio a mantener, (4) se preserva el modelo de autenticación nativo de cada herramienta. La desventaja es la dependencia en binarios externos, posibles cambios de CLI que rompan la integración, y el overhead de spawn de procesos.',
        difficulty: 2,
      },
    ],

    // Section 3: Memoria Persistente y Autenticación
    3: [
      {
        type: 'definition',
        question_text: '¿Cuál es la diferencia entre memory-core y memory-lancedb en OpenClaw?',
        expected_answer: 'memory-core proporciona memoria foundational basada en archivos con tools memory_search y memory_get para recuperación de corto plazo. memory-lancedb agrega memoria de largo plazo con búsqueda vectorial usando LanceDB para almacenamiento y OpenAI para generar embeddings. Incluye memory_recall, memory_store, memory_forget, y hooks autoCapture/autoRecall que automáticamente almacenan snippets importantes y recuperan memorias relevantes al inicio de conversaciones.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo funcionan los hooks autoCapture y autoRecall de memory-lancedb?',
        expected_answer: 'autoCapture es un lifecycle hook que se ejecuta durante/después de conversaciones: detecta automáticamente snippets importantes de la conversación y los almacena como memorias vectorizadas en LanceDB. autoRecall se activa al inicio de una nueva conversación: extrae el contexto del prompt inicial, genera embeddings, busca memorias similares en LanceDB, y las inyecta en el contexto del agente antes de que responda. Esto permite continuidad sin que el usuario necesite recordar manualmente al agente.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cómo se compara el health monitoring de autenticación de OpenClaw (buildAuthHealthSummary) con un sistema de secrets management como Vault?',
        expected_answer: 'buildAuthHealthSummary monitorea el estado de cada perfil de autenticación clasificándolos como ok, expiring, expired, missing, o static, y maneja cooldowns para intentos fallidos. Es específico para credenciales de agentes y auto-refresh de OAuth tokens. Vault (HashiCorp) es un sistema genérico de secrets management con lease/renew, dynamic secrets, y encryption as a service. OpenClaw opera a nivel de aplicación (credenciales de integraciones), Vault opera a nivel de infraestructura (secretos de cualquier tipo).',
        difficulty: 3,
      },
    ],

    // Section 4: A2UI - Interfaces Generadas por Agentes
    4: [
      {
        type: 'definition',
        question_text: '¿Qué es A2UI y cuáles son sus cuatro principios de diseño?',
        expected_answer: 'A2UI (Agent-to-User Interface) es un framework para que agentes de IA generen UIs ricas usando JSON declarativo. Sus cuatro principios son: (1) Security-first: trata el JSON como datos, no código ejecutable; los clientes tienen un catálogo de componentes pre-aprobados. (2) LLM-friendly: lista plana de componentes con IDs para facilitar la generación por LLMs. (3) Incremental updates: soporta actualizaciones parciales para rendering progresivo. (4) Framework-agnostic: la descripción abstracta se mapea a widgets nativos de cualquier plataforma.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Cómo mitiga A2UI los riesgos de seguridad de ejecutar UI generada por agentes (prompt injection, XSS, phishing)?',
        expected_answer: 'A2UI trata todo el JSON del agente como datos puros, nunca como código ejecutable. Los clientes mantienen un catálogo cerrado de componentes pre-aprobados y solo instancian componentes de ese catálogo. Input sanitization se aplica a todos los valores. Content Security Policies (CSP) restringen recursos externos. Embedded content se aísla en iframes con sandboxing. El agente solo puede solicitar componentes existentes con datos que pasan validación del schema JSON, eliminando la posibilidad de inyectar código arbitrario.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son los trade-offs del enfoque declarativo de A2UI (JSON → catálogo) versus generar código directamente (HTML/React)?',
        expected_answer: 'JSON declarativo: máxima seguridad (no ejecuta código del agente), consistencia visual (catálogo controlado), portabilidad cross-platform (JSON → native widgets). Pero limita la expresividad a componentes del catálogo, no permite UIs completamente nuevas, y requiere mantener catálogos para cada plataforma. Generar código directamente: máxima flexibilidad y expresividad, el agente puede crear cualquier UI. Pero abre vectores de ataque (XSS, prompt injection en HTML), requiere sandboxing complejo, y no es portable entre plataformas.',
        difficulty: 3,
      },
    ],
  },

  // ========================================================================
  // P0 — LINEAR ALGEBRA (Álgebra Lineal para ML)
  // Sections: 0-4
  // ========================================================================
  'p0-linear-algebra': {
    // Section 0: Vectores, Espacios Vectoriales y Bases
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es un espacio vectorial y cuáles son los axiomas fundamentales que debe cumplir?',
        expected_answer: 'Un espacio vectorial es un conjunto V equipado con dos operaciones (suma de vectores y multiplicación por escalar) que satisfacen ocho axiomas: cerradura bajo suma y producto escalar, asociatividad y conmutatividad de la suma, existencia de elemento neutro aditivo y inverso aditivo, y distributividad del producto escalar respecto a la suma de vectores y de escalares. En ML, los espacios vectoriales son el marco algebraico donde viven los embeddings, features y representaciones.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué significa que un conjunto de vectores sea linealmente independiente y por qué es crucial para representaciones en ML?',
        expected_answer: 'Un conjunto de vectores {v₁, v₂, ..., vₙ} es linealmente independiente si la única combinación lineal que produce el vector cero es aquella donde todos los coeficientes son cero (α₁v₁ + α₂v₂ + ... + αₙvₙ = 0 implica α₁ = α₂ = ... = αₙ = 0). En ML esto es fundamental porque vectores linealmente dependientes significan redundancia en la representación: features que no aportan información nueva. PCA, por ejemplo, busca bases ortogonales (máximamente independientes) para eliminar esta redundancia.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre la base estándar (canónica) y una base arbitraria, y qué implicaciones tiene elegir una u otra?',
        expected_answer: 'La base estándar en ℝⁿ son los vectores eᵢ con un 1 en la posición i y ceros en el resto. Una base arbitraria puede ser cualquier conjunto de n vectores linealmente independientes que generen el espacio. La base estándar es intuitiva pero no siempre óptima: en ML, cambiar de base (como hace PCA) permite representar los datos en direcciones de máxima varianza. La base estándar trata todas las dimensiones como igualmente importantes, mientras que bases aprendidas capturan la estructura estadística de los datos.',
        difficulty: 2,
      },
    ],

    // Section 1: Matrices y Transformaciones Lineales
    1: [
      {
        type: 'definition',
        question_text: '¿Qué es el rango de una matriz y qué información proporciona sobre la transformación lineal que representa?',
        expected_answer: 'El rango de una matriz es la dimensión de su espacio columna (o equivalentemente, de su espacio fila). Indica cuántas dimensiones del espacio de salida son realmente "alcanzables" por la transformación. Un rango menor que el mínimo de filas y columnas indica que la transformación colapsa dimensiones, perdiendo información. En redes neuronales, capas con rango deficiente crean cuellos de botella que limitan la capacidad expresiva del modelo.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué establece el teorema de rango-nulidad y por qué es relevante para entender capas de redes neuronales?',
        expected_answer: 'El teorema de rango-nulidad dice que para una matriz A de m×n: rango(A) + nulidad(A) = n, donde la nulidad es la dimensión del espacio nulo (vectores mapeados a cero). Esto significa que toda información que no se preserva (rango) se destruye (nulidad). En redes neuronales, esto explica el trade-off de las capas de reducción de dimensionalidad: al pasar de dimensión n a dimensión k < n, necesariamente hay n - k dimensiones de información que se pierden.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Por qué la multiplicación de matrices se puede interpretar como composición de transformaciones lineales y qué implica esto para deep learning?',
        expected_answer: 'Si A representa una transformación T₁ y B representa T₂, entonces AB representa aplicar primero T₂ y luego T₁ (composición T₁ ∘ T₂). En deep learning, apilar capas lineales sin activaciones no lineal equivale a multiplicar sus matrices de peso, colapsando toda la red en una sola transformación lineal. Por eso las funciones de activación no lineales son esenciales: sin ellas, una red de 100 capas tendría la misma capacidad expresiva que una de 1 capa.',
        difficulty: 2,
      },
    ],

    // Section 2: Geometría Analítica
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es un producto interno (inner product) y qué estructura geométrica induce en un espacio vectorial?',
        expected_answer: 'Un producto interno es una función bilineal, simétrica y definida positiva que toma dos vectores y devuelve un escalar. Induce una noción de longitud (norma: ‖v‖ = √⟨v,v⟩), ángulo entre vectores (cos θ = ⟨u,v⟩ / ‖u‖‖v‖), y ortogonalidad (⟨u,v⟩ = 0). En ML, el producto interno es la base de la similitud coseno usada en embeddings, attention mechanisms, y métricas de similitud semántica.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias entre la norma L1 y la norma L2, y cuándo se prefiere cada una en ML?',
        expected_answer: 'La norma L1 (Manhattan) suma valores absolutos (‖x‖₁ = Σ|xᵢ|), mientras que la norma L2 (Euclidiana) usa la raíz de la suma de cuadrados (‖x‖₂ = √Σxᵢ²). L1 promueve sparsity (muchos componentes exactamente cero) por la geometría de su bola unitaria con esquinas, por eso se usa en Lasso regression y feature selection. L2 distribuye la penalización más uniformemente, evitando pesos extremos, y se usa en Ridge regression. En la práctica, L1 es mejor para seleccionar features relevantes y L2 para regularización general.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es una proyección ortogonal y por qué es un concepto central en métodos como PCA y regresión lineal?',
        expected_answer: 'La proyección ortogonal de un vector v sobre un subespacio W es el punto en W más cercano a v (minimiza la distancia). El vector residual (v - proj) es perpendicular al subespacio. En regresión lineal, la solución de mínimos cuadrados es exactamente la proyección ortogonal de y sobre el espacio columna de X. En PCA, se proyectan los datos sobre el subespacio de máxima varianza. La optimalidad de la proyección ortogonal (minimiza error cuadrático) fundamenta estos métodos.',
        difficulty: 2,
      },
    ],

    // Section 3: Descomposición de Matrices
    3: [
      {
        type: 'definition',
        question_text: '¿Qué son los eigenvalues (autovalores) y eigenvectors (autovectores) de una matriz?',
        expected_answer: 'Un eigenvector v de una matriz A es un vector no nulo que, al ser transformado por A, solo cambia en escala: Av = λv. El escalar λ es el eigenvalue correspondiente. Los eigenvectors representan las direcciones privilegiadas de la transformación (no rotan, solo se estiran o comprimen). En ML, los eigenvalues de la matriz de covarianza indican cuánta varianza existe en cada dirección principal, lo que fundamenta PCA y análisis espectral de grafos.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias clave entre eigendecomposition y SVD, y cuándo se usa cada una?',
        expected_answer: 'Eigendecomposition (A = PDP⁻¹) solo existe para matrices cuadradas y requiere que sea diagonalizable. SVD (A = UΣVᵀ) existe para cualquier matriz de cualquier dimensión, siempre. Eigendecomposition usa una sola base de eigenvectors, SVD usa dos bases ortonormales diferentes (U para el espacio de salida, V para el de entrada). En la práctica, SVD es más general y numéricamente estable. Eigendecomposition se usa cuando la matriz es simétrica (como covarianza), donde coincide con SVD. SVD se usa para compresión, pseudo-inversas, y reducción de dimensionalidad general.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué se dice que SVD es "universal" y qué garantías ofrece que otros métodos no?',
        expected_answer: 'SVD es universal porque: (1) existe para TODA matriz, sin importar dimensiones o propiedades (no requiere ser cuadrada, simétrica, ni invertible), (2) siempre produce bases ortonormales U y V, (3) los valores singulares σᵢ son siempre reales y no negativos, (4) proporciona la mejor aproximación de rango k en norma de Frobenius (teorema de Eckart-Young). Ninguna otra descomposición ofrece todas estas garantías simultáneamente, lo que hace de SVD la herramienta más robusta para compresión (LoRA), pseudo-inversas, y análisis de estabilidad numérica.',
        difficulty: 3,
      },
    ],

    // Section 4: Reducción de Dimensionalidad
    4: [
      {
        type: 'definition',
        question_text: '¿Qué es PCA (Principal Component Analysis) y cuál es su objetivo fundamental?',
        expected_answer: 'PCA es un método de reducción de dimensionalidad que encuentra las direcciones (componentes principales) de máxima varianza en los datos. Matemáticamente, computa los eigenvectors de la matriz de covarianza y proyecta los datos sobre los k eigenvectors con mayores eigenvalues. El objetivo es reducir la dimensionalidad preservando la mayor cantidad posible de información (varianza). PCA asume que las direcciones de mayor varianza son las más informativas, lo cual es óptimo para reconstrucción lineal pero no siempre para clasificación.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias fundamentales entre PCA, t-SNE y UMAP para reducción de dimensionalidad?',
        expected_answer: 'PCA es lineal, preserva estructura global (distancias grandes), es determinístico y escalable, pero no captura relaciones no lineales. t-SNE es no lineal, optimiza preservar estructura local (vecindarios), es estocástico, lento en datasets grandes, y tiende a crear clusters artificiales; no preserva distancias globales. UMAP también es no lineal y preserva estructura local, pero es significativamente más rápido que t-SNE, preserva mejor la estructura global, y tiene fundamentos teóricos más sólidos (topología algebraica). Para exploración visual se prefiere UMAP; para preprocesamiento lineal, PCA.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es la hipótesis del manifold y por qué justifica el uso de reducción de dimensionalidad en ML?',
        expected_answer: 'La hipótesis del manifold postula que los datos de alta dimensión del mundo real (imágenes, texto, audio) realmente viven en o cerca de subvariedades (manifolds) de dimensión mucho menor incrustadas en el espacio de alta dimensión. Por ejemplo, imágenes de rostros de 1M de píxeles realmente varían en pocas dimensiones (pose, iluminación, expresión). Esta hipótesis justifica la reducción de dimensionalidad porque si los datos están concentrados cerca de un manifold de baja dimensión, podemos representarlos eficientemente sin perder información semántica relevante. También explica por qué los autoencoders y embeddings funcionan tan bien.',
        difficulty: 3,
      },
    ],
  },

  // ========================================================================
  // P0 — CALCULUS & OPTIMIZATION (Cálculo y Optimización para ML)
  // Sections: 0-4
  // ========================================================================
  'p0-calculus-optimization': {
    // Section 0: Derivadas Parciales y Gradientes
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es el gradiente de una función escalar y cómo se relaciona con las derivadas parciales?',
        expected_answer: 'El gradiente de una función f: ℝⁿ → ℝ es el vector de todas sus derivadas parciales: ∇f = (∂f/∂x₁, ∂f/∂x₂, ..., ∂f/∂xₙ). Cada componente indica cómo cambia f cuando se mueve infinitesimalmente en esa dimensión, manteniendo las demás fijas. En ML, el gradiente de la función de pérdida respecto a los parámetros del modelo indica la dirección en la que cada parámetro debe ajustarse para reducir el error.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Por qué el gradiente apunta en la dirección de máximo crecimiento de la función y qué implica esto para optimización?',
        expected_answer: 'Dado un punto x, la derivada direccional en dirección u es ∇f·u = ‖∇f‖cos(θ), que se maximiza cuando θ = 0, es decir, cuando u apunta en la misma dirección que ∇f. Por tanto, ∇f es la dirección de máximo incremento, y -∇f es la de máximo decremento. Esto fundamenta el descenso de gradiente: para minimizar la pérdida, nos movemos en dirección -∇f. La magnitud ‖∇f‖ indica qué tan pronunciada es la pendiente, lo que sugiere cuán grande debe ser el paso.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre el gradiente y la Jacobiana, y cuándo se usa cada uno?',
        expected_answer: 'El gradiente aplica a funciones escalares f: ℝⁿ → ℝ y produce un vector de n componentes. La Jacobiana aplica a funciones vectoriales f: ℝⁿ → ℝᵐ y produce una matriz m×n donde cada fila es el gradiente de una componente de salida. El gradiente es un caso especial de la Jacobiana cuando m = 1. En redes neuronales, la Jacobiana describe cómo cada salida de una capa depende de cada entrada, mientras que el gradiente de la loss es lo que se usa para actualizar parámetros.',
        difficulty: 2,
      },
    ],

    // Section 1: Regla de la Cadena
    1: [
      {
        type: 'definition',
        question_text: '¿Qué establece la regla de la cadena multivariable y por qué es el fundamento teórico de backpropagation?',
        expected_answer: 'La regla de la cadena establece que si y = f(g(x)), entonces dy/dx = (dy/dg)·(dg/dx). En el caso multivariable, si una función compuesta tiene variables intermedias, la derivada total se obtiene sumando los productos de derivadas parciales a lo largo de todos los caminos del grafo computacional. Backpropagation es exactamente la aplicación eficiente de la regla de la cadena: propaga gradientes desde la loss hacia los parámetros multiplicando Jacobianas capa por capa.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre modo forward y modo reverse en diferenciación automática, y por qué deep learning usa reverse?',
        expected_answer: 'Forward mode computa derivadas propagando perturbaciones desde las entradas hacia las salidas (eficiente cuando hay pocas entradas y muchas salidas). Reverse mode propaga gradientes desde las salidas hacia las entradas (eficiente cuando hay pocas salidas y muchas entradas). Deep learning usa reverse mode porque típicamente hay una sola salida escalar (la loss) pero millones de parámetros de entrada. Reverse mode computa todos los gradientes en un solo pase hacia atrás (O(1) en número de salidas), mientras que forward mode necesitaría un pase por cada parámetro.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué es un grafo computacional y cómo facilita el cálculo automático de gradientes?',
        expected_answer: 'Un grafo computacional es un DAG (directed acyclic graph) donde los nodos representan operaciones o variables y las aristas representan dependencias de datos. Cada operación elemental (suma, multiplicación, activación) tiene una regla local de derivación conocida. Para calcular gradientes, se hace un forward pass guardando valores intermedios, y luego un backward pass aplicando la regla de la cadena en reversa. Frameworks como PyTorch construyen este grafo dinámicamente, permitiendo diferenciación automática de cualquier programa.',
        difficulty: 2,
      },
    ],

    // Section 2: Backpropagation
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es backpropagation y cuál es su relación con la regla de la cadena?',
        expected_answer: 'Backpropagation es un algoritmo eficiente para calcular gradientes de la función de pérdida respecto a todos los parámetros de una red neuronal. Es la aplicación práctica de la regla de la cadena en modo reverse sobre el grafo computacional de la red. Primero se hace un forward pass para calcular la predicción y la loss, y luego se propagan los gradientes hacia atrás capa por capa, multiplicando las derivadas locales de cada operación. Su eficiencia reside en que reutiliza cálculos intermedios, evitando recomputar derivadas.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es el problema de vanishing gradients, por qué ocurre, y cómo afecta al entrenamiento de redes profundas?',
        expected_answer: 'El vanishing gradient ocurre cuando los gradientes se hacen exponencialmente pequeños al propagarse hacia las capas iniciales de una red profunda. Sucede porque backpropagation multiplica gradientes locales capa por capa, y si estos son menores que 1 (como con sigmoid, cuya derivada máxima es 0.25), el producto de muchos factores pequeños converge a cero. Las capas iniciales dejan de aprender porque sus actualizaciones son negligibles. Soluciones incluyen: ReLU (derivada 1 para valores positivos), residual connections (atajos que permiten gradientes directos), y normalización (BatchNorm, LayerNorm).',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Por qué ReLU resuelve en gran medida el problema de vanishing gradients comparado con sigmoid, y qué problemas nuevos introduce?',
        expected_answer: 'Sigmoid comprime su salida a (0,1) con derivada máxima de 0.25, causando que gradientes se reduzcan al menos 4x por capa. ReLU (max(0,x)) tiene derivada exactamente 1 para x > 0, permitiendo que gradientes fluyan sin atenuación. Sin embargo, ReLU introduce el problema de "dying neurons": si un neuron recibe entradas negativas consistentemente, su gradiente es permanentemente 0 y deja de aprender. Variantes como Leaky ReLU (pequeña pendiente para x < 0) y GELU (suave, usado en Transformers) mitigan esto manteniendo gradientes no nulos.',
        difficulty: 2,
      },
    ],

    // Section 3: Descenso de Gradiente
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es SGD (Stochastic Gradient Descent) y en qué se diferencia del descenso de gradiente clásico?',
        expected_answer: 'SGD es una variante del descenso de gradiente que estima el gradiente usando un solo ejemplo (o un mini-batch) aleatorio en lugar de todo el dataset. El descenso de gradiente clásico (batch) calcula el gradiente exacto sumando sobre todos los ejemplos, lo que es costoso para datasets grandes. SGD introduce ruido en la estimación del gradiente, pero este ruido tiene propiedades beneficiosas: ayuda a escapar de mínimos locales, actúa como regularizador implícito, y permite actualizaciones mucho más frecuentes.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son los trade-offs entre batch gradient descent, SGD puro y mini-batch SGD?',
        expected_answer: 'Batch GD: gradiente exacto, convergencia suave, pero costoso (O(n) por paso) y puede quedarse atrapado en mínimos locales. SGD puro (1 ejemplo): actualizaciones rápidas, buen escape de mínimos locales por el ruido, pero convergencia muy ruidosa y no aprovecha paralelismo de GPU. Mini-batch (típicamente 32-512): compromiso óptimo — reduce varianza del gradiente respecto a SGD puro, aprovecha paralelismo de GPU para cálculos matriciales eficientes, mantiene suficiente ruido para regularización. En la práctica, mini-batch es el estándar por su balance entre eficiencia computacional y calidad de convergencia.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué es momentum en optimización y cómo acelera la convergencia del descenso de gradiente?',
        expected_answer: 'Momentum acumula un promedio exponencial de gradientes pasados y usa esta velocidad acumulada para actualizar los parámetros: vₜ = βvₜ₋₁ + ∇f, θₜ = θₜ₋₁ - αvₜ. Acelera la convergencia de dos formas: (1) en direcciones consistentes, los gradientes se acumulan y el movimiento se acelera (como una bola rodando cuesta abajo), (2) en direcciones oscilantes, los gradientes opuestos se cancelan, reduciendo oscilaciones. Esto es especialmente útil en superficies de pérdida con curvatura desigual (valles estrechos), donde SGD puro oscila perpendicular al valle mientras momentum avanza a lo largo de él.',
        difficulty: 2,
      },
    ],

    // Section 4: Adam y Convexidad
    4: [
      {
        type: 'definition',
        question_text: '¿Qué es el optimizador Adam y qué combina de otros métodos?',
        expected_answer: 'Adam (Adaptive Moment Estimation) combina momentum (primer momento: promedio de gradientes) con RMSProp (segundo momento: promedio de gradientes al cuadrado). Mantiene dos medias móviles exponenciales: mₜ para la dirección promedio del gradiente y vₜ para la magnitud promedio. La actualización divide el momentum por √vₜ, lo que adapta el learning rate por parámetro: parámetros con gradientes grandes reciben pasos más pequeños y viceversa. Incluye corrección de sesgo para los primeros pasos, donde las medias móviles están inicializadas en cero.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Qué diferencias hay entre optimización convexa y no convexa, y por qué deep learning funciona a pesar de ser no convexo?',
        expected_answer: 'En optimización convexa, todo mínimo local es global y los algoritmos de gradiente garantizan convergencia al óptimo. En no convexa (como deep learning), existen múltiples mínimos locales, puntos silla, y mesetas, sin garantías de encontrar el óptimo global. Deep learning funciona porque: (1) en alta dimensión, la mayoría de puntos críticos son puntos silla (no mínimos locales), y SGD escapa de ellos naturalmente, (2) los mínimos locales en redes grandes tienden a tener loss similar al global (landscape benign), (3) mínimos planos (flat minima) generalizan mejor, y SGD con ruido tiende a encontrarlos.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué son importantes los learning rate schedules y cuáles son las estrategias más efectivas?',
        expected_answer: 'El learning rate controla el tamaño de los pasos de optimización y su ajuste dinámico es crítico: muy alto causa divergencia, muy bajo causa convergencia lenta o quedarse en mínimos subóptimos. Las estrategias más efectivas incluyen: warmup (empezar bajo y subir linealmente, esencial para Adam y Transformers para estabilizar las medias móviles iniciales), cosine annealing (decaimiento suave que permite exploración temprana y refinamiento final), step decay (reducir por factor en epochs específicos), y one-cycle (subir y bajar en un ciclo, encontrado empíricamente efectivo). El cosine schedule con warmup es el estándar actual en entrenamiento de LLMs.',
        difficulty: 2,
      },
    ],
  },

  // ========================================================================
  // P0 — PROBABILITY (Probabilidad y Estadística para ML)
  // Sections: 0-4
  // ========================================================================
  'p0-probability': {
    // Section 0: Espacios de Probabilidad
    0: [
      {
        type: 'definition',
        question_text: '¿Qué es un espacio de probabilidad y cuáles son sus tres componentes fundamentales?',
        expected_answer: 'Un espacio de probabilidad es una tripleta (Ω, F, P) donde: Ω es el espacio muestral (conjunto de todos los resultados posibles), F es una σ-álgebra (colección de eventos/subconjuntos de Ω que incluye Ω, es cerrada bajo complementos y uniones contables), y P es una medida de probabilidad (función que asigna valores en [0,1] a eventos en F, con P(Ω) = 1 y aditividad contable). Esta formalización de Kolmogorov permite tratar la probabilidad de manera rigurosa y unificar los casos discreto y continuo.',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es la probabilidad condicional y por qué es el concepto central del razonamiento bayesiano en ML?',
        expected_answer: 'La probabilidad condicional P(A|B) = P(A∩B)/P(B) mide la probabilidad de A dado que B ha ocurrido, actualizando nuestra creencia al incorporar nueva evidencia. Es central en ML porque todo aprendizaje supervisado es esencialmente estimar P(Y|X): la probabilidad de la etiqueta dado los features. El teorema de Bayes P(θ|D) = P(D|θ)P(θ)/P(D) invierte la condicionalidad, permitiendo actualizar creencias sobre parámetros (θ) al observar datos (D), lo que fundamenta el aprendizaje bayesiano.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias fundamentales entre distribuciones discretas y continuas, y cómo afecta esto a los modelos de ML?',
        expected_answer: 'Las distribuciones discretas asignan probabilidades a valores individuales (PMF: P(X = x) > 0), sumando a 1. Las continuas usan densidades (PDF: f(x)), donde P(X = x) = 0 para cualquier punto individual y se integran a 1. En ML, clasificación usa distribuciones discretas (softmax produce PMF sobre clases), mientras que generación continua (imágenes, audio) usa densidades o las aproxima. Los modelos generativos como VAEs necesitan manejar la distinción cuidadosamente: la ELBO involucra log-densidades que pueden ser negativas, a diferencia de log-probabilidades discretas.',
        difficulty: 2,
      },
    ],

    // Section 1: Distribuciones
    1: [
      {
        type: 'definition',
        question_text: '¿Qué es la distribución Gaussiana (normal) y por qué aparece tan frecuentemente en ML?',
        expected_answer: 'La distribución Gaussiana N(μ, σ²) es una distribución continua con PDF proporcional a exp(-(x-μ)²/2σ²), parametrizada por su media μ y varianza σ². Aparece frecuentemente en ML por varias razones: (1) el Teorema del Límite Central garantiza que promedios de variables aleatorias convergen a Gaussianas, (2) maximiza la entropía para varianza fija (asunción de máxima ignorancia), (3) es la conjugada de sí misma, simplificando cálculos bayesianos, (4) muchos procesos físicos y de error son aproximadamente Gaussianos. En VAEs, se usa como prior y como distribución del espacio latente.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la relación entre la distribución Beta y la distribución Dirichlet, y dónde se usan en ML?',
        expected_answer: 'La distribución Beta es una distribución sobre un solo valor en [0,1], parametrizada por α y β, útil como prior para probabilidades binarias. La distribución Dirichlet es la generalización multivariable: una distribución sobre vectores de probabilidad (simplex) de K dimensiones, parametrizada por un vector α de K componentes. Beta es Dirichlet con K=2. En ML, Beta se usa como prior para tasas de éxito (A/B testing, bandit algorithms), y Dirichlet como prior para distribuciones categóricas (topic models como LDA, mezclas bayesianas). Ambas son conjugadas de la multinomial, lo que permite actualizaciones bayesianas analíticas.',
        difficulty: 2,
      },
      {
        type: 'fact',
        question_text: '¿Qué establece el Teorema del Límite Central y qué implicaciones prácticas tiene para ML?',
        expected_answer: 'El Teorema del Límite Central (CLT) establece que la suma (o promedio) de n variables aleatorias independientes e idénticamente distribuidas converge en distribución a una Gaussiana conforme n → ∞, independientemente de la distribución original. En ML, esto implica: (1) promedios de mini-batches se comportan Gaussianamente, justificando supuestos en BatchNorm, (2) errores de predicción agregados tienden a ser Gaussianos, justificando MSE como loss, (3) métricas evaluadas sobre muchos ejemplos tienen intervalos de confianza aproximadamente Gaussianos, (4) gradientes de mini-batch son estimadores cuya distribución es aproximadamente normal.',
        difficulty: 2,
      },
    ],

    // Section 2: Bayes, MLE y MAP
    2: [
      {
        type: 'definition',
        question_text: '¿Qué es Maximum Likelihood Estimation (MLE) y cuál es su principio fundamental?',
        expected_answer: 'MLE es un método de estimación de parámetros que busca los valores θ que maximizan la probabilidad de observar los datos: θ_MLE = argmax P(D|θ). El principio es elegir los parámetros bajo los cuales los datos observados serían más probables. En la práctica, se maximiza el log-likelihood (equivalente por monotonía del log) para convertir productos en sumas. En deep learning, minimizar cross-entropy loss es equivalente a MLE asumiendo distribución categórica. MLE es consistente (converge al valor real con suficientes datos) pero puede overfittear con datos escasos.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuáles son las diferencias entre MLE y MAP, y cuándo preferir uno sobre otro?',
        expected_answer: 'MLE maximiza P(D|θ) — solo la verosimilitud, sin asunciones previas sobre θ. MAP maximiza P(θ|D) ∝ P(D|θ)P(θ) — incorpora un prior P(θ) que codifica creencias previas. MAP con prior Gaussiano N(0, σ²) es equivalente a MLE con regularización L2 (weight decay). MLE es preferible con abundantes datos (el prior se vuelve irrelevante), y MAP con datos escasos donde el prior aporta información útil. MAP reduce overfitting pero introduce sesgo del prior. La diferencia fundamental es filosófica: MLE es frecuentista (parámetros fijos), MAP es bayesiano puntual (parámetros con distribución, pero solo reporta el modo).',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Qué son los priors conjugados y por qué simplifican la inferencia bayesiana?',
        expected_answer: 'Un prior es conjugado de una likelihood si la distribución posterior pertenece a la misma familia que el prior. Por ejemplo, Beta es conjugada de Bernoulli: si el prior es Beta(α,β) y observamos k éxitos en n intentos, el posterior es Beta(α+k, β+n-k). Los priors conjugados simplifican enormemente la inferencia porque el posterior tiene forma cerrada (no requiere integración numérica ni MCMC). Sin conjugación, P(D) = ∫P(D|θ)P(θ)dθ suele ser intratable. En ML moderno con millones de parámetros, la conjugación exacta es rara, pero inspira heurísticas como weight decay (motivado por prior Gaussiano conjugado de la Gaussiana).',
        difficulty: 2,
      },
    ],

    // Section 3: Entropía y KL
    3: [
      {
        type: 'definition',
        question_text: '¿Qué es la entropía de Shannon y qué mide intuitivamente?',
        expected_answer: 'La entropía de Shannon H(X) = -Σ P(x) log P(x) mide la incertidumbre o cantidad promedio de información (en bits si log₂) contenida en una variable aleatoria. Intuitivamente, es el número mínimo promedio de bits necesarios para comunicar el valor de X. Una distribución uniforme tiene máxima entropía (máxima incertidumbre), mientras que una distribución concentrada en un valor tiene entropía cercana a cero. En ML, la entropía de la distribución de salida de un clasificador indica cuán seguro está el modelo de su predicción.',
        difficulty: 1,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre cross-entropy y divergencia KL, y por qué en clasificación da igual minimizar una u otra?',
        expected_answer: 'Cross-entropy H(p,q) = -Σ p(x) log q(x) mide el costo promedio de codificar datos de distribución p usando un código óptimo para q. KL divergence D_KL(p||q) = Σ p(x) log(p(x)/q(x)) = H(p,q) - H(p) mide el costo "extra" de usar q en lugar de p. La diferencia es que KL = cross-entropy - entropía de p. En clasificación, p es la distribución real (etiquetas one-hot, con entropía fija = 0), así que H(p,q) = D_KL(p||q) + constante. Minimizar cross-entropy y minimizar KL son equivalentes porque difieren por una constante respecto a los parámetros del modelo.',
        difficulty: 2,
      },
      {
        type: 'property',
        question_text: '¿Por qué la divergencia KL siempre es no negativa y qué implicación tiene esto?',
        expected_answer: 'La no negatividad de KL (D_KL(p||q) ≥ 0, con igualdad si y solo si p = q casi seguramente) se demuestra mediante la desigualdad de Jensen aplicada a la función convexa -log. Específicamente, D_KL(p||q) = E_p[-log(q/p)] ≥ -log(E_p[q/p]) = -log(1) = 0. La implicación fundamental es que la cross-entropy H(p,q) ≥ H(p): ningún código basado en una distribución incorrecta q puede ser más eficiente que el código óptimo basado en la distribución real p. En ML, esto garantiza que la loss de cross-entropy tiene un límite inferior teórico (la entropía del dataset), y que el modelo óptimo es aquel que iguale la distribución real de los datos.',
        difficulty: 3,
      },
    ],

    // Section 4: Información Mutua y ELBO
    4: [
      {
        type: 'definition',
        question_text: '¿Qué es la información mutua y qué relación tiene con la entropía?',
        expected_answer: 'La información mutua I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = D_KL(P(X,Y) || P(X)P(Y)) mide cuánta información comparten dos variables aleatorias — cuánto reduce la incertidumbre de una conocer la otra. Es simétrica (I(X;Y) = I(Y;X)), no negativa, y es cero si y solo si X e Y son independientes. En ML se usa para feature selection (seleccionar variables más informativas sobre la target), en InfoGAN (maximizar información mutua entre variables latentes y salidas), y en contrastive learning (InfoNCE es un bound inferior de I(X;Y)).',
        difficulty: 1,
      },
      {
        type: 'property',
        question_text: '¿Qué es ELBO (Evidence Lower Bound) y por qué es necesario en modelos generativos como VAEs?',
        expected_answer: 'ELBO = E_q[log P(X|Z)] - D_KL(q(Z|X) || P(Z)) es un límite inferior de log P(X) (la log-evidencia). Es necesario porque en VAEs, log P(X) = ∫P(X|Z)P(Z)dZ es intratable (la integral sobre el espacio latente Z no tiene forma cerrada). Como log P(X) = ELBO + D_KL(q(Z|X) || P(Z|X)) y KL ≥ 0, maximizar ELBO simultáneamente maximiza la evidencia y hace que q(Z|X) se acerque al verdadero posterior P(Z|X). El primer término de ELBO es la calidad de reconstrucción y el segundo es la regularización del espacio latente.',
        difficulty: 2,
      },
      {
        type: 'comparison',
        question_text: '¿Cuál es la diferencia entre comportamiento mode-covering y mode-seeking en divergencias, y cómo afecta a modelos generativos?',
        expected_answer: 'Minimizar D_KL(q||p) (forward KL) produce comportamiento mode-covering: q intenta cubrir todo el soporte de p, prefiriendo sobreestimar la varianza antes que perder modos. Resulta en distribuciones más difusas. Minimizar D_KL(p||q) (reverse KL) produce comportamiento mode-seeking: q se concentra en los modos principales de p, potencialmente ignorando modos menores. Resulta en distribuciones más concentradas. VAEs usan forward KL (mode-covering) en la ELBO, lo que causa outputs borrosos al promediar modos. GANs implícitamente usan algo parecido a reverse KL, produciendo outputs más nítidos pero con mode collapse (ignoran modos). Diffusion models mejoran esto usando score matching que maneja mejor múltiples modos.',
        difficulty: 3,
      },
    ],
  },
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const resourceFilter = process.argv.find(a => a === '--resource')
    ? process.argv[process.argv.indexOf('--resource') + 1]
    : null;
  const shouldClear = process.argv.includes('--clear');

  console.log('=== Seeding Section-Scoped Questions ===\n');

  if (resourceFilter) {
    console.log(`Filtering to resource: ${resourceFilter}\n`);
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  const entries = resourceFilter
    ? Object.entries(questionsBySection).filter(([rid]) => rid === resourceFilter)
    : Object.entries(questionsBySection);

  for (const [resourceId, sections] of entries) {
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

    if (dbSections.length === 0) {
      console.warn(`  No sections found in DB for ${resourceId} — skipping`);
      totalSkipped += Object.values(sections).reduce((sum, qs) => sum + qs.length, 0);
      continue;
    }

    // Optionally clear existing section-scoped questions
    if (shouldClear) {
      const sectionIds = dbSections.map(s => s.id);
      const { error: delErr } = await supabase
        .from('question_bank')
        .delete()
        .in('resource_section_id', sectionIds);

      if (delErr) {
        console.error(`  Error clearing questions for ${resourceId}:`, delErr.message);
      } else {
        console.log(`  Cleared existing section questions`);
      }
    }

    for (const [sortOrderStr, questions] of Object.entries(sections)) {
      const sortOrder = parseInt(sortOrderStr, 10);
      const section = dbSections.find(s => s.sort_order === sortOrder);

      if (!section) {
        console.error(`  Section with sort_order=${sortOrder} not found in DB, skipping ${questions.length} questions`);
        totalSkipped += questions.length;
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
  if (totalSkipped > 0) {
    console.log(`Total questions skipped (missing sections in DB): ${totalSkipped}`);
  }
}

main().catch(console.error);
