export interface ReadingQuestion {
  type: 'tradeoff' | 'why' | 'connection' | 'error_detection' | 'design_decision';
  question: string;
  concept: string;
  hint?: string;
}

export const READING_QUESTIONS: Record<string, ReadingQuestion[]> = {
  'ddia-ch1': [
    {
      type: 'why',
      question:
        '¿Por qué Kleppmann separa "faults" de "failures"? Si un disco se corrompe pero el sistema sigue respondiendo, ¿es una fault o una failure? ¿Qué implica para el diseño?',
      concept: 'Fault tolerance',
      hint: 'Piensa en la diferencia entre un componente que falla y el sistema completo que deja de funcionar.',
    },
    {
      type: 'tradeoff',
      question:
        'Twitter eligió entre fan-out on write y fan-out on read para las timelines. ¿Qué trade-off hay en cada enfoque y por qué terminaron con un híbrido?',
      concept: 'Fan-out strategies',
      hint: 'Considera qué pasa con usuarios que tienen millones de seguidores.',
    },
    {
      type: 'design_decision',
      question:
        '¿Por qué los percentiles (p99, p999) son más útiles que el promedio para entender el rendimiento real de un sistema?',
      concept: 'Percentiles y latencia',
      hint: 'Un promedio de 100ms puede esconder que el 1% de los usuarios espera 10 segundos.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se relaciona "tail latency amplification" con sistemas distribuidos? Si un request depende de 5 servicios en paralelo, ¿qué pasa con el p99 del request completo?',
      concept: 'Tail latency amplification',
    },
    {
      type: 'error_detection',
      question:
        '"Para hacer un sistema más confiable, lo mejor es eliminar la intervención humana." ¿Qué está mal con esta afirmación según el capítulo?',
      concept: 'Operabilidad',
      hint: 'Kleppmann argumenta que los humanos son inevitables — la clave es cómo diseñas para ellos.',
    },
    {
      type: 'why',
      question:
        '¿Por qué Kleppmann argumenta que la mantenibilidad es más importante que la performance? ¿Qué tiene que ver con el costo real de un sistema a lo largo de su vida?',
      concept: 'Mantenibilidad vs performance',
    },
  ],

  'ddia-ch2': [
    {
      type: 'design_decision',
      question:
        'El modelo relacional ganó contra el jerárquico (IMS) y el de red (CODASYL). ¿Qué ventaja fundamental lo permitió, y por qué los otros hacían difícil evolucionar una app?',
      concept: 'Evolución de modelos de datos',
      hint: 'Piensa en qué pasa cuando necesitas agregar una relación que no existía en el diseño original.',
    },
    {
      type: 'tradeoff',
      question:
        'Un JSON anidado (CV con educación, experiencia) parece más natural que tablas normalizadas. ¿En qué momento esta ventaja se convierte en desventaja?',
      concept: 'Document model vs relacional',
      hint: 'Considera qué pasa cuando necesitas buscar "todos los que estudiaron en X universidad".',
    },
    {
      type: 'connection',
      question:
        '¿Qué tienen en común las "many-to-many relationships" en document DBs con el viejo problema del modelo de red (CODASYL)? ¿Estamos repitiendo la historia?',
      concept: 'Many-to-many en documentos',
    },
    {
      type: 'why',
      question:
        '¿Por qué "schema-on-read" vs "schema-on-write" es mejor analogía que "schemaless"? ¿Qué implica cada uno para la evolución del código?',
      concept: 'Schema-on-read vs schema-on-write',
      hint: 'Schemaless sugiere ausencia de estructura, pero la estructura siempre existe — la pregunta es dónde se valida.',
    },
    {
      type: 'error_detection',
      question:
        '"Las bases de datos de documentos siempre son más rápidas que las relacionales porque evitan joins costosos." ¿Por qué es incorrecto?',
      concept: 'Performance de document DBs',
      hint: 'Piensa en qué pasa cuando la app necesita hacer los joins que la DB no hace.',
    },
    {
      type: 'design_decision',
      question:
        '¿En qué caso concreto elegirías grafos sobre relacional? No genéricamente — da un ejemplo donde SQL se vuelve insostenible.',
      concept: 'Graph databases',
    },
    {
      type: 'tradeoff',
      question:
        'MapReduce fue reemplazado por modelos más declarativos. ¿Qué limitación fundamental tiene un modelo imperativo para el optimizador de consultas?',
      concept: 'Declarativo vs imperativo',
      hint: 'Si le dices al sistema cómo hacerlo paso a paso, ¿qué libertad le queda para optimizar?',
    },
  ],

  'ddia-ch3': [
    {
      type: 'why',
      question:
        '¿Por qué un append-only log tiene O(n) para lecturas pero O(1) para escrituras? ¿Qué estructura agregas para lecturas rápidas y qué costo tiene?',
      concept: 'Append-only log + índices',
      hint: 'El log es simple pero necesitas una estructura auxiliar que apunte a posiciones en el log.',
    },
    {
      type: 'tradeoff',
      question:
        'Un hash index (Bitcask) ofrece O(1) para lecturas Y escrituras. Suena perfecto. ¿Cuáles son las dos limitaciones fatales?',
      concept: 'Hash index limitations',
      hint: 'Piensa en qué pasa con range queries y con datasets que no caben en memoria.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta "compaction" en LSM-Trees con write amplification? Si un dato se escribe una vez, ¿cuántas veces termina escrito en disco y por qué?',
      concept: 'Write amplification',
    },
    {
      type: 'design_decision',
      question:
        'Los B-Trees reescriben 4KB para cambiar un byte. Los LSM-Trees solo hacen append. ¿Por qué entonces los B-Trees dominan en bases transaccionales (PostgreSQL, MySQL)?',
      concept: 'B-Trees vs LSM-Trees',
      hint: 'Piensa en predictibilidad de lecturas y en qué necesita un sistema transaccional.',
    },
    {
      type: 'error_detection',
      question:
        '"Los LSM-Trees son siempre más rápidos que los B-Trees para escrituras porque son secuenciales." ¿En qué escenario se anula esta ventaja?',
      concept: 'LSM-Tree write performance',
      hint: 'Compaction no es gratis — ¿qué pasa cuando el sistema está bajo alta carga de escritura?',
    },
    {
      type: 'why',
      question:
        '¿Por qué se necesita un WAL si ya tienes la estructura principal en disco? ¿Qué escenario exacto cubre el WAL que la estructura principal no cubre sola?',
      concept: 'Write-Ahead Log',
    },
    {
      type: 'tradeoff',
      question:
        'OLTP vs OLAP: ¿por qué no usar la misma base de datos para ambos? ¿Qué trade-off de storage engine lo impide?',
      concept: 'OLTP vs OLAP',
      hint: 'Row-oriented vs column-oriented no es solo formato — afecta qué operaciones son rápidas.',
    },
  ],

  'ddia-ch4': [
    {
      type: 'why',
      question:
        '¿Por qué Kleppmann argumenta que los formatos de codificación nativa de cada lenguaje (pickle, java.io.Serializable) son una mala elección para almacenar datos a largo plazo? ¿Qué tres problemas fundamentales tienen?',
      concept: 'Language-specific encoding',
      hint: 'Piensa en acoplamiento al lenguaje, seguridad (instanciar clases arbitrarias), y versionado.',
    },
    {
      type: 'tradeoff',
      question:
        'JSON es el estándar dominante para APIs web, pero Kleppmann identifica problemas sutiles. ¿Cuál es el trade-off entre usar JSON (universal, legible) vs Protocol Buffers (compacto, tipado) para comunicación entre microservicios?',
      concept: 'JSON vs binary encoding',
      hint: 'Considera: ¿qué pasa cuando transmites millones de mensajes por segundo? ¿Y cuando necesitas verificar compatibilidad antes de desplegar?',
    },
    {
      type: 'design_decision',
      question:
        'Tienes un data pipeline que exporta tablas SQL a archivos para un data warehouse. ¿Elegirías Avro o Protocol Buffers? ¿Por qué la ausencia de field tags en Avro es una ventaja aquí?',
      concept: 'Avro para schemas dinámicos',
      hint: 'Si una columna se agrega a la tabla SQL, ¿qué pasa con los field tags en Protobuf vs el schema resolution de Avro?',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta la evolución de schemas (ch4) con los rolling upgrades y la replicación (ch5)? ¿Por qué necesitas forward Y backward compatibility simultáneamente durante un despliegue?',
      concept: 'Schema evolution y rolling upgrades',
    },
    {
      type: 'error_detection',
      question:
        '"Una llamada RPC es conceptualmente igual a una llamada a función local, solo que más lenta." ¿Qué está fundamentalmente mal con esta afirmación?',
      concept: 'RPC vs local calls',
      hint: 'Una llamada local nunca falla "a medias" — funciona o lanza una excepción. Una llamada de red puede ejecutarse y perder la respuesta.',
    },
    {
      type: 'tradeoff',
      question:
        'Un schema registry (como Confluent Schema Registry) agrega complejidad operacional. ¿Cuándo vale la pena ese costo adicional vs simplemente versionar la API en la URL?',
      concept: 'Schema registry',
      hint: 'Piensa en sistemas con cientos de servicios que producen y consumen mensajes Kafka.',
    },
    {
      type: 'why',
      question:
        '¿Por qué el problema de "data outliving code" es especialmente peligroso con ORMs? ¿Qué puede pasar si un proceso con schema viejo lee, modifica y reescribe un registro que tiene campos nuevos?',
      concept: 'Data outliving code',
    },
  ],

  'ddia-ch5': [
    {
      type: 'tradeoff',
      question:
        'Replicación síncrona garantiza que los datos están en al menos dos nodos. ¿Por qué entonces la mayoría de los sistemas usan replicación asíncrona a pesar de poder perder datos?',
      concept: 'Sync vs async replication',
      hint: 'Piensa en qué pasa cuando un seguidor síncrono tiene alta latencia o se cae.',
    },
    {
      type: 'why',
      question:
        '¿Por qué "read-after-write consistency" es un problema específico de la replicación asíncrona? Describe un escenario concreto donde un usuario ve datos desactualizados de algo que acaba de escribir.',
      concept: 'Read-after-write consistency',
    },
    {
      type: 'error_detection',
      question:
        '"Si el líder muere, simplemente promovemos al seguidor más reciente y no se pierde ningún dato." ¿Qué está mal con esta afirmación en un sistema con replicación asíncrona?',
      concept: 'Failover y pérdida de datos',
      hint: 'El seguidor "más reciente" puede estar segundos detrás del líder.',
    },
    {
      type: 'design_decision',
      question:
        'En un sistema leaderless (estilo Dynamo), ¿por qué se necesita que W + R > N para garantizar lecturas frescas? ¿Qué pasa si W + R ≤ N?',
      concept: 'Quorum reads/writes',
      hint: 'Piensa en la intersección de conjuntos: los nodos que escribieron y los que lees.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se relaciona el problema de "split brain" en replicación con el problema de consenso del capítulo 9? ¿Por qué detectar que el líder murió es tan difícil?',
      concept: 'Split brain',
    },
    {
      type: 'why',
      question:
        '¿Por qué "monotonic reads" requiere fijar al usuario a una réplica específica? ¿No sería suficiente con que todas las réplicas apliquen los cambios en el mismo orden?',
      concept: 'Monotonic reads',
      hint: 'Aplicar en el mismo orden no significa que estén al mismo punto en el tiempo.',
    },
    {
      type: 'tradeoff',
      question:
        'Multi-leader replication permite escrituras en múltiples datacenters simultáneamente. ¿Qué nuevo problema introduce que single-leader no tiene, y cómo se resuelve típicamente?',
      concept: 'Multi-leader conflict resolution',
    },
  ],

  'ddia-ch6': [
    {
      type: 'tradeoff',
      question:
        'Hash partitioning distribuye datos uniformemente, pero pierde la capacidad de hacer range queries eficientes. ¿En qué tipo de aplicación aceptarías este trade-off y en cuál no?',
      concept: 'Hash vs range partitioning',
      hint: 'Piensa en time-series data vs user profiles.',
    },
    {
      type: 'why',
      question:
        '¿Por qué hash(key) mod N es una mala estrategia de particionamiento cuando necesitas agregar nodos? ¿Qué problema resuelve consistent hashing?',
      concept: 'Consistent hashing',
      hint: 'Calcula qué porcentaje de datos se mueve al pasar de 10 a 11 nodos con mod N.',
    },
    {
      type: 'error_detection',
      question:
        '"Los hotspots solo ocurren con range partitioning porque hash partitioning distribuye uniformemente." ¿Por qué esto es incorrecto?',
      concept: 'Hotspots',
      hint: 'Piensa en una celebridad cuyo user_id siempre va a la misma partición, sin importar el hash.',
    },
    {
      type: 'design_decision',
      question:
        'Tienes una tabla de eventos con timestamp como key primaria y necesitas range queries por fecha. ¿Cómo diseñarías el particionamiento para evitar que todas las escrituras actuales vayan a una sola partición?',
      concept: 'Partitioning time-series data',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se complementan particionamiento (ch6) y replicación (ch5)? ¿Por qué necesitas ambos y no solo uno?',
      concept: 'Partitioning + replication',
      hint: 'Particionamiento resuelve escala, replicación resuelve disponibilidad. Sin uno, el otro falla.',
    },
    {
      type: 'tradeoff',
      question:
        'Un índice secundario local (document-partitioned) vs global (term-partitioned): ¿cuándo elegirías cada uno? Piensa en el costo de escritura vs lectura.',
      concept: 'Secondary indexes in partitioned data',
    },
  ],

  'ddia-ch7': [
    {
      type: 'why',
      question:
        '¿Por qué Kleppmann dice que la "C" en ACID es "de relleno"? Si consistency es una propiedad de la aplicación y no de la base de datos, ¿qué herramientas provee la DB para que la app la mantenga?',
      concept: 'ACID Consistency',
      hint: 'La DB ofrece atomicidad y aislamiento. La aplicación define los invariantes y escribe transacciones que los preserven.',
    },
    {
      type: 'tradeoff',
      question:
        'Read Committed es el nivel de aislamiento por defecto en PostgreSQL. ¿Por qué no usan Serializable como default? ¿Qué trade-off está implícito en esta decisión?',
      concept: 'Read Committed como default',
      hint: 'Piensa en rendimiento: ¿cuántas aplicaciones realmente tienen problemas de concurrencia vs cuántas sufrirían la penalización de rendimiento?',
    },
    {
      type: 'error_detection',
      question:
        '"Snapshot isolation previene todas las anomalías de concurrencia porque cada transacción ve una foto consistente de los datos." ¿Qué está mal con esta afirmación?',
      concept: 'Limitaciones de snapshot isolation',
      hint: 'Snapshot isolation previene read skew y dirty reads/writes, pero permite write skew y phantoms.',
    },
    {
      type: 'design_decision',
      question:
        'Tienes una aplicación de reservas donde dos usuarios pueden intentar reservar la última habitación simultáneamente. ¿Qué nivel de aislamiento y qué técnica usarías? ¿Por qué SELECT FOR UPDATE no es suficiente si la habitación aún no tiene reserva?',
      concept: 'Phantoms en reservas',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se relaciona el concepto de lost updates (ch7) con el problema de conflictos en replicación multi-líder (ch5)? ¿Por qué las soluciones del ch7 (locks, CAS) no funcionan en multi-líder?',
      concept: 'Lost updates y replicación',
      hint: 'En multi-líder, las escrituras ocurren en nodos diferentes. No puedes tomar un lock que abarque dos datacenters.',
    },
    {
      type: 'why',
      question:
        '¿Por qué SSI (Serializable Snapshot Isolation) fue un avance tan significativo cuando se publicó en 2008? ¿Qué problema práctico de 2PL resuelve sin sacrificar correctness?',
      concept: 'SSI vs 2PL',
      hint: '2PL tiene throughput reducido por contención de locks y deadlocks frecuentes. SSI usa control optimista.',
    },
    {
      type: 'tradeoff',
      question:
        'Ejecución serial real (VoltDB, Redis) suena absurdo en la era de CPUs de 128 cores. ¿En qué tipo de workload es realmente la mejor opción, y cuándo es inaceptable?',
      concept: 'Serial execution viability',
      hint: 'Piensa en: ¿qué pasa si una transacción necesita datos de múltiples particiones? ¿Y si necesita hacer una llamada de red?',
    },
  ],

  'ddia-ch8': [
    {
      type: 'why',
      question:
        '¿Por qué en un sistema distribuido "no recibir respuesta" es fundamentalmente diferente a "recibir un error"? ¿Qué implica esto para el diseño de retries?',
      concept: 'Unreliable networks',
      hint: 'Si no recibes respuesta, la operación puede haberse ejecutado. Si retrías, ¿qué pasa si se ejecuta dos veces?',
    },
    {
      type: 'error_detection',
      question:
        '"Para ordenar eventos en un sistema distribuido, basta con usar timestamps sincronizados por NTP." ¿Qué está fundamentalmente mal con esta afirmación?',
      concept: 'Unreliable clocks',
      hint: 'NTP puede tener errores de milisegundos. ¿Qué pasa si dos eventos ocurren con 1ms de diferencia?',
    },
    {
      type: 'design_decision',
      question:
        'Un nodo obtiene un lease (lock temporal) por 10 segundos. ¿Por qué una pausa de GC de 15 segundos puede causar corrupción de datos, y cómo lo previenen los fencing tokens?',
      concept: 'Process pauses y fencing',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta el concepto de "fallas parciales" del capítulo 8 con la necesidad de consenso del capítulo 9? ¿Por qué las fallas parciales hacen que el consenso sea tan difícil?',
      concept: 'Partial failures and consensus',
    },
    {
      type: 'tradeoff',
      question:
        'Timeouts cortos detectan fallas rápido pero generan falsos positivos. Timeouts largos son precisos pero lentos. ¿Cómo elegirías el timeout para un sistema de elección de líder?',
      concept: 'Timeout configuration',
      hint: 'Un falso positivo en elección de líder puede causar split brain.',
    },
    {
      type: 'why',
      question:
        '¿Por qué la mayoría de los sistemas no necesitan tolerancia a fallas bizantinas? ¿En qué contextos específicos sí es necesaria?',
      concept: 'Byzantine faults',
    },
  ],

  'ddia-ch9': [
    {
      type: 'why',
      question:
        '¿Por qué la linearizabilidad es más costosa que la eventual consistency? ¿Qué tiene que hacer el sistema internamente para garantizar que una lectura siempre ve la escritura más reciente?',
      concept: 'Linearizability cost',
      hint: 'Piensa en cuántos nodos necesitas consultar para cada lectura.',
    },
    {
      type: 'tradeoff',
      question:
        'El teorema CAP dice que durante una partición de red debes elegir entre C y A. Kleppmann critica esta simplificación. ¿Por qué dice que es más útil pensar en un espectro de garantías?',
      concept: 'CAP theorem critique',
    },
    {
      type: 'error_detection',
      question:
        '"2PC (Two-Phase Commit) resuelve el problema de transacciones distribuidas de forma segura y eficiente." ¿Cuál es el fallo fundamental de 2PC que lo hace inadecuado para muchos sistemas?',
      concept: 'Two-Phase Commit limitations',
      hint: '¿Qué pasa si el coordinador muere entre las fases prepare y commit?',
    },
    {
      type: 'design_decision',
      question:
        '¿Cuándo usarías un sistema CP (como ZooKeeper) vs uno AP (como Cassandra)? Da un ejemplo concreto de una operación que requiere CP y otra que tolera AP.',
      concept: 'CP vs AP systems',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta la elección de líder (replicación, ch5) con el problema de consenso (ch9)? ¿Por qué elegir un líder ES un problema de consenso?',
      concept: 'Leader election as consensus',
    },
    {
      type: 'why',
      question:
        '¿Por qué Raft fue diseñado cuando ya existía Paxos? ¿Qué ventaja práctica tiene Raft sobre Paxos, y por qué la "understandability" importa en algoritmos distribuidos?',
      concept: 'Raft vs Paxos',
      hint: 'Un algoritmo que nadie entiende correctamente es un algoritmo que nadie implementa correctamente.',
    },
    {
      type: 'tradeoff',
      question:
        'Lamport timestamps dan un orden total consistente con causalidad. ¿Por qué no son suficientes para implementar un constraint de unicidad (como "este username no existe")?',
      concept: 'Lamport timestamps limitations',
    },
  ],

  'ddia-ch11': [
    {
      type: 'why',
      question:
        '¿Por qué Kafka usa un log append-only (log-based broker) en lugar del modelo tradicional de message queue donde los mensajes se borran al ser consumidos? ¿Qué capacidades fundamentales habilita el log que una cola tradicional no puede ofrecer?',
      concept: 'Log-based message brokers',
      hint: 'Piensa en qué pasa cuando necesitas re-procesar todos los eventos del último mes, o cuando un nuevo consumidor se une al sistema.',
    },
    {
      type: 'why',
      question:
        '¿Por qué la distinción entre event time y processing time es crítica en stream processing? Describe un escenario concreto donde ignorar esta diferencia produce resultados incorrectos.',
      concept: 'Event time vs processing time',
      hint: 'Un evento generado a las 23:59 puede llegar al sistema a las 00:05 del día siguiente. ¿A qué ventana pertenece?',
    },
    {
      type: 'tradeoff',
      question:
        'At-least-once delivery es más simple de implementar que exactly-once, pero puede duplicar efectos. ¿Cuándo es aceptable at-least-once sin idempotencia, y cuándo necesitas las garantías más fuertes de exactly-once (que realmente es effectively-once)?',
      concept: 'At-least-once vs exactly-once semantics',
      hint: 'Piensa en la diferencia entre incrementar un contador (no idempotente) vs escribir un valor con una key fija (idempotente).',
    },
    {
      type: 'tradeoff',
      question:
        'En un stream-stream join necesitas definir una ventana temporal. Una ventana pequeña pierde correlaciones legítimas; una ventana grande consume más memoria y aumenta la latencia. ¿Cómo decidirías el tamaño de ventana para un sistema de detección de fraude que correlaciona transacciones con logins?',
      concept: 'Stream joins y windowing',
    },
    {
      type: 'connection',
      question:
        'Kleppmann argumenta que batch processing (ch10) y stream processing son dos puntos en un espectro, no paradigmas opuestos. ¿Cómo el concepto de "derivar datos" unifica ambos? ¿Por qué una base de datos puede verse como el resultado de un stream de cambios?',
      concept: 'Stream processing y batch processing como espectro',
      hint: 'Piensa en un materialized view: es el resultado de aplicar un stream de cambios a un estado inicial.',
    },
    {
      type: 'design_decision',
      question:
        'CDC (Change Data Capture) y event sourcing ambos capturan cambios como secuencias de eventos. ¿Cuál es la diferencia fundamental en el nivel de abstracción de los eventos, y cuándo elegirías uno sobre el otro?',
      concept: 'CDC vs event sourcing',
      hint: 'CDC captura cambios a nivel de fila en la base de datos; event sourcing captura intenciones del dominio. ¿Quién define el esquema del evento?',
    },
    {
      type: 'error_detection',
      question:
        '"Kafka garantiza exactly-once delivery de mensajes de forma nativa." ¿Por qué esta afirmación es engañosa? ¿Qué se necesita realmente para lograr exactly-once end-to-end, más allá de lo que el broker ofrece?',
      concept: 'Exactly-once en Kafka',
      hint: 'El broker puede garantizar que un mensaje se escribe exactamente una vez en un topic. Pero ¿qué pasa con los side effects del consumidor (enviar un email, cobrar una tarjeta)?',
    },
  ],

  'tail-scale-paper': [
    {
      type: 'why',
      question:
        '¿Por qué Dean y Barroso argumentan que la tail latency (p99, p999) importa más que la latencia promedio en sistemas a escala de Google? ¿Qué tiene que ver el número de usuarios concurrentes con que la cola de la distribución domine la experiencia real?',
      concept: 'Tail latency a escala',
      hint: 'Si un usuario hace múltiples requests durante una sesión, la probabilidad de experimentar al menos un request lento crece rápidamente.',
    },
    {
      type: 'why',
      question:
        'Si un solo servidor tiene un p99 de 1% de requests lentos, ¿por qué un request que hace fan-out a 100 servidores en paralelo tiene ~63% de probabilidad de ser lento? Explica la matemática y la implicación arquitectónica.',
      concept: 'Fan-out y probabilidad de tail latency',
      hint: 'P(al menos uno lento) = 1 - P(todos rápidos) = 1 - (0.99)^100 ≈ 0.634.',
    },
    {
      type: 'tradeoff',
      question:
        'Hedged requests envían la misma petición a múltiples réplicas y usan la primera respuesta. Esto reduce la tail latency dramáticamente, pero ¿qué costo tiene para el sistema? ¿Cuándo el remedio es peor que la enfermedad?',
      concept: 'Hedged requests',
      hint: 'Cada hedged request es carga adicional. Si todos los clientes hacen hedging agresivo, ¿qué le pasa a la carga total del sistema?',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conectan los conceptos de este paper con lo que Kleppmann describe en DDIA ch1 sobre percentiles y tail latency amplification? ¿En qué se complementan ambas perspectivas?',
      concept: 'Conexión con DDIA ch1',
      hint: 'DDIA ch1 introduce el concepto teórico; este paper lo lleva a la práctica con técnicas concretas de mitigación.',
    },
    {
      type: 'design_decision',
      question:
        '¿Cuándo elegirías hedged requests vs tied requests? ¿Qué ventaja tienen los tied requests (donde los servidores se comunican entre sí para cancelar trabajo redundante) sobre los hedged requests simples?',
      concept: 'Hedged vs tied requests',
      hint: 'Los tied requests evitan trabajo duplicado porque el segundo servidor puede abortar si el primero ya respondió.',
    },
    {
      type: 'error_detection',
      question:
        '"Para reducir la latencia de un servicio distribuido, basta con optimizar cada componente individual hasta que todos tengan baja latencia." ¿Por qué esta estrategia es insuficiente según el paper?',
      concept: 'Optimización individual vs sistémica',
      hint: 'Incluso si cada componente tiene 99.9% de requests rápidos, el efecto multiplicativo del fan-out crea tail latency a nivel del sistema completo.',
    },
  ],

  'attention-paper': [
    {
      type: 'why',
      question:
        '¿Por qué el mecanismo de attention permite reemplazar la recurrencia (RNNs/LSTMs) como forma de capturar dependencias entre tokens? ¿Qué dos ventajas fundamentales ofrece attention sobre las arquitecturas recurrentes?',
      concept: 'Attention reemplaza recurrencia',
      hint: 'Piensa en paralelización durante el entrenamiento y en la longitud del camino entre tokens distantes.',
    },
    {
      type: 'why',
      question:
        'En scaled dot-product attention, se divide por √d_k antes del softmax. ¿Por qué? ¿Qué pasa con los gradientes si no escalas cuando d_k es grande (ej. 512)?',
      concept: 'Scaling factor 1/√d_k',
      hint: 'El dot product de dos vectores aleatorios tiene varianza proporcional a d_k. Si la varianza es alta, el softmax satura y los gradientes desaparecen.',
    },
    {
      type: 'tradeoff',
      question:
        'Multi-head attention usa h cabezas con dimensiones reducidas (d_k = d_model/h) en lugar de una sola cabeza con la dimensión completa. ¿Qué se gana y qué se pierde? ¿Por qué h=8 y no h=1 o h=64?',
      concept: 'Número de attention heads',
      hint: 'Cada cabeza puede aprender diferentes patrones (sintáctico, semántico, posicional). Pero con demasiadas cabezas, cada una tiene muy poca dimensión para representar algo útil.',
    },
    {
      type: 'tradeoff',
      question:
        'El paper usa positional encoding sinusoidal en lugar de embeddings posicionales aprendidos. Los resultados fueron similares. ¿Qué ventaja teórica tiene el encoding sinusoidal para secuencias más largas que las vistas en entrenamiento?',
      concept: 'Sinusoidal vs learned positional encoding',
      hint: 'Las funciones sinusoidales son periódicas y permiten extrapolación. ¿Puede un embedding aprendido generalizar a posiciones que nunca vio?',
    },
    {
      type: 'connection',
      question:
        '¿Cómo la arquitectura Transformer habilitó las scaling laws descubiertas posteriormente? ¿Qué propiedades específicas del Transformer (vs RNN/LSTM) lo hacen escalable a miles de millones de parámetros?',
      concept: 'Transformers y scaling laws',
      hint: 'Piensa en paralelismo, en cómo se distribuye el cómputo, y en qué pasa cuando duplicas el tamaño de un RNN vs un Transformer.',
    },
    {
      type: 'design_decision',
      question:
        'El paper original usa una arquitectura encoder-decoder. GPT usa solo decoder. BERT usa solo encoder. ¿Qué tarea determina qué arquitectura necesitas, y por qué un decoder-only terminó dominando para generación de texto?',
      concept: 'Encoder-decoder vs decoder-only',
      hint: 'El encoder procesa toda la entrada bidireccionalmente; el decoder genera autogresivamente. ¿Qué necesitas para traducción vs para generación libre?',
    },
    {
      type: 'error_detection',
      question:
        '"Los Transformers entienden el orden de las palabras a través del mecanismo de attention, que naturalmente captura las posiciones relativas de los tokens." ¿Por qué es incorrecto?',
      concept: 'Attention y orden posicional',
      hint: 'Attention es una operación sobre conjuntos (set operation), no sobre secuencias. Sin positional encoding, "el gato come pescado" y "pescado come el gato" producirían la misma representación.',
    },
  ],

  'scaling-laws-paper': [
    {
      type: 'why',
      question:
        '¿Por qué la loss de los language models sigue power laws (L ∝ N^{-α}) a lo largo de 7 órdenes de magnitud de escala? ¿Qué sugiere esta regularidad sobre la naturaleza del aprendizaje de lenguaje, y por qué no es obvio que debería ser tan predecible?',
      concept: 'Power laws en scaling',
      hint: 'Muchos fenómenos complejos no escalan de forma predecible. Que la loss siga una ley de potencias sugiere algo fundamental sobre la estructura del lenguaje natural.',
    },
    {
      type: 'why',
      question:
        '¿Por qué los modelos más grandes son más sample-efficient (necesitan menos datos para alcanzar la misma loss)? ¿Qué implica esto para la estrategia óptima de entrenamiento cuando tienes un presupuesto fijo de compute?',
      concept: 'Sample efficiency de modelos grandes',
      hint: 'Si un modelo grande aprende más por cada token que ve, ¿tiene sentido entrenar un modelo pequeño con muchos datos o un modelo grande con menos datos?',
    },
    {
      type: 'tradeoff',
      question:
        'Kaplan et al. sugieren invertir más compute en modelos más grandes (entrenados con menos tokens). Chinchilla (Hoffmann et al.) demostró que la asignación óptima es más balanceada entre tamaño y datos. ¿Qué implicaciones prácticas tiene cada estrategia, y por qué Chinchilla cambió la industria?',
      concept: 'Kaplan vs Chinchilla compute allocation',
      hint: 'Chinchilla 70B superó a Gopher 280B con 4x menos parámetros pero 4x más datos de entrenamiento.',
    },
    {
      type: 'connection',
      question:
        '¿Por qué las scaling laws funcionan específicamente con la arquitectura Transformer? ¿Qué propiedades del Transformer (paralelismo, attention como operación diferenciable sobre toda la secuencia) son prerrequisito para que escalar compute se traduzca predeciblemente en mejor performance?',
      concept: 'Scaling laws y arquitectura Transformer',
      hint: 'Las RNNs no escalan igual. ¿Qué bottleneck tienen las RNNs que los Transformers no?',
    },
    {
      type: 'design_decision',
      question:
        'Las scaling laws muestran que entrenar un modelo grande hasta convergencia no es compute-optimal. ¿Cuándo tiene sentido parar el entrenamiento early (antes de convergencia) y usar ese compute para un modelo más grande? ¿Cómo cambiaría tu decisión si el costo de inferencia domina sobre el de entrenamiento?',
      concept: 'Early stopping vs convergencia',
      hint: 'Un modelo más grande es más caro de servir. Si vas a hacer billones de inferencias, el costo de entrenamiento es negligible comparado con el de inferencia.',
    },
    {
      type: 'error_detection',
      question:
        '"La arquitectura del modelo (profundidad vs anchura, tipo de attention, etc.) es tan importante como la escala total de parámetros para determinar la performance." ¿Por qué los resultados del paper contradicen esta intuición?',
      concept: 'Arquitectura vs escala',
      hint: 'El paper muestra que la loss depende principalmente del número total de parámetros N, no de cómo están distribuidos entre capas. Dos modelos con el mismo N pero diferente profundidad/anchura tienen loss similar.',
    },
  ],

  'p0-linear-algebra': [
    {
      type: 'why',
      question:
        '¿Por qué los eigenvalues de una matriz de covarianza representan la varianza capturada en cada dirección principal? Conecta la definición algebraica (Av = λv) con la interpretación geométrica de "estirar" el espacio.',
      concept: 'Eigenvalues y su significado geométrico',
      hint: 'Si v es un eigenvector, la transformación A solo escala v por λ. En una matriz de covarianza, eso significa que λ mide cuánta varianza hay en la dirección de v.',
    },
    {
      type: 'why',
      question:
        '¿Por qué la hipótesis del manifold es fundamental para justificar que deep learning funcione en espacios de alta dimensión? Si los datos de imágenes viven en R^(784) (MNIST), ¿por qué no necesitamos exponencialmente más datos para cubrir ese espacio?',
      concept: 'Hipótesis del manifold',
      hint: 'Los datos reales no llenan uniformemente el espacio de alta dimensión — se concentran en subvariedades de dimensión mucho menor.',
    },
    {
      type: 'tradeoff',
      question:
        'SVD funciona para cualquier matriz (m×n), mientras que la eigendecomposición solo aplica a matrices cuadradas. Sin embargo, para matrices simétricas positivas semidefinidas ambas coinciden. ¿Cuándo elegirías SVD sobre eigendecomposición y qué costo computacional adicional tiene?',
      concept: 'SVD vs eigendecomposición',
      hint: 'SVD es O(mn²) para m≥n. Eigendecomposición es O(n³). Pero SVD te da información sobre las direcciones tanto de entrada como de salida.',
    },
    {
      type: 'tradeoff',
      question:
        'La norma L1 induce sparsity en regularización mientras que L2 distribuye los pesos uniformemente. ¿Por qué geométricamente L1 produce ceros exactos? Dibuja mentalmente las curvas de nivel de cada norma y piensa en dónde intersectan con las elipses de la loss.',
      concept: 'Normas en regularización',
      hint: 'Las curvas de nivel de L1 son diamantes con esquinas en los ejes. La intersección con una elipse tiene alta probabilidad de ocurrir en una esquina (coordenada = 0).',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta la similitud coseno (usada masivamente en embeddings y RAG) con el producto punto y la proyección ortogonal? ¿Por qué normalizar los vectores antes de calcular el producto punto es equivalente a calcular el coseno del ángulo entre ellos?',
      concept: 'Similitud coseno y producto punto',
    },
    {
      type: 'error_detection',
      question:
        '"PCA siempre preserva la estructura más importante de los datos porque maximiza la varianza explicada." ¿En qué escenario esta afirmación es engañosa? Piensa en un dataset donde la varianza máxima no corresponde a la señal discriminativa.',
      concept: 'Limitaciones de PCA',
      hint: 'Si dos clases están separadas en una dirección de baja varianza, PCA podría descartar exactamente la dimensión que las distingue.',
    },
  ],

  'p0-calculus-optimization': [
    {
      type: 'why',
      question:
        '¿Por qué la chain rule es el principio matemático que hace posible entrenar redes neuronales profundas? Si tienes L = f(g(h(x))), ¿cómo permite la chain rule calcular ∂L/∂x sin necesidad de derivar la composición completa de una vez?',
      concept: 'Chain rule en backpropagation',
      hint: 'La chain rule descompone la derivada de una composición en un producto de derivadas locales: ∂L/∂x = (∂L/∂f)(∂f/∂g)(∂g/∂h)(∂h/∂x). Cada factor se calcula localmente.',
    },
    {
      type: 'why',
      question:
        '¿Por qué los gradientes se desvanecen (vanishing) en redes profundas con activaciones sigmoideas? Calcula mentalmente el rango de σ\'(x) y explica qué pasa cuando multiplicas 50 factores menores a 0.25.',
      concept: 'Vanishing gradients',
      hint: 'La derivada máxima de sigmoid es 0.25 (en x=0). Si multiplicas 0.25^50, obtienes un número astronómicamente pequeño.',
    },
    {
      type: 'tradeoff',
      question:
        'Adam combina momentum y learning rates adaptativos por parámetro. SGD puro es más simple y a menudo generaliza mejor en la práctica. ¿Cuándo preferirías SGD con momentum sobre Adam, y qué evidencia empírica respalda que SGD puede encontrar mínimos "más planos"?',
      concept: 'Adam vs SGD',
      hint: 'Varios papers muestran que Adam converge más rápido pero SGD con schedule apropiado generaliza mejor. Los mínimos planos se correlacionan con mejor generalización.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conecta el concepto de grafo computacional (DAG de operaciones) con la eficiencia de backpropagation? ¿Por qué calcular gradientes "hacia atrás" es O(n) mientras que la diferenciación numérica sería O(n²)?',
      concept: 'Grafos computacionales y autodiff',
      hint: 'En el forward pass guardas los valores intermedios. En el backward pass, cada nodo calcula su gradiente local una sola vez y lo propaga.',
    },
    {
      type: 'error_detection',
      question:
        '"Si la función de loss es convexa, gradient descent siempre encuentra el mínimo global, por lo tanto deberíamos diseñar funciones de loss convexas para redes neuronales." ¿Qué está mal con este razonamiento?',
      concept: 'Convexidad y optimización en deep learning',
      hint: 'La loss como función de los parámetros de una red neuronal es altamente no-convexa. No puedes hacer convexa la loss respecto a los pesos sin perder la expresividad de la red.',
    },
    {
      type: 'design_decision',
      question:
        '¿Por qué el learning rate warmup (empezar con lr bajo y subir gradualmente) mejora el entrenamiento de Transformers? ¿Qué tiene que ver con las estadísticas del optimizador Adam en los primeros pasos?',
      concept: 'Learning rate warmup',
      hint: 'En los primeros pasos, las estimaciones del segundo momento de Adam son inestables (bias alto). Un lr alto amplifica esta inestabilidad.',
    },
  ],

  'p0-probability': [
    {
      type: 'why',
      question:
        '¿Por qué minimizar cross-entropy como función de loss es equivalente a maximizar la verosimilitud (MLE) del modelo? Demuestra la conexión algebraica entre -Σ p(x) log q(x) y log-likelihood.',
      concept: 'Cross-entropy como loss',
      hint: 'Si p es la distribución empírica (one-hot para clasificación), -Σ p log q = -log q(clase_correcta), que es exactamente el negative log-likelihood.',
    },
    {
      type: 'why',
      question:
        '¿Por qué la KL divergence es asimétrica, es decir, KL(p||q) ≠ KL(q||p)? ¿Qué implicación práctica tiene esto cuando eliges cuál distribución es p y cuál es q en un modelo generativo?',
      concept: 'Asimetría de KL divergence',
      hint: 'KL(p||q) penaliza fuertemente cuando q es cercana a 0 pero p no (mode-seeking). KL(q||p) penaliza cuando p es cercana a 0 pero q no (mode-covering).',
    },
    {
      type: 'tradeoff',
      question:
        'MLE es el estimador más eficiente asintóticamente pero puede overfittear con pocos datos. MAP agrega un prior que regulariza. ¿Cuándo el sesgo introducido por el prior en MAP es preferible a la varianza alta de MLE?',
      concept: 'MLE vs MAP',
      hint: 'Con muchos datos, el prior se vuelve irrelevante y MAP ≈ MLE. Con pocos datos, el prior estabiliza la estimación. Es el clásico trade-off sesgo-varianza.',
    },
    {
      type: 'tradeoff',
      question:
        'El enfoque bayesiano completo marginaliza sobre todos los parámetros posibles, mientras que el frequentista estima un solo valor puntual. ¿Por qué en la práctica los modelos de deep learning usan estimación puntual (SGD) en lugar de inferencia bayesiana completa?',
      concept: 'Bayesiano vs frequentista en la práctica',
      hint: 'La marginalización requiere integrar sobre millones de dimensiones de parámetros. Las aproximaciones (variational inference, MCMC) son costosas y difíciles de escalar.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se conectan la entropía H(X) = -Σ p log p con la cantidad de "sorpresa" o "información" de una distribución? ¿Por qué una distribución uniforme tiene entropía máxima y una distribución degenerada (toda la masa en un punto) tiene entropía cero?',
      concept: 'Entropía como medida de incertidumbre',
    },
    {
      type: 'error_detection',
      question:
        '"Los conjugate priors se usan porque producen mejores resultados que otros priors." ¿Qué está mal con esta justificación? ¿Cuál es la verdadera razón por la que se usan conjugate priors?',
      concept: 'Conjugate priors',
      hint: 'La ventaja es puramente computacional: el posterior pertenece a la misma familia que el prior, así que tiene forma cerrada. No dice nada sobre la calidad del prior.',
    },
    {
      type: 'design_decision',
      question:
        '¿Por qué el ELBO (Evidence Lower Bound) es central en variational inference? Si queremos maximizar log p(x) pero es intratable, ¿cómo nos ayuda optimizar una cota inferior, y qué gap introduce la distribución variacional q(z|x)?',
      concept: 'ELBO en variational inference',
      hint: 'log p(x) = ELBO + KL(q(z|x) || p(z|x)). Como KL ≥ 0, ELBO ≤ log p(x). Maximizar ELBO simultáneamente maximiza la evidence y minimiza la KL entre q y el posterior verdadero.',
    },
  ],

  'p0-cs229-probability': [
    {
      type: 'why',
      question:
        '¿Por qué el MLE para una Gaussiana resulta exactamente en la media muestral? Deriva la conexión entre maximizar la likelihood y minimizar la suma de cuadrados.',
      concept: 'MLE y MSE',
      hint: 'El log-likelihood de N(μ, σ²) contiene el término -Σ(xᵢ - μ)²/(2σ²). Maximizar respecto a μ equivale a minimizar Σ(xᵢ - μ)².',
    },
    {
      type: 'why',
      question:
        '¿Por qué weight decay en deep learning es matemáticamente equivalente a MAP con un prior Gaussiano? Muestra la equivalencia entre el término de regularización λ||θ||² y el log-prior.',
      concept: 'Regularización como MAP',
      hint: 'Si θ ~ N(0, τ²I), log P(θ) = -||θ||²/(2τ²) + const. Sumando al log-likelihood, λ = 1/(2τ²).',
    },
    {
      type: 'tradeoff',
      question:
        'MLE puede overfittear con pocos datos pero es asintóticamente óptimo. MAP introduce sesgo del prior pero regulariza. ¿Cuándo preferirías MLE puro (sin regularización) y cuándo MAP?',
      concept: 'MLE vs MAP',
      hint: 'Con n >> d (muchos datos vs parámetros), el prior importa poco. Con n ≈ d o n < d, el prior estabiliza la estimación.',
    },
    {
      type: 'tradeoff',
      question:
        'La KL divergence es asimétrica: D_KL(p||q) ≠ D_KL(q||p). Forward KL produce mode-covering, reverse KL produce mode-seeking. ¿Qué implicaciones tiene para VAEs que usen reverse KL?',
      concept: 'Forward vs Reverse KL',
      hint: 'Los VAEs minimizan reverse KL en la ELBO. Esto hace que q(z|x) colapse sobre un modo del posterior, produciendo outputs borrosos.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo conecta la cross-entropy loss con MLE y con KL divergence? Demuestra que minimizar cross-entropy = maximizar likelihood = minimizar KL(p_data || p_model).',
      concept: 'Cross-entropy, MLE y KL',
    },
    {
      type: 'design_decision',
      question:
        'Un modelo de clasificación binaria usa sigmoid + BCE loss. Un modelo de regresión usa MSE. ¿Qué distribución asume cada uno implícitamente, y qué pasaría si usaras MSE para clasificación binaria?',
      concept: 'Distribución implícita en loss functions',
      hint: 'MSE asume ruido Gaussiano. Para clasificación, los targets son 0/1 — no tiene sentido asumir ruido Gaussiano simétrico alrededor de la predicción.',
    },
  ],

  'openclaw-casestudy': [
    {
      type: 'why',
      question:
        '¿Por qué OpenClaw diseñó un protocolo propio (ACP) con NDJSON streams en lugar de usar REST estándar para la comunicación agente-gateway? ¿Qué limitaciones de REST harían inviable el flujo de un agente conversacional?',
      concept: 'Agent Communication Protocol',
      hint: 'Pensá en qué pasa cuando un agente necesita enviar tool calls, actualizaciones de estado, y texto parcial en una misma interacción — todo de forma incremental.',
    },
    {
      type: 'tradeoff',
      question:
        'OpenClaw usa una abstracción ChannelDock para normalizar 15+ plataformas de chat. ¿Qué se pierde al abstraer las diferencias entre Discord (threads, polls, reactions) y Signal (mensajes planos)? ¿Cuándo esta abstracción se convierte en una limitación?',
      concept: 'Plugin & Channel Architecture',
      hint: 'Cada plataforma tiene features únicos. Una abstracción demasiado fina pierde features; una demasiado gruesa se vuelve inmanejable.',
    },
    {
      type: 'design_decision',
      question:
        '¿Por qué OpenClaw eligió una arquitectura de skills basada en CLIs externos (1Password CLI, gh CLI) en vez de implementar integraciones nativas dentro del sistema? ¿Qué implicaciones tiene esto para la seguridad y el mantenimiento?',
      concept: 'Agent Skill Orchestration',
      hint: 'Considerá qué pasa cuando el CLI externo se actualiza, cambia su API, o requiere autenticación diferente.',
    },
    {
      type: 'connection',
      question:
        '¿Cómo se compara el sistema de memoria de OpenClaw (memory-core + memory-lancedb con autoCapture/autoRecall) con el enfoque de MemGPT que estudiaste en Fase 5? ¿Qué problema resuelve cada uno de forma diferente?',
      concept: 'Agent Memory Persistence',
    },
    {
      type: 'tradeoff',
      question:
        'A2UI prohíbe que los agentes envíen código ejecutable — solo JSON declarativo mapeado a un catálogo de componentes pre-aprobados. ¿Qué capacidades de UI se pierden con esta restricción? ¿Cuándo vale la pena ese trade-off?',
      concept: 'Agent UI Generation (A2UI)',
      hint: 'Pensá en un agente que necesita crear una visualización completamente nueva que no existe en el catálogo.',
    },
    {
      type: 'error_detection',
      question:
        '"OpenClaw es superior a LangChain porque tiene más funcionalidad (15+ canales, skills, UI generation, voice) mientras que LangChain solo hace chains y agents." ¿Qué está mal con esta comparación?',
      concept: 'Framework Trade-offs',
      hint: 'Son sistemas con propósitos fundamentalmente diferentes. Uno es un framework de desarrollo, el otro es un producto de usuario final.',
    },
    {
      type: 'design_decision',
      question:
        'OpenClaw implementa daemons multiplataforma (launchd en macOS, systemd en Linux, Scheduled Tasks en Windows). ¿Por qué no simplificar usando Docker como capa de abstracción universal? ¿Qué ganan y qué pierden con el enfoque nativo?',
      concept: 'Production Architectures',
      hint: 'Pensá en los requisitos de OpenClaw: acceso a cámara, micrófono, iMessage, Bluetooth — cosas que Docker no puede hacer.',
    },
  ],
};

export const QUESTION_TYPE_LABELS: Record<ReadingQuestion['type'], string> = {
  tradeoff: 'Trade-off',
  why: 'Por qué',
  connection: 'Conexión',
  error_detection: 'Detección de error',
  design_decision: 'Decisión de diseño',
};

export const QUESTION_TYPE_COLORS: Record<ReadingQuestion['type'], string> = {
  tradeoff: 'text-[#8b6914] bg-[#8b6914]/8',
  why: 'text-[#4a5d4a] bg-[#4a5d4a]/8',
  connection: 'text-[#5a6b8a] bg-[#5a6b8a]/8',
  error_detection: 'text-[#8b4a4a] bg-[#8b4a4a]/8',
  design_decision: 'text-[#6b5a8a] bg-[#6b5a8a]/8',
};
