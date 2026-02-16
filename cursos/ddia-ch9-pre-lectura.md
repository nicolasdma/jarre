# DDIA Capítulo 9: Consistency and Consensus
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el capítulo en inglés.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: El Problema Fundamental — ¿Qué Pueden Prometer los Sistemas Distribuidos?

En un sistema con una sola máquina, las cosas son simples: hay una copia de los datos, un reloj, un orden claro. Cuando distribuyes datos en múltiples nodos, surgen preguntas que no existían antes:

- Si dos nodos tienen copias distintas, **¿cuál es la correcta?**
- Si dos escrituras ocurren "al mismo tiempo", **¿cuál fue primero?**
- Si un nodo se cae a medio camino, **¿los demás continúan o esperan?**

> **Todo el capítulo 9 trata de: ¿qué garantías podemos ofrecer sobre consistencia y orden en un sistema distribuido, y a qué costo?**

**Analogía:**
- **Una sola máquina** = una persona tomando decisiones sola. Siempre coherente consigo misma.
- **Sistema distribuido** = un comité de 5 personas en ciudades distintas, comunicándose por cartas. ¿Cómo se ponen de acuerdo?

El capítulo presenta un espectro de garantías, de la más débil a la más fuerte:

```
Débil                                              Fuerte
  │                                                   │
  ▼                                                   ▼
Eventual          Causal            Linearizability
Consistency       Consistency       (Consistencia fuerte)
  │                  │                    │
"Algún día         "Respeto el          "Parece una
 convergen"         orden lógico"        sola copia"
```

Cada nivel más fuerte cuesta más en latencia y disponibilidad. No hay almuerzo gratis.

---

## Concepto 2: Linearizability — La Garantía Más Fuerte

Linearizability significa que el sistema **se comporta como si hubiera una sola copia de los datos**, aunque haya múltiples réplicas. Toda operación aparenta ejecutarse en un instante atómico entre su invocación y su respuesta.

### ¿Cómo se ve?

```
Cliente A:  |--- write(x=1) ---|
Cliente B:              |--- read(x) ---| → debe retornar 1

Tiempo ──────────────────────────────────────────►

Si B empieza a leer DESPUÉS de que A completó la escritura,
B DEBE ver el valor nuevo. No puede ver un valor viejo.
```

### ¿Cuándo lo necesitas?

1. **Elección de líder:** Si dos nodos creen ser líder simultáneamente, tienes split-brain. Necesitas un lock linearizable.
2. **Restricciones de unicidad:** Dos usuarios registrando el mismo username. Solo uno debe ganar.
3. **Saldos bancarios:** No puedes permitir que dos lecturas simultáneas vean el mismo saldo y ambas autoricen un retiro.

### ¿Cuándo NO lo necesitas?

- Feeds de redes sociales (si ves un post 2 segundos tarde, no pasa nada)
- Analytics y reportes (datos históricos, la consistencia eventual basta)
- Caches (por definición, datos potencialmente desactualizados)

### Linearizability vs Serializability — La Confusión Clásica

| | **Linearizability** | **Serializability** |
|---|---|---|
| **Dominio** | Sistemas distribuidos | Bases de datos (transacciones) |
| **Pregunta** | ¿Se comporta como una sola copia? | ¿Las transacciones se comportan como si fueran secuenciales? |
| **Aplica a** | Operaciones individuales de lectura/escritura | Transacciones completas (multi-operación) |
| **Capítulo** | Cap. 9 | Cap. 7 |

Son conceptos ortogonales. Puedes tener uno sin el otro, ambos, o ninguno.

---

## Concepto 3: El Teorema CAP — El Trade-off Inevitable

CAP dice que ante una **partición de red** (P), debes elegir entre:

```
        Consistency (C)
            /\
           /  \
          /    \
         / ELIGE \
        / UNO     \
       /____________\
Availability (A) ←─── Partition
                      Tolerance (P)
```

- **CP:** Ante partición, rechazas solicitudes para mantener consistencia. Ejemplo: ZooKeeper, etcd.
- **AP:** Ante partición, sigues respondiendo pero con datos potencialmente desactualizados. Ejemplo: Cassandra, DynamoDB.

> **Cuidado:** CAP es más un eslogan que un teorema riguroso. En la práctica las particiones son raras pero reales, y la decisión no es binaria sino un espectro de trade-offs.

**Analogía:** Dos sucursales bancarias pierden comunicación.
- **CP:** Ambas dejan de operar hasta restaurar la comunicación. Nadie cobra de más.
- **AP:** Ambas siguen operando con su última copia. Riesgo de sobregiro, pero el negocio no para.

---

## Concepto 4: Ordenamiento — Causal vs Total

El orden importa. Si dices "cancelar pedido" y luego "confirmar envío", el resultado depende del orden. En un sistema distribuido, establecer ese orden es difícil.

### Orden causal

Dos eventos tienen relación causal si uno **pudo haber influido** en el otro. Si no hay relación, son **concurrentes** y su orden no importa.

```
Nodo A: post("Hola")  ──────────────────►
                            │
Nodo B:                     └──► reply("Hola, ¿qué tal?")
                                        │
                                        ▼
                              La reply DEPENDE del post
                              → hay orden causal

Nodo A: post("Me gusta el café")
Nodo C: post("Hoy llueve")
                              → concurrentes, orden irrelevante
```

La consistencia causal es más débil que linearizability pero mucho más barata: no necesitas coordinación global, solo rastrear dependencias.

### Orden total

En un orden total, **cualquier par de eventos** se puede comparar: uno fue primero. Linearizability implica orden total. La consistencia causal solo ordena eventos relacionados (orden parcial).

### Lamport Timestamps

Para establecer un orden total sin un reloj centralizado, Lamport propuso un contador lógico:

```
Nodo A (counter=1)         Nodo B (counter=1)
    │                           │
    ├─ op1 → (1, A)            │
    │                           ├─ op2 → (1, B)
    │                           │
    │ ─── mensaje ──────────►   │
    │                           ├─ recibe: max(1,1)+1 = 2
    │                           ├─ op3 → (2, B)
    │                           │
    ◄──── mensaje ──────────    │
    ├─ recibe: max(1,2)+1 = 3  │
    ├─ op4 → (3, A)            │

Orden total: (1,A) < (1,B) < (2,B) < (3,A)
  (desempate por ID de nodo cuando el counter es igual)
```

**Limitación:** Lamport timestamps dan orden total **después del hecho**. No puedes usarlos para tomar decisiones en tiempo real (como "¿quién registró este username primero?") porque necesitarías consultar a TODOS los nodos antes de decidir.

---

## Concepto 5: Total Order Broadcast

Para resolver la limitación de Lamport timestamps, necesitas **total order broadcast**: un protocolo donde todos los nodos reciben los mismos mensajes en el mismo orden.

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  Nodo A  │    │  Nodo B  │    │  Nodo C  │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     │   msg1        │               │
     ├──────────────►├──────────────►│
     │               │               │
     │         msg2  │               │
     │◄──────────────┤──────────────►│
     │               │               │
     │   msg3        │               │
     ├──────────────►├──────────────►│
     ▼               ▼               ▼
  [msg1,msg2,msg3] [msg1,msg2,msg3] [msg1,msg2,msg3]
  Todos ven el MISMO orden
```

Propiedades:
1. **Reliable delivery:** Si un nodo recibe un mensaje, todos lo reciben.
2. **Totally ordered:** Todos procesan los mensajes en el mismo orden.

> **Total order broadcast es equivalente al consenso.** Si puedes resolver uno, puedes resolver el otro. Esta es una de las ideas más profundas del capítulo.

---

## Concepto 6: Two-Phase Commit (2PC) — Transacciones Distribuidas

Cuando una transacción toca múltiples nodos (o múltiples bases de datos), necesitas que TODOS hagan commit o NINGUNO. 2PC resuelve esto con un **coordinador**:

```
                    Coordinador
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
          Nodo A     Nodo B     Nodo C

FASE 1: "¿Pueden hacer commit?"  (PREPARE)
              │         │         │
           "Sí" ──►    "Sí" ──►  "Sí" ──►  Coordinador

FASE 2: "Todos dijeron sí → COMMIT"
              │         │         │
           COMMIT    COMMIT    COMMIT
```

### El Problema del Coordinador

Si el coordinador se cae **entre la Fase 1 y la Fase 2**, los nodos quedan "in doubt" (en duda):

```
           Coordinador
               💥 (se cae)

          Nodo A          Nodo B
        "Dijo que sí,   "Dijo que sí,
        pero ¿commit     pero ¿commit
        o abort?"        o abort?"

         ┌──────────────────────┐
         │ No pueden decidir    │
         │ solos. BLOQUEADOS    │
         │ hasta que el         │
         │ coordinador vuelva.  │
         └──────────────────────┘
```

Los nodos tienen **locks** tomados sobre filas que no pueden liberar. Están paralizados. Esto puede durar minutos, horas, o hasta requerir intervención manual.

> **2PC no es un protocolo de consenso.** Es un protocolo de commit atómico. Si el coordinador falla, el sistema se bloquea. Un protocolo de consenso real (Raft, Paxos) puede progresar mientras haya mayoría.

---

## Concepto 7: Consenso — Ponerse de Acuerdo a Pesar de Fallos

Consenso es que un grupo de nodos se ponga de acuerdo en un valor, incluso si algunos nodos fallan. Es EL problema central de los sistemas distribuidos.

### Propiedades del consenso

1. **Uniform agreement:** Todos los nodos que deciden eligen el mismo valor.
2. **Integrity:** Ningún nodo decide dos veces.
3. **Validity:** El valor decidido fue propuesto por algún nodo.
4. **Termination:** Todo nodo que no falle eventualmente decide.

### FLP Impossibility

Fischer, Lynch y Paterson demostraron (1985) que en un sistema asíncrono con incluso **un solo nodo que pueda fallar**, no existe algoritmo de consenso que siempre termine.

En la práctica, los algoritmos reales (Raft, Paxos) evitan esta imposibilidad usando **timeouts** y **detección de fallos imperfecta** — sacrifican la garantía teórica de terminación en todos los casos a cambio de funcionar en la práctica.

### Raft vs Paxos

| | **Paxos** | **Raft** |
|---|---|---|
| **Año** | 1989 (Lamport) | 2014 (Ongaro & Ousterhout) |
| **Diseño** | Elegante pero difícil de implementar | Diseñado para ser entendible |
| **Líder** | Multi-Paxos usa líder, Paxos básico no | Siempre hay un líder elegido |
| **Complejidad** | Muy alta (famoso por su dificultad) | Moderada (paper pensado como tutorial) |
| **Usado por** | Google Chubby, algunos sistemas legacy | etcd, CockroachDB, TiKV |
| **Idea central** | Proponer → Prometer → Aceptar | Elegir líder → líder replica log |

Ambos requieren **mayoría** (quórum) para progresar. Con 5 nodos, toleran la falla de 2. Con 3 nodos, toleran 1.

```
Raft — Flujo simplificado:

  1. ELECCIÓN: Los nodos eligen un líder por votación

     Nodo A ───vote───► Nodo B (candidato)
     Nodo C ───vote───► Nodo B (candidato)
                         │
                    Nodo B es LÍDER (2 de 3 votos)

  2. REPLICACIÓN: El líder recibe escrituras y las replica

     Cliente ──write──► Líder B
                         │
                    ┌────┼────┐
                    ▼         ▼
                 Nodo A    Nodo C
                 (replica)  (replica)
                    │         │
                   ACK       ACK
                    │         │
                    └────┬────┘
                         │
                    Mayoría confirmó → COMMIT
```

---

## Concepto 8: Servicios de Coordinación — ZooKeeper, etcd

En la práctica, no implementas consenso tú mismo. Usas un servicio dedicado:

| | **ZooKeeper** | **etcd** |
|---|---|---|
| **Protocolo** | Zab (similar a Paxos) | Raft |
| **Lenguaje** | Java | Go |
| **Usado por** | Kafka, HBase, Hadoop | Kubernetes, CockroachDB |
| **API** | Jerárquica (como filesystem) | Key-value plano |

### ¿Para qué los usas?

1. **Elección de líder:** "¿Quién es el líder del cluster de Kafka?" Un nodo crea un nodo efímero en ZooKeeper. Si ese nodo muere, ZooKeeper lo detecta y otro toma el liderazgo.

2. **Configuración distribuida:** Todos los nodos leen la config del mismo lugar. Si cambia, ZooKeeper notifica a todos.

3. **Service discovery:** "¿En qué IP está el servicio X?" Los servicios se registran al arrancar.

4. **Locks distribuidos:** Exclusión mutua entre procesos en distintas máquinas.

> **Regla de oro:** Tu aplicación NO debería usar consenso en el hot path (cada request). Usa un servicio de coordinación para decisiones infrecuentes pero críticas (elección de líder, cambios de configuración), y replica el resultado.

```
Tu aplicación (miles de requests/segundo)
       │
       │  "¿Quién es el líder?"
       │  (pregunta infrecuente)
       ▼
  ┌──────────┐
  │ ZooKeeper │  ← 3-5 nodos con consenso
  │  / etcd   │     (lento pero correcto)
  └──────────┘
       │
       │  "Nodo B es líder"
       │  (respuesta cacheada)
       ▼
  Nodo B procesa requests directamente
  (rápido, sin consenso por request)
```

---

## Resumen Visual

```
                  Consistency & Consensus
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     Garantías         Orden          Acuerdo
          │               │               │
   ┌──────┼──────┐   ┌───┼───┐     ┌─────┼─────┐
   │      │      │   │       │     │           │
Eventual Causal Linear. Lamport  Total    Transacc. Consenso
   │      │      │   Timestamps Order     Distrib.    │
   │      │      │       │     Broadcast    │     ┌───┼───┐
  Débil  Media  Fuerte   │        │        2PC   Raft  Paxos
   │      │      │       └───┬────┘         │      │
  Gratis  │    Costosa    Equivalente    Bloquea  Mayoría
          │      │        al consenso    si coord.  │
          │    CAP                        falla   ZooKeeper
          │   (CP vs AP)                          etcd
          │
     Solo rastrear
     dependencias
```

---

## Términos Clave para el Capítulo (Inglés → Español)

| Inglés | Español | Qué es |
|--------|---------|--------|
| Linearizability | Linearizabilidad | Garantía de que el sistema actúa como una sola copia |
| Eventual consistency | Consistencia eventual | Las réplicas convergen eventualmente, sin garantía de cuándo |
| Causal consistency | Consistencia causal | Respeta el orden causa-efecto entre operaciones |
| Total order broadcast | Difusión con orden total | Todos los nodos reciben mensajes en el mismo orden |
| Lamport timestamp | Marca de tiempo de Lamport | Reloj lógico para establecer orden total |
| Consensus | Consenso | Múltiples nodos acuerdan un valor a pesar de fallos |
| Two-phase commit (2PC) | Commit en dos fases | Protocolo para transacciones atómicas distribuidas |
| Coordinator | Coordinador | Nodo central que dirige el 2PC |
| Split-brain | Cerebro dividido | Dos nodos creen ser líder simultáneamente |
| Quorum | Quórum | Mayoría de nodos necesaria para tomar decisiones |
| Epoch / term | Época / mandato | Período de liderazgo en un protocolo de consenso |
| FLP impossibility | Imposibilidad FLP | No existe consenso determinista en sistemas asíncronos con fallos |
| Fencing token | Token de cercado | Número monotónico para invalidar locks expirados |
| Service discovery | Descubrimiento de servicios | Encontrar la dirección de un servicio en el cluster |

---

## Preguntas de Comprensión (Auto-evaluación)

1. ¿Cuál es la diferencia entre linearizability y serializability? ¿Por qué se confunden?
2. ¿Por qué la consistencia causal es más barata que linearizability?
3. Explica el teorema CAP con tus palabras. ¿Por qué decimos que es más un eslogan que un teorema riguroso?
4. ¿Qué limitación tienen los Lamport timestamps que total order broadcast resuelve?
5. ¿Qué pasa en 2PC si el coordinador se cae después de enviar PREPARE pero antes de enviar COMMIT?
6. ¿Por qué 2PC NO es un protocolo de consenso?
7. ¿Qué dice la imposibilidad FLP y cómo la evitan Raft y Paxos en la práctica?
8. ¿Cuál es la diferencia principal de diseño entre Raft y Paxos?
9. ¿Por qué no deberías usar consenso en el hot path de tu aplicación?
10. ¿Qué problemas resuelve ZooKeeper/etcd y por qué no los resuelves tú mismo?
