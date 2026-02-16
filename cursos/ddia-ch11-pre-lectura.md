# DDIA Capítulo 11: Stream Processing
## Sesion Pre-Lectura — Preparacion Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el capitulo en ingles.
**Metodo:** Explicacion progresiva con preguntas y respuestas.

---

## Concepto 1: El Cambio de Paradigma — De Batch a Streams

En el capitulo 10 vimos batch processing: acumulas datos, los procesas en bloque (MapReduce). Pero hay un problema fundamental: **latencia**. Si tus datos llegan continuamente, esperar horas para procesarlos no tiene sentido.

**Analogia:**
- **Batch** = recibir el correo una vez al dia. Acumulas cartas, las abres todas juntas.
- **Stream** = recibir notificaciones en tu telefono. Cada mensaje llega y lo procesas en el momento.

| | **Batch Processing** | **Stream Processing** |
|---|---|---|
| Latencia | Minutos a horas | Milisegundos a segundos |
| Input | Dataset finito (bounded) | Flujo infinito (unbounded) |
| Ejecucion | Corre, termina, produce output | Corre continuamente |
| Ejemplo | MapReduce, Spark batch | Kafka Streams, Flink, Storm |
| Tolerancia a fallos | Re-ejecutar el job completo | Checkpoints, microbatch |

> **El capitulo 11 responde: ¿como procesamos datos que nunca dejan de llegar?**

Un "evento" es un registro pequeno e inmutable: algo que ocurrio en un momento dado. Un click, una transaccion, un cambio de temperatura. Stream processing es procesar estos eventos conforme llegan.

---

## Concepto 2: Sistemas de Mensajeria — Como Transmitir Eventos

El problema central: un **productor** genera eventos y uno o mas **consumidores** necesitan recibirlos. ¿Como conectarlos?

### Mensajeria directa

El productor envia directamente al consumidor (UDP multicast, HTTP webhooks, ZeroMQ). Simple pero fragil: si el consumidor se cae, se pierden mensajes.

### Message brokers (colas de mensajes)

Un intermediario que desacopla productor y consumidor:

```
Productor A ──┐                    ┌── Consumidor X
              │    ┌───────────┐   │
Productor B ──┼───►│  BROKER   │───┼── Consumidor Y
              │    └───────────┘   │
Productor C ──┘                    └── Consumidor Z
```

El broker almacena mensajes temporalmente. Si un consumidor se cae, los mensajes esperan. Esto da **durabilidad** y **desacoplamiento**.

### Dos patrones de entrega

| | **Load balancing** | **Fan-out** |
|---|---|---|
| Comportamiento | Cada mensaje va a UN consumidor | Cada mensaje va a TODOS |
| Caso de uso | Distribuir trabajo entre workers | Notificar a multiples sistemas |
| Analogia | Cola del banco: siguiente disponible | Radio: todos escuchan lo mismo |

**RabbitMQ** y brokers tradicionales siguen el modelo de cola: entregan un mensaje, el consumidor hace acknowledge, y el broker lo borra. Una vez procesado, desaparece.

---

## Concepto 3: Log-Based Message Brokers — La Idea de Kafka

¿Y si combinamos la durabilidad de una base de datos con la notificacion en tiempo real de un message broker? Esa es la idea central de **Apache Kafka**.

En vez de borrar mensajes despues de entregarlos, Kafka los escribe en un **log append-only** en disco, particionado y replicado.

```
                        KAFKA TOPIC: "pedidos"

  Particion 0:  [msg0][msg1][msg2][msg3][msg4][msg5]  ──►
                                                offset

  Particion 1:  [msg0][msg1][msg2][msg3]  ──►
                                     offset

  Particion 2:  [msg0][msg1][msg2][msg3][msg4]  ──►
                                            offset

  ┌───────────────────────────────────────────────────┐
  │  Cada particion es un log append-only independiente │
  │  Los mensajes se asignan a particion por key        │
  │  Dentro de cada particion: orden garantizado        │
  └───────────────────────────────────────────────────┘
```

### Consumer offsets

Cada consumidor mantiene un **offset**: la posicion hasta donde ha leido. Si se cae y reinicia, continua desde su ultimo offset. No necesita re-procesar todo.

```
Particion 0:  [0][1][2][3][4][5][6][7][8]
                            ▲           ▲
                            │           │
                   Consumidor A    Consumidor B
                   (offset: 4)     (offset: 8)

  A esta atrasado pero no pierde datos — los mensajes siguen ahi.
  B esta al dia, leyendo en tiempo real.
```

### Kafka vs RabbitMQ

| | **Kafka** | **RabbitMQ** |
|---|---|---|
| Modelo | Log particionado | Cola de mensajes |
| Persistencia | Mensajes se retienen (dias/semanas) | Se borran tras acknowledge |
| Replay | Si — releer desde cualquier offset | No — una vez entregado, desaparece |
| Orden | Garantizado dentro de particion | No garantizado con multiples consumers |
| Throughput | Muy alto (escritura secuencial en disco) | Menor (overhead por mensaje) |
| Caso ideal | Event streaming, CDC, analytics | Task queues, RPC async |

> **Insight clave:** Kafka trata los mensajes como un log de base de datos. Por eso puede hacer replay — es como un WAL que los consumidores leen.

---

## Concepto 4: Bases de Datos y Streams — CDC y Event Sourcing

Aqui Kleppmann hace una observacion profunda: **una base de datos es en realidad un stream de cambios acumulados**. Cada INSERT, UPDATE y DELETE es un evento. El estado actual de la DB es simplemente el resultado de aplicar todos esos eventos en orden.

### Change Data Capture (CDC)

CDC es capturar cada cambio en la base de datos y publicarlo como un evento en un stream:

```
  ┌──────────┐      CDC        ┌──────────┐      Consumidores
  │PostgreSQL│───────────────►  │  Kafka   │──┬──► Search index (Elastic)
  │          │  (lee el WAL)    │  topic   │  │
  │  UPDATE  │                  │          │  ├──► Cache (Redis)
  │  INSERT  │                  │          │  │
  │  DELETE  │                  │          │  └──► Data warehouse
  └──────────┘                  └──────────┘

  La DB sigue siendo la "fuente de verdad".
  Los demas sistemas son vistas derivadas que se mantienen sincronizadas.
```

**Herramientas comunes:** Debezium (para PostgreSQL/MySQL), Maxwell, Kafka Connect.

CDC resuelve el problema de tener multiples sistemas (search, cache, analytics) sincronizados con la base de datos principal sin acoplarlos directamente.

### Event Sourcing

Similar a CDC pero con una filosofia diferente: en vez de guardar el estado actual, **guardas cada evento que ocurrio** y derivas el estado a partir de ellos.

| | **CDC** | **Event Sourcing** |
|---|---|---|
| Fuente | Base de datos relacional | Log de eventos de dominio |
| Nivel | Bajo nivel (filas, columnas) | Alto nivel (eventos de negocio) |
| Ejemplo | `UPDATE users SET name='X' WHERE id=1` | `UserChangedName { id:1, new:'X' }` |
| Intencion | No captura el "por que" | Captura la intencion del cambio |

### Log Compaction

Problema: si guardas todos los eventos para siempre, el log crece infinitamente. **Log compaction** mantiene solo el ultimo valor para cada key, descartando versiones anteriores:

```
ANTES de compaction:
  [user:1, name=Ana] [user:2, name=Luis] [user:1, name=Andrea] [user:2, delete]

DESPUES de compaction:
  [user:1, name=Andrea] [user:2, tombstone]

  Solo se mantiene el ultimo estado de cada key.
```

Esto permite que un nuevo consumidor lea el log compactado y reconstruya el estado completo sin procesar millones de eventos historicos.

---

## Concepto 5: Procesamiento de Streams — Que Hacer Con Los Eventos

Una vez que tienes un flujo de eventos, ¿que haces con ellos? Hay varios patrones:

1. **Complex Event Processing (CEP):** Buscar patrones en secuencias de eventos. "Si un usuario hace login desde 3 paises en 1 hora, generar alerta de fraude."

2. **Stream analytics:** Calcular metricas agregadas en tiempo real. Tasa de errores por minuto, promedio movil de latencia, conteo de usuarios activos.

3. **Materialized views:** Mantener vistas pre-computadas que se actualizan con cada evento. Como un cache que nunca esta desactualizado.

4. **Search on streams:** Buscar eventos que coincidan con criterios persistentes (queries almacenados). Al reves de una busqueda normal: los datos se mueven, la query es fija.

5. **Message passing / actors:** Comunicacion entre microservicios. Cada actor procesa mensajes de su cola.

---

## Concepto 6: El Problema del Tiempo y los Stream Joins

### Event time vs Processing time

Uno de los problemas mas sutiles en stream processing. Un evento ocurre a las 14:00:00 pero llega al sistema a las 14:00:35 por retrasos de red. ¿Que hora usamos?

```
Timeline real:

  14:00:00   14:00:15   14:00:30   14:00:35
     │          │          │          │
  Evento     Viaja por   Llega al   Se procesa
  ocurre     la red      broker

  Event time = 14:00:00  (cuando ocurrio)
  Processing time = 14:00:35  (cuando se proceso)
```

| | **Event time** | **Processing time** |
|---|---|---|
| Definicion | Cuando ocurrio el evento | Cuando lo procesa el sistema |
| Precision | Refleja la realidad | Refleja el sistema |
| Problema | Eventos pueden llegar desordenados | No representa la realidad |
| Uso | Metricas de negocio, analytics | Monitoreo del sistema mismo |

### Ventanas (Windows)

Para agregar datos en un stream infinito, necesitas "cortar" el tiempo en ventanas:

```
Tumbling window (fija, sin overlap):
  |----W1----|----W2----|----W3----|
  0          60         120        180  (segundos)

Hopping window (fija, con overlap):
  |----W1---------|
       |----W2---------|
            |----W3---------|

Sliding window (basada en diferencia entre eventos):
  Incluye todos los eventos dentro de un intervalo relativo.

Session window (basada en actividad):
  |--sesion 1--|     gap     |--sesion 2--|
  Agrupa eventos cercanos; un gap largo cierra la sesion.
```

### Stragglers (eventos rezagados)

¿Que haces con un evento que llega tarde, despues de que ya cerraste la ventana? Opciones: descartarlo, actualizar el resultado anterior, o usar **watermarks** — un mecanismo para declarar "ya no espero mas eventos antes de este timestamp".

### Stream Joins

Tres tipos de joins en streams, cada uno con complejidad creciente:

```
1) STREAM-STREAM JOIN
   Dos streams de eventos. Correlacionar eventos por key en una ventana de tiempo.
   Ej: join entre "click en anuncio" y "compra" dentro de 1 hora.

   Stream A:  ──[click user:7]──────────────────────►
   Stream B:  ────────────[compra user:7]───────────►
                   └──── match en ventana de 1h ────┘

2) STREAM-TABLE JOIN (enrichment)
   Evento del stream + lookup en una tabla para enriquecer.
   Ej: evento de pedido + datos del usuario desde la tabla users.

   Stream:  ──[pedido user:7]──►  JOIN  ──[pedido user:7, nombre:"Ana"]──►
                                   ▲
   Tabla:   users {7: "Ana"}  ─────┘

3) TABLE-TABLE JOIN
   Dos tablas mantenidas por CDC. El resultado es una vista materializada
   que se actualiza cuando cualquiera de las dos tablas cambia.
   Ej: timeline de Twitter = join entre tweets y follows.
```

> **Regla practica:** Cuantos mas streams participan en un join, mas estado hay que mantener en memoria, y mas complejo es manejar el orden y los fallos.

---

## Concepto 7: Tolerancia a Fallos en Streams

En batch, si un job falla, lo re-ejecutas completo. En streams, que corren continuamente, necesitas estrategias mas finas.

### Microbatching

Tratar el stream como una serie de "mini-batches" muy pequenos (ej: cada 1 segundo). Cada mini-batch se procesa como un batch normal. Si falla, se re-ejecuta solo ese mini-batch.

**Spark Streaming** usa este enfoque. Trade-off: la latencia minima esta limitada por el tamano del batch.

### Checkpointing

Guardar periodicamente el estado del operador a un almacenamiento durable. Si falla, se restaura desde el ultimo checkpoint y se re-procesan solo los eventos posteriores.

**Apache Flink** usa checkpointing con el algoritmo de Chandy-Lamport (snapshots distribuidos).

### Idempotent writes

Disenar las escrituras de modo que aplicarlas multiples veces tenga el mismo efecto que aplicarlas una vez. Asi, si un evento se re-procesa por un fallo, no causa duplicados.

```
NO idempotente:   counter += 1   (re-ejecutar = contar doble)
SI idempotente:   SET value = 42  (re-ejecutar = mismo resultado)
SI idempotente:   INSERT ... ON CONFLICT DO NOTHING
```

### Exactly-once semantics

La meta ideal: cada evento se procesa exactamente una vez, sin perdidas ni duplicados. En la practica es muy dificil. Se logra combinando:

1. **Checkpointing** (para saber donde estabamos)
2. **Transacciones atomicas** (para que output + offset se graben juntos)
3. **Idempotencia** (para que re-procesar sea seguro)

> **Realidad:** "Exactly-once" suele significar "effectively-once" — el sistema puede internamente re-procesar, pero el efecto visible es como si fuera exactamente una vez.

---

## Concepto 8: Unificacion de Batch y Stream

Kleppmann cierra el capitulo sugiriendo que batch y stream processing no son enemigos sino complementarios. Lambda architecture propone correr ambos en paralelo, pero genera complejidad. Frameworks modernos como **Apache Flink** y **Kafka Streams** buscan unificar ambos modelos, tratando batch como un caso especial de stream (un stream finito).

> **La tendencia:** Todo es un stream. Batch es simplemente un stream con principio y fin.

---

## Resumen Visual

```
                     Stream Processing
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     Transmision      Procesamiento    Tolerancia
          │                │             a fallos
     ┌────┴────┐     ┌────┴────┐          │
     │         │     │         │     ┌────┴────┐
  Directo   Brokers CEP    Joins    │         │
     │         │  Analytics  │   Microbatch Checkpoint
     │    ┌────┴────┐    ┌───┴───┐         │
     │    │         │    │   │   │    Idempotencia
     │  RabbitMQ  Kafka  S-S S-T T-T       │
     │  (cola)   (log)              Exactly-once
     │              │
     │         ┌────┴────┐
     │         │         │
     │       CDC    Event Sourcing
     │         │
     │    Log Compaction
     │
  Tiempo: event time vs processing time
           ventanas, stragglers
```

---

## Terminos Clave para el Capitulo (Ingles → Espanol)

| Ingles | Espanol | Que es |
|--------|---------|--------|
| Stream processing | Procesamiento de flujos | Procesar datos continuos conforme llegan |
| Event | Evento | Registro inmutable de algo que ocurrio |
| Message broker | Intermediario de mensajes | Sistema que desacopla productores y consumidores |
| Log-based broker | Broker basado en log | Broker que persiste mensajes en un log (Kafka) |
| Partition | Particion | Subdivision de un topic para paralelismo |
| Consumer offset | Offset del consumidor | Posicion de lectura de un consumidor en el log |
| Change Data Capture | Captura de cambios de datos | Publicar cambios de la DB como eventos |
| Event sourcing | Event sourcing | Almacenar eventos en vez de estado actual |
| Log compaction | Compactacion de log | Retener solo el ultimo valor por key |
| Tumbling window | Ventana fija | Ventana de tiempo sin solapamiento |
| Watermark | Marca de agua | Declaracion de que no llegaran mas eventos antiguos |
| Stream join | Join de flujos | Correlacionar eventos de multiples streams |
| Microbatching | Microbatch | Tratar el stream como mini-batches |
| Checkpointing | Punto de control | Guardar estado periodicamente para recuperacion |
| Exactly-once semantics | Semantica de exactamente-una-vez | Garantia de que cada evento se procesa una sola vez |

---

## Preguntas de Comprension (Auto-evaluacion)

1. ¿Cual es la diferencia fundamental entre batch y stream processing en terminos de los datos que reciben?
2. ¿Por que Kafka puede hacer "replay" de mensajes y RabbitMQ no?
3. Explica CDC: ¿que problema resuelve y como funciona a nivel tecnico?
4. ¿Cual es la diferencia entre CDC y event sourcing? ¿En que nivel opera cada uno?
5. ¿Por que event time y processing time pueden ser diferentes? Da un ejemplo concreto.
6. ¿Que tipos de ventanas existen y cuando usarias cada una?
7. Describe los tres tipos de stream joins. ¿Cual requiere mas estado en memoria?
8. ¿Por que `counter += 1` no es idempotente y `SET value = 42` si lo es?
9. ¿Que combinacion de tecnicas se necesita para lograr exactly-once semantics?
10. Si un evento llega 5 minutos tarde y la ventana ya cerro, ¿que opciones tienes para manejarlo?
