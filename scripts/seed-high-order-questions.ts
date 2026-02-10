/**
 * Seed high-order (Bloom 4-5) questions for the question_bank.
 *
 * New types: scenario, limitation, error_spot.
 * These bridge the gap between MC/TF (Bloom 1-2) and evaluation (Bloom 5-6).
 *
 * Run with: npx tsx scripts/seed-high-order-questions.ts
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
// High-order questions keyed by resource_id + sort_order
// ============================================================================

interface HighOrderQuestion {
  type: 'scenario' | 'limitation' | 'error_spot';
  question_text: string;
  expected_answer: string;
  difficulty: 2 | 3;
}

const questionsBySection: Record<string, Record<number, HighOrderQuestion[]>> = {
  // DDIA Ch1 — Reliable, Scalable, and Maintainable Applications
  'ddia-ch1': {
    // Section 0: Confiabilidad
    0: [
      {
        type: 'scenario',
        question_text: 'Un servicio de e-commerce tiene un microservicio de pagos que procesa ~500 transacciones/segundo. Un deploy introduce un bug que causa que el 2% de las transacciones se cobren doble. El bug no genera errores en los logs porque técnicamente las operaciones son exitosas. ¿Cómo debería haberse prevenido esto y cómo lo mitigarías una vez detectado?',
        expected_answer: 'Prevención: tests de integración con assertions sobre idempotencia (mismo request no cobra doble), canary deploys que comparan métricas de negocio (monto total cobrado vs esperado) antes de rollout completo, y reconciliación automática entre órdenes y cobros. Mitigación: rollback inmediato del deploy, identificar transacciones duplicadas comparando timestamps + montos + user_id, emitir reembolsos automáticos para los cobros duplicados, y notificar a los usuarios afectados. La lección: los errores que no generan excepciones son los más peligrosos — necesitas monitoreo de métricas de negocio, no solo de errores técnicos.',
        difficulty: 3,
      },
      {
        type: 'limitation',
        question_text: '¿En qué situaciones la redundancia (tener múltiples copias/réplicas) NO te protege contra fallos?',
        expected_answer: 'La redundancia no protege contra: (1) bugs en software — si el bug existe en el código, todas las réplicas lo ejecutan, (2) errores humanos en configuración — un mal config se aplica a todos los nodos, (3) corrupción de datos silenciosa — si datos corruptos se replican, todas las copias están corruptas, (4) ataques que explotan vulnerabilidades comunes a todas las réplicas, (5) fallos correlacionados — un proveedor de cloud que cae afecta todas las instancias en esa región. La redundancia solo protege contra fallos independientes y no correlacionados.',
        difficulty: 2,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "Un sistema tolerante a fallos debe prevenir todos los posibles fallos para ser confiable. Si un componente puede fallar, el sistema no es confiable."',
        expected_answer: 'El error es confundir "tolerante a fallos" con "prevenir fallos". Un sistema tolerante a fallos no previene los fallos — los espera y maneja. La confiabilidad no requiere que ningún componente falle, sino que el sistema siga funcionando correctamente a pesar de que componentes individuales fallen. Es imposible prevenir todos los fallos; lo importante es que los fallos no se conviertan en failures (pérdida de servicio). El diseño correcto acepta que los componentes fallarán y construye mecanismos para contener y recuperarse de esos fallos.',
        difficulty: 2,
      },
    ],

    // Section 1: Escalabilidad
    1: [
      {
        type: 'scenario',
        question_text: 'Una red social tiene un timeline donde cada usuario ve posts de las personas que sigue. Con 10M usuarios activos, el approach de "leer al momento" (fan-out on read: SELECT posts WHERE author_id IN seguidos) se vuelve lento. Proponen cambiar a "escribir a todos" (fan-out on write: cuando alguien postea, insertar en el timeline de cada seguidor). ¿Qué trade-offs introduce esto y qué problema especial tienen los usuarios con millones de seguidores?',
        expected_answer: 'Fan-out on write: la lectura del timeline es rápida (ya está pre-computado), pero la escritura es costosa — un usuario con 30M seguidores genera 30M inserts por cada post. Trade-offs: (1) mayor uso de almacenamiento (datos duplicados en cada timeline), (2) latencia de escritura alta para celebridades, (3) el timeline puede estar temporalmente incompleto (lag). Solución híbrida (como Twitter): fan-out on write para usuarios normales, pero para celebridades usar fan-out on read al momento de la lectura y mergear con el timeline pre-computado. Es un ejemplo de que la solución óptima depende de la distribución de la carga.',
        difficulty: 3,
      },
      {
        type: 'limitation',
        question_text: '¿En qué situaciones los percentiles altos (p99, p999) pueden ser engañosos o contraproducentes para optimizar?',
        expected_answer: 'Los percentiles altos pueden ser engañosos cuando: (1) la cola es causada por factores aleatorios inevitables (GC pauses, context switches del OS) y optimizarla no es costo-efectivo, (2) el costo de atender al 0.1% más lento supera el beneficio de negocio, (3) en sistemas con muchas llamadas en serie — si haces 100 backend calls, la probabilidad de que al menos una caiga en p99 es alta (tail latency amplification), haciendo que el p99 del sistema sea mucho peor que el de cada componente individual, (4) si la medición incluye outliers como inicializaciones cold-start que no representan el comportamiento normal.',
        difficulty: 2,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "Para medir la performance de un sistema, basta con monitorear el tiempo de respuesta promedio. Si el promedio es bajo, los usuarios están teniendo buena experiencia."',
        expected_answer: 'El error es usar el promedio como métrica suficiente de performance. El promedio esconde la distribución: un promedio de 200ms podría significar que el 95% de requests toma 100ms y el 5% toma 2 segundos. Esos usuarios del p95+ tienen una experiencia terrible. Además, los usuarios que más requests hacen (los más activos/valiosos) son los más propensos a encontrar latencias altas. Se deben usar percentiles (p50, p95, p99) para entender la distribución real. El p50 (mediana) da la experiencia "típica", mientras que p95/p99 revelan los peores casos.',
        difficulty: 2,
      },
    ],

    // Section 2: Mantenibilidad
    2: [
      {
        type: 'scenario',
        question_text: 'Un equipo hereda un monolito de 200K líneas sin tests. Cada cambio pequeño causa regresiones inesperadas en otras partes del sistema. El CTO propone una reescritura completa en microservicios. ¿Qué riesgos tiene esta propuesta y qué alternativa más pragmática sugerirías?',
        expected_answer: 'Riesgos de la reescritura: (1) el segundo sistema suele ser over-engineered (second-system effect), (2) durante la reescritura el monolito sigue necesitando mantenimiento (doble esfuerzo), (3) se pierde conocimiento implícito codificado en el monolito (bugs corregidos, edge cases), (4) timeline impredecible — las reescritas suelen tomar 2-3x más de lo estimado. Alternativa pragmática: Strangler Fig Pattern — gradualmente extraer funcionalidad en servicios nuevos, redirigir tráfico gradualmente, y eventualmente decomisionar partes del monolito. Mientras tanto: agregar tests al monolito primero (characterization tests), mejorar observabilidad, y establecer boundaries internos claros.',
        difficulty: 3,
      },
      {
        type: 'limitation',
        question_text: '¿Cuándo la abstracción puede ser contraproducente para la mantenibilidad de un sistema?',
        expected_answer: 'La abstracción es contraproducente cuando: (1) esconde complejidad esencial que los operadores necesitan entender para debuggear (leaky abstractions que fallan de formas inesperadas), (2) se abstrae demasiado temprano sin entender el dominio (premature abstraction — peor que duplicación), (3) la abstracción introduce indirección que hace difícil seguir el flujo del programa (demasiadas capas), (4) la abstracción mapea mal al dominio real y fuerza workarounds en los consumidores, (5) la abstracción unifica cosas que en realidad son diferentes, forzando parámetros y flags que la complican.',
        difficulty: 2,
      },
    ],
  },

  // DDIA Ch5 — Replication
  'ddia-ch5': {
    // Section 0: Líderes y Seguidores
    0: [
      {
        type: 'scenario',
        question_text: 'Un cluster de 3 nodos con replicación asíncrona basada en líder. El líder acepta una escritura W1, la envía a los followers, pero antes de que el Follower B la reciba, el líder falla. Follower A (que sí recibió W1) es elegido como nuevo líder. ¿Qué pasa con W1 cuando el viejo líder se recupera?',
        expected_answer: 'Cuando el viejo líder se recupera, se reconecta como follower del nuevo líder (Follower A). Tiene que descartar W1 de su log y sincronizarse con el nuevo líder. W1 se preserva porque el nuevo líder (Follower A) la tiene. Pero el Follower B nunca recibió W1, así que la recibirá del nuevo líder durante catch-up. El problema real sería si el follower elegido como líder NO tuviera W1 — en ese caso W1 se perdería permanentemente, lo cual es posible con replicación asíncrona. Este es un riesgo fundamental: la replicación asíncrona no garantiza durabilidad si el líder falla antes de que todos los followers confirmen.',
        difficulty: 2,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "La replicación semi-síncrona (semi-synchronous) garantiza que si el líder falla, no se pierden datos, porque al menos un follower siempre tiene una copia idéntica."',
        expected_answer: 'El error es que la replicación semi-síncrona garantiza que un follower es síncrono en cada momento, pero no necesariamente el mismo follower siempre. Si el follower síncrono falla, el sistema designa otro como síncrono, y hay una ventana donde el nuevo follower síncrono aún no está al día. Además, "copia idéntica" es engañoso — el follower síncrono tiene confirmadas las escrituras hasta el punto de la última confirmación, pero puede haber escrituras en tránsito que aún no confirmó. La garantía es más débil de lo que parece: reduce la probabilidad de pérdida pero no la elimina en todos los escenarios de fallo.',
        difficulty: 3,
      },
    ],

    // Section 1: Problemas con el Retraso de Replicación
    1: [
      {
        type: 'scenario',
        question_text: 'Un usuario actualiza su foto de perfil (escritura al líder), y la página inmediatamente recarga mostrando la foto vieja (lectura de un follower atrasado). El usuario reintenta varias veces, a veces ve la foto nueva y a veces la vieja. ¿Qué garantías de consistencia están violándose y cómo las implementarías?',
        expected_answer: 'Se violan dos garantías: (1) Read-after-write consistency — el usuario no ve su propia escritura. Solución: para datos del perfil propio, siempre leer del líder, o trackear el timestamp de la última escritura y no aceptar lecturas de followers con lag mayor. (2) Monotonic reads — el usuario a veces ve foto nueva y a veces vieja (viaja en el tiempo). Solución: sticky sessions — asegurar que el usuario siempre lea del mismo follower (por ejemplo, usando hash del user_id para elegir follower). Implementación práctica: combinar ambas — lecturas del perfil propio al líder, el resto sticky al mismo follower.',
        difficulty: 2,
      },
      {
        type: 'limitation',
        question_text: '¿En qué situaciones la garantía de "read-after-write consistency" es insuficiente o difícil de implementar?',
        expected_answer: 'Es insuficiente cuando: (1) el usuario accede desde múltiples dispositivos — la técnica de "recordar timestamp de última escritura" debe sincronizarse entre dispositivos, lo cual es un problema de consistencia en sí mismo, (2) en sistemas cross-datacenter — las réplicas están en diferentes regiones y el routing puede enviar a datacenters distintos, (3) cuando la causalidad involucra a múltiples usuarios — si usuario A publica un post y usuario B lo comenta, usuario A necesita "cross-user read-after-write" que es mucho más costoso, (4) bajo alta carga — leer siempre del líder para datos propios puede sobrecargar al líder si muchos usuarios modifican datos frecuentemente.',
        difficulty: 3,
      },
    ],

    // Section 2: Replicación Multi-Líder
    2: [
      {
        type: 'scenario',
        question_text: 'Dos usuarios en diferentes datacenters editan simultáneamente el título del mismo documento. Datacenter A recibe "Título v2" y Datacenter B recibe "Título v3". Ambos replican asincrónicamente al otro datacenter. ¿Qué estrategias de resolución de conflictos aplicarías y cuáles son sus trade-offs?',
        expected_answer: 'Estrategias: (1) Last-write-wins (LWW): asignar timestamp, gana el más reciente. Simple pero pierde la otra edición silenciosamente — inaceptable para datos importantes. (2) Merge automático: concatenar o mergear los valores ("Título v2 / Título v3") — funciona para algunos tipos de datos pero no para todos. (3) Registrar ambos como conflicto y presentar al usuario: más correcto pero requiere UI de resolución y la experiencia de usuario es peor. (4) Conflict-free Replicated Data Types (CRDTs): estructuras de datos que garantizan convergencia automática — pero solo funcionan para operaciones conmutativas/asociativas. El trade-off fundamental: conveniencia (resolver automáticamente) vs correctitud (no perder datos). Para un documento, lo ideal es approach (3) o usar operational transformation como Google Docs.',
        difficulty: 3,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "La replicación multi-líder elimina el punto único de fallo del sistema, porque si un líder falla, los otros líderes continúan operando normalmente sin ninguna interrupción."',
        expected_answer: 'El error es "sin ninguna interrupción". Aunque otros líderes siguen operando, hay consecuencias: (1) las escrituras que el líder caído aceptó pero no replicó se pierden o quedan pendientes, (2) los conflictos de escritura que involucraban al líder caído no se resuelven hasta que vuelva, (3) los clientes rutados a ese datacenter necesitan ser re-rutados (no es transparente), (4) cuando el líder vuelve, puede tener escrituras que conflictan con las que se hicieron durante su ausencia. Multi-líder mejora la disponibilidad pero no la hace perfecta — el fallo de un líder sí tiene impacto, solo que parcial en vez de total.',
        difficulty: 2,
      },
    ],

    // Section 3: Replicación sin Líder
    3: [
      {
        type: 'scenario',
        question_text: 'Un sistema leaderless con n=5, w=3, r=3. Un nodo falla durante una escritura y solo 2 de los 5 nodos la reciben. El sistema reporta fallo al cliente. ¿Qué pasa con los 2 nodos que sí recibieron la escritura? ¿Puede haber inconsistencia?',
        expected_answer: 'Los 2 nodos que recibieron la escritura la tienen almacenada. Cuando el cliente hace una lectura posterior con r=3, podría leer de los 2 nodos actualizados + 1 no actualizado, y por version number detectaría cuál es el valor más reciente. Sin embargo, si read repair no funciona (el cliente o el coordinator no escribe de vuelta), esos 2 nodos tendrán un valor que los otros 3 no tienen, creando inconsistencia persistente. Además, sin anti-entropy process, la divergencia puede crecer. El hecho de que el write "falló" desde la perspectiva del cliente no significa que los datos no existan en algunos nodos — esto puede causar comportamientos inesperados si otro cliente lee de esos nodos.',
        difficulty: 3,
      },
      {
        type: 'limitation',
        question_text: '¿En qué situaciones los quorums (w + r > n) NO garantizan leer el valor más reciente?',
        expected_answer: 'Los quorums no garantizan lecturas actualizadas cuando: (1) se usa sloppy quorum — las escrituras pueden ir a nodos fuera del home set, rompiendo el overlap, (2) escrituras concurrentes — si dos escrituras llegan simultáneamente, no hay "más reciente" definido sin un mecanismo de resolución, (3) lectura y escritura concurrentes — la lectura puede ver solo parte de los nodos actualizados, (4) un nodo con la escritura falla y se restaura desde un backup desactualizado (pierde el overlap), (5) edge cases con clocks desincronizados en last-write-wins. El quorum es una condición necesaria pero no suficiente para linearizabilidad — solo garantiza que hay overlap, no que el overlap se resuelva correctamente.',
        difficulty: 3,
      },
    ],

    // Section 4: Escrituras Concurrentes
    4: [
      {
        type: 'scenario',
        question_text: 'Un carrito de compras usa un sistema leaderless. Dos dispositivos del mismo usuario agregan productos concurrentemente: dispositivo A agrega "leche" y dispositivo B agrega "pan". Si el sistema usa LWW (last-write-wins), ¿qué problema ocurre y cómo lo resolverías con version vectors?',
        expected_answer: 'Con LWW: uno de los dos productos se pierde. Si "pan" tiene timestamp mayor, el carrito solo tiene "pan" — "leche" se descartó silenciosamente. El usuario pierde un item sin saberlo. Con version vectors: cada dispositivo lee el carrito con su version vector, agrega su item, y escribe de vuelta incluyendo el vector. El server detecta que las escrituras son concurrentes (vectores incomparables), crea siblings [{leche}, {pan}], y en la siguiente lectura el cliente recibe ambos siblings y los mergea: {leche, pan}. El carrito preserva ambos items. El trade-off: version vectors son más complejos pero correctos para datos donde perder escrituras es inaceptable.',
        difficulty: 2,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "Si dos operaciones ocurren al mismo tiempo (mismo timestamp), son concurrentes. Si una ocurre antes que la otra (timestamp menor), hay una relación causal."',
        expected_answer: 'El error es equiparar tiempo físico (timestamps) con causalidad. En sistemas distribuidos, los relojes no están perfectamente sincronizados, así que timestamps iguales no significan concurrencia, y timestamps diferentes no implican causalidad. Dos operaciones son concurrentes si ninguna sabe de la otra, independientemente de cuándo ocurrieron en tiempo de reloj. La operación A con timestamp menor pudo no haber causado B — simplemente ocurrió antes en tiempo físico pero B no sabía de A. La causalidad se determina por el flujo de información (si B leyó el resultado de A), no por comparación de relojes. Por eso se usan version vectors o Lamport timestamps en vez de relojes físicos.',
        difficulty: 2,
      },
    ],
  },

  // DDIA Ch6 — Partitioning
  'ddia-ch6': {
    // Section 0: Particionamiento por clave primaria
    0: [
      {
        type: 'scenario',
        question_text: 'Una base de datos particiona datos de sensores IoT por sensor_id (hash partitioning). Necesitas ejecutar un query que busca todas las lecturas de temperatura > 40°C en los últimos 5 minutos, de cualquier sensor. ¿Por qué este query es problemático y cómo rediseñarías el esquema de particionamiento?',
        expected_answer: 'El query es problemático porque con hash partitioning, los datos de cada sensor están en una partición diferente. Un query global (cualquier sensor, rango de tiempo) requiere scatter-gather: enviar el query a TODAS las particiones y mergear resultados. Con miles de particiones, esto es lento y costoso. Rediseño: usar particionamiento compuesto — particionar por rango de tiempo (ej: una partición por hora) como primera dimensión, y dentro de cada partición por hash de sensor_id. El query de "últimos 5 minutos" solo toca unas pocas particiones temporales. Alternativa: mantener un índice secundario global por temperatura+tiempo, particionado por rango de temperatura, que permita localizar rápidamente los datos sin scatter-gather.',
        difficulty: 3,
      },
      {
        type: 'limitation',
        question_text: '¿Cuándo el hash partitioning es una mala elección a pesar de distribuir la carga uniformemente?',
        expected_answer: 'Hash partitioning es malo cuando: (1) los queries necesitan rangos de clave — el hash destruye el orden, forzando scatter-gather en todas las particiones, (2) hay patrones de acceso con localidad temporal/espacial — datos relacionados que se acceden juntos quedan dispersos, (3) necesitas iteración ordenada sobre los datos — el hash hace imposible escanear en orden, (4) tienes hot keys donde un solo hash value concentra el tráfico (ej: un usuario viral) — el hash no ayuda porque todo va a la misma partición, (5) los datos tienen tamaños muy desiguales por key — algunas particiones almacenan mucho más que otras aunque tengan el mismo número de keys.',
        difficulty: 2,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "El particionamiento por hash garantiza distribución uniforme de carga entre particiones, eliminando el problema de hot spots."',
        expected_answer: 'El error es "eliminando el problema de hot spots". El hash distribuye uniformemente los keys entre particiones, pero no elimina hot spots. Si un solo key recibe una cantidad desproporcionada de tráfico (ej: una celebridad posteando o un item viral), todo ese tráfico va a una sola partición sin importar qué función de hash se use. El hash distribuye keys, no requests. Además, si la función de hash no es uniforme o hay demasiados pocos keys, la distribución puede ser desigual. Técnicas como key splitting (agregar un sufijo aleatorio al hot key) pueden ayudar, pero introducen complejidad adicional en lecturas.',
        difficulty: 2,
      },
    ],

    // Section 1: Particionamiento e índices secundarios
    1: [
      {
        type: 'scenario',
        question_text: 'Un marketplace tiene productos particionados por product_id (hash). Los usuarios buscan por categoría ("electrónica") y por precio (< $50). ¿Cómo implementarías índices secundarios para estos queries y cuáles son los trade-offs entre índice local (document-partitioned) e índice global (term-partitioned)?',
        expected_answer: 'Índice local: cada partición mantiene su propio índice de categoría y precio sobre los productos que contiene. Ventaja: las escrituras son locales (rápidas). Desventaja: una búsqueda por categoría requiere scatter-gather a todas las particiones, porque "electrónica" está dispersa en muchas particiones. Índice global: un índice separado particionado por categoría (ej: "electrónica" → lista de product_ids y sus particiones). Ventaja: la búsqueda solo toca 1-2 particiones del índice. Desventaja: las escrituras son más lentas porque deben actualizar particiones de índice remotas, y el índice se actualiza asincrónicamente (puede estar desactualizado). Para un marketplace donde las lecturas dominan, el índice global es mejor para la experiencia de búsqueda, asumiendo tolerancia a lag.',
        difficulty: 3,
      },
      {
        type: 'limitation',
        question_text: '¿En qué casos un índice secundario global (term-partitioned) puede degradar la performance en lugar de mejorarla?',
        expected_answer: 'Un índice global degrada performance cuando: (1) la tasa de escritura es alta — cada escritura puede requerir actualizar múltiples particiones del índice global, aumentando latencia y carga de red, (2) los términos del índice están muy sesgados (hot terms) — si "electrónica" tiene millones de productos, esa partición del índice se convierte en hot spot, (3) el lag de actualización asíncrona es problemático para el negocio — si un producto se publica y no aparece en búsquedas por segundos/minutos, (4) queries que combinan múltiples índices (categoría AND precio AND ubicación) — cada índice está particionado diferente, el merge es costoso, (5) el overhead de mantener la consistencia del índice global en fallos de nodos es significativo.',
        difficulty: 3,
      },
    ],

    // Section 2: Rebalanceo de particiones
    2: [
      {
        type: 'scenario',
        question_text: 'Un cluster de 4 nodos está llegando al 80% de capacidad. Decides agregar 2 nodos más. El rebalanceo mueve un 30% de los datos para equilibrar la carga. Durante el rebalanceo, que toma 2 horas, algunos queries son lentos porque los datos están en tránsito. ¿Cómo minimizarías el impacto del rebalanceo en los usuarios?',
        expected_answer: 'Estrategias: (1) Rebalanceo gradual con throttling — limitar el ancho de banda usado para mover datos, aceptando que tome más tiempo pero sin saturar la red, (2) copiar primero, redirigir después — copiar datos al nuevo nodo mientras el viejo sigue atendiendo requests; solo redirigir cuando la copia está completa, (3) usar particiones fijas (pre-split) — tener muchas más particiones que nodos, así rebalancear es mover particiones enteras sin re-particionar datos, (4) background rebalancing durante horas de bajo tráfico, (5) request routing que sabe qué datos están en tránsito y rutea al nodo correcto (viejo o nuevo). Lo más importante: el rebalanceo no debería ser un "big bang" sino un proceso continuo y gradual.',
        difficulty: 2,
      },
      {
        type: 'error_spot',
        question_text: 'Esta afirmación tiene un error sutil: "La mejor estrategia de particionamiento es usar hash(key) mod N, donde N es el número de nodos. Esto distribuye los datos uniformemente y es simple de implementar."',
        expected_answer: 'El error es que hash(key) mod N es terrible para rebalanceo. Si agregas o quitas un nodo (N cambia), casi todos los keys cambian de partición — la mayoría de los datos necesitan moverse. Por ejemplo, al pasar de 4 a 5 nodos, ~80% de los keys se re-asignan. Esto hace que agregar capacidad sea extremadamente costoso. Soluciones correctas: (1) consistent hashing — solo ~1/N de los keys se mueven al agregar un nodo, (2) particiones fijas — el número de particiones es fijo y mucho mayor que N; los nodos son dueños de un subconjunto de particiones que se redistribuyen sin re-hashear.',
        difficulty: 2,
      },
    ],
  },
};

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Seeding High-Order (Bloom 4-5) Questions ===\n');

  let totalInserted = 0;

  for (const [resourceId, sections] of Object.entries(questionsBySection)) {
    console.log(`Resource: ${resourceId}`);

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
      console.log(`    Inserting ${questions.length} questions (types: ${[...new Set(questions.map(q => q.type))].join(', ')})...`);

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
  console.log(`Total high-order questions inserted: ${totalInserted}`);
  console.log(`Types: scenario, limitation, error_spot (Bloom 4-5)`);
}

main().catch(console.error);
