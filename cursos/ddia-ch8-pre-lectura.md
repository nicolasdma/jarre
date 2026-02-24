# DDIA Capítulo 8: The Trouble with Distributed Systems
## Sesión Pre-Lectura — Preparación Conceptual

**Fecha:** 2026-02-15
**Objetivo:** Construir un mapa mental de los conceptos clave ANTES de leer el capítulo en inglés.
**Método:** Explicación progresiva con preguntas y respuestas.

---

## Concepto 1: Fallas Parciales — El Problema Fundamental

En una sola máquina, las cosas funcionan o no funcionan. Si la RAM falla, el programa crashea. Es **determinista**: puedes razonar sobre el estado.

En un sistema distribuido, **parte del sistema puede fallar mientras el resto sigue funcionando**. Esto se llama **partial failure** (falla parcial), y es **no-determinista**: no sabes si un nodo está muerto, lento, o si el mensaje se perdió.

> **Todo el capítulo 8 se trata de: ¿por qué los sistemas distribuidos son fundamentalmente más difíciles que un solo nodo, y qué puede salir mal?**

**Analogía:**
- **Una sola máquina** = una persona trabajando sola. Si se desmaya, el trabajo se detiene. Claro.
- **Sistema distribuido** = 10 personas trabajando en cuartos separados, comunicándose solo por cartas. ¿Alguien no contestó? ¿Se perdió la carta? ¿Está muerto? ¿Está pensando?

```
SINGLE NODE:                    DISTRIBUTED SYSTEM:

  ┌──────────┐                   ┌────┐    ┌────┐    ┌────┐
  │  Estado   │                   │ A  │    │ B  │    │ C  │
  │  claro:   │                   │ OK │    │ ?? │    │ OK │
  │ funciona  │                   └──┬─┘    └──┬─┘    └──┬─┘
  │    o      │                      │    ??   │         │
  │   muere   │                      ├────X────┤         │
  └──────────┘                       │         │    ??   │
                                     │         ├────X────┤
  Determinista                       Parcialmente roto
```

La clave: en un sistema distribuido **no puedes saber** con certeza qué pasó. Solo puedes hacer **suposiciones** y diseñar para tolerar la incertidumbre.

---

## Concepto 2: Redes No Confiables

Internet y las redes de datacenters son **asíncronas y basadas en paquetes** (async packet-switched networks). No hay garantía de que un mensaje llegue, ni de cuánto tardará.

### Qué puede pasar con un request

```
Nodo A envía request a Nodo B:

1. CASO FELIZ:
   A ──[req]──► B ──[resp]──► A     ✓ Todo bien

2. REQUEST PERDIDO:
   A ──[req]──X                      El paquete nunca llegó

3. B EN COLA:
   A ──[req]──► B (sobrecargado)     B lo recibió pero no responde

4. B CRASHEÓ:
   A ──[req]──► B (muerto)           B ya no existe

5. RESPUESTA PERDIDA:
   A ──[req]──► B ──[resp]──X        B procesó, pero A nunca se enteró

6. RESPUESTA LENTA:
   A ──[req]──► B ──[resp]─────────► A (llega después del timeout)
```

Desde la perspectiva de A, los casos 2-6 son **indistinguibles**. Solo sabes que no recibiste respuesta a tiempo. Esta es la realidad fundamental de los sistemas distribuidos.

### Timeouts: la única herramienta

No hay forma perfecta de saber si un nodo falló. Lo único que puedes hacer es esperar un tiempo y **declarar que no respondió** (timeout). Pero elegir el timeout es un trade-off:

| Timeout | Ventaja | Riesgo |
|---------|---------|--------|
| **Corto** (200ms) | Detectas fallos rápido | Falsos positivos: declaras muerto a un nodo que estaba lento |
| **Largo** (30s) | Menos falsos positivos | Tardas mucho en detectar un nodo realmente muerto |

No existe un valor universalmente correcto. Algunos sistemas usan **timeouts adaptativos** que se ajustan según la latencia observada (similar a los mecanismos de TCP).

---

## Concepto 3: Relojes No Confiables

Cada máquina tiene su propio reloj de cuarzo. Estos relojes **derivan** (clock drift): se adelantan o atrasan gradualmente. Dos máquinas que arrancaron sincronizadas divergirán con el tiempo.

### Dos tipos de reloj

| | **Time-of-day clock** | **Monotonic clock** |
|---|---|---|
| Qué mide | "¿Qué hora es?" (wall clock) | "¿Cuánto tiempo pasó?" |
| Ejemplo | `System.currentTimeMillis()` | `System.nanoTime()` |
| Sincronizado por NTP | Sí (puede saltar hacia atrás o adelante) | No (siempre avanza) |
| Sirve para ordenar eventos entre nodos | **NO** (peligroso) | **NO** (solo local) |
| Sirve para medir duración local | No ideal | **SÍ** (exactamente para eso) |

### Por qué los relojes son peligrosos para ordenar eventos

```
Nodo A (reloj adelantado +3s)     Nodo B (reloj correcto)
──────────────────────────         ───────────────────────
Escribe X=1 a las 10:00:03        Escribe X=2 a las 10:00:01

              Según los timestamps:
              X=1 (10:00:03) es "después de" X=2 (10:00:01)

              Realidad:
              X=2 se escribió DESPUÉS de X=1
              ¡El orden del reloj es INCORRECTO!
```

> **Regla crítica:** NUNCA confíes en timestamps de distintas máquinas para determinar el orden de eventos. El reloj de cada nodo puede estar mal por milisegundos o incluso segundos.

### NTP (Network Time Protocol)

NTP intenta sincronizar relojes consultando servidores de referencia. Pero:
- La sincronización depende del **round-trip de red** (no confiable)
- En el mejor caso logra precisión de **decenas de milisegundos**
- A veces NTP **ajusta el reloj hacia atrás**, lo cual puede hacer que timestamps "del futuro" aparezcan en el pasado

---

## Concepto 4: Relojes Lógicos — La Alternativa

Si los relojes físicos no sirven para ordenar eventos entre nodos, ¿qué usamos? **Relojes lógicos** (logical clocks): contadores que solo capturan **causalidad**, no tiempo real.

**Analogía:** No me importa "a qué hora" pasó algo, me importa "qué pasó antes de qué". Como un número de turno en una panadería: el turno 42 fue antes que el 43, sin importar la hora.

### Lamport Timestamps (simplificado)

```
Nodo A (counter=0)          Nodo B (counter=0)
──────────────────          ──────────────────
Evento local → counter=1
Envía msg (counter=1) ──►   Recibe msg, adopta max(0,1)+1=2
                            Evento local → counter=3
                            Envía msg (counter=3) ──►
Recibe msg, max(1,3)+1=4

Orden garantizado: 1 → 2 → 3 → 4
```

Cada nodo incrementa su contador local. Al recibir un mensaje, adopta el máximo entre su contador y el del mensaje, y suma 1. Esto garantiza que **si A causó B, el número de A es menor que el de B**.

No necesitas relojes sincronizados. Solo contadores y mensajes.

---

## Concepto 5: Pausas de Proceso

Incluso dentro de un solo nodo, tu proceso puede **pausarse** por tiempo indefinido sin que lo sepas:

1. **Garbage Collection (GC):** En Java/Go, el GC puede pausar TODO el proceso por segundos
2. **Virtual machines:** El hypervisor puede suspender una VM para dar recursos a otra
3. **Context switches:** El OS puede priorizar otros procesos
4. **Swap (paginación a disco):** Si la RAM se llena, el OS mueve memoria a disco, pausando el proceso
5. **SIGSTOP:** Alguien o algo envía una señal que congela el proceso

### Por qué esto es peligroso

```
Tiempo real:    0s ────── 5s ────── 10s ────── 15s
                │                                │
Nodo A:         Obtiene lease    [GC PAUSE....]  Cree que tiene lease
                (válido 10s)                     Realidad: expiró hace 5s
                │                                │
Nodo B:                          Obtiene lease   Ahora B es el líder
                                 (válido 10s)    │
                                                 │
                ¡DOS nodos creen ser el líder!    ← SPLIT BRAIN
```

Un lease (contrato temporal) dice "eres el líder por 10 segundos". Pero si el GC te pausa 10 segundos, cuando despiertas **crees que el lease sigue vigente**, pero ya expiró y otro nodo tomó el rol.

> **No puedes asumir nada sobre cuánto tiempo toma una operación.** El proceso puede pausarse en cualquier punto y reanudarse sin saber que fue pausado.

---

## Concepto 6: Fencing Tokens — La Solución a las Pausas

¿Cómo evitas que un nodo con un lease expirado haga daño? Con **fencing tokens**: un número monotónicamente creciente que el servidor valida.

```
                Lock Service
                    │
    ┌───────────────┼───────────────┐
    │               │               │
 token=33        token=34        token=35
    │               │               │
 Cliente A       Cliente B       Cliente C
    │               │               │
    │  [GC PAUSE]   │               │
    │               │               │
    ▼               ▼               ▼
 ┌─────────────────────────────────────┐
 │           Storage Server            │
 │                                     │
 │  Regla: rechazar cualquier write    │
 │  con token ≤ último token aceptado  │
 │                                     │
 │  Acepta token=34 (de B) ✓          │
 │  Rechaza token=33 (de A) ✗         │
 │  "Tu token es viejo, ya vi 34"     │
 └─────────────────────────────────────┘
```

El storage server lleva cuenta del token más alto que ha visto. Si llega un write con un token menor, lo **rechaza**. Esto protege contra clientes que "despiertan" creyendo que todavía tienen el lock.

**Analogía:** Es como un sello notarial con número de folio. Si presentas el folio 33 pero el notario ya procesó el 34, sabe que tu documento está desactualizado y lo rechaza, sin importar lo que digas.

---

## Concepto 7: Verdad por Mayoría y Fallas Bizantinas

En un sistema distribuido, **la verdad no la define un solo nodo**. Un nodo no puede confiar en su propio juicio, porque podría estar en un estado corrupto sin saberlo.

### Quorums: la verdad la define la mayoría

```
5 nodos en el cluster:

  A: "Nodo X está muerto"     ┐
  B: "Nodo X está muerto"     ├── 3 de 5 = mayoría → X se declara muerto
  C: "Nodo X está muerto"     ┘
  D: "Nodo X está vivo"
  X: "¡Estoy vivo!"           ← No importa. La mayoría decidió.
```

Incluso si X está vivo y funcionando, si la mayoría no puede comunicarse con él, **para el sistema, X está muerto**. X debe aceptar esto y dejar de actuar como parte del cluster.

> **Un nodo no puede confiar en sí mismo.** Solo un quorum de nodos puede declarar verdades sobre el estado del sistema.

### Fallas Bizantinas

| Tipo de falla | Qué asume | Ejemplo |
|---|---|---|
| **Crash-stop** | Los nodos fallan dejando de funcionar | Hardware muere, proceso crashea |
| **Crash-recovery** | Los nodos pueden fallar y volver | Reinicio tras crash, con estado en disco |
| **Bizantina** | Los nodos pueden **mentir** o comportarse maliciosamente | Nodo hackeado envía datos falsos |

La mayoría de los sistemas asumen crash-stop o crash-recovery. Las **fallas Bizantinas** (nodos que mienten o envían datos falsos) requieren protocolos mucho más caros (ej: blockchain). En un datacenter controlado, generalmente **no necesitas** tolerancia Bizantina.

---

## Concepto 8: Modelos de Sistema — Tus Suposiciones Explícitas

Todo algoritmo distribuido se basa en un **modelo de sistema**: un conjunto de suposiciones explícitas sobre qué puede fallar y qué no.

### Tres dimensiones del modelo

**1. Modelo de red:**

| Modelo | Suposición | Realidad |
|---|---|---|
| Reliable | Los mensajes siempre llegan | No existe |
| Fair-loss | Los mensajes pueden perderse, pero si reenvías suficiente, eventualmente llegan | Razonable |
| Arbitrary | Los mensajes pueden ser modificados o inventados | Bizantino |

**2. Modelo de timing:**

| Modelo | Suposición | Realidad |
|---|---|---|
| Synchronous | Latencia de red y pausas de proceso tienen un límite superior conocido | Muy idealista |
| Partially synchronous | Se comporta como síncrono la mayor parte del tiempo, pero a veces excede los límites | **Más realista** |
| Asynchronous | No hay garantía de timing, ni siquiera hay relojes | Muy pesimista pero seguro |

**3. Modelo de nodos:**

| Modelo | Suposición |
|---|---|
| Crash-stop | Si falla, no vuelve |
| Crash-recovery | Puede fallar y volver con estado persistente |
| Byzantine | Puede hacer cualquier cosa, incluso mentir |

> **El modelo más usado en la práctica:** red fair-loss + timing partially synchronous + nodos crash-recovery. Es el punto de partida realista para la mayoría de los sistemas distribuidos.

---

## Resumen Visual

```
           The Trouble with Distributed Systems
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    No puedes         No puedes       No puedes
    confiar en        confiar en      confiar en
    la RED            el RELOJ        el PROCESO
        │               │               │
   Paquetes se       Clock drift     GC pauses
   pierden/atrasan   NTP impreciso   VM suspend
   Timeouts como     Timestamps      Context switch
   única defensa     no ordenan      │
        │               │            Leases peligrosos
        │               │               │
        │          Relojes lógicos   Fencing tokens
        │          (Lamport, etc.)   (protección)
        │               │               │
        └───────────────┼───────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         Verdad por            Modelos de
         mayoría               sistema
         (quorums)             (suposiciones
              │                 explícitas)
         Fallas Bizantinas
         vs crash-stop
```

---

## Términos Clave para el Capítulo (Inglés → Español)

| Inglés | Español | Qué es |
|--------|---------|--------|
| Partial failure | Falla parcial | Parte del sistema falla mientras el resto sigue |
| Nondeterministic | No determinista | No puedes predecir el resultado exacto |
| Packet-switched network | Red de conmutación de paquetes | Red donde los datos viajan en paquetes independientes |
| Timeout | Tiempo de espera | Tiempo máximo antes de declarar una falla |
| Time-of-day clock | Reloj de hora del día | Reloj que dice la hora (puede saltar) |
| Monotonic clock | Reloj monótono | Reloj que solo avanza, para medir duración |
| Clock drift | Deriva del reloj | Desviación gradual del reloj respecto al tiempo real |
| NTP | NTP | Protocolo para sincronizar relojes por red |
| Logical clock | Reloj lógico | Contador que captura causalidad, no tiempo real |
| Lease | Contrato temporal | Permiso con expiración automática (ej: ser líder) |
| Fencing token | Token de cercado | Número creciente para invalidar locks expirados |
| Quorum | Quorum | Mayoría de nodos necesaria para tomar decisiones |
| Byzantine fault | Falla Bizantina | Nodo que miente o se comporta maliciosamente |
| System model | Modelo de sistema | Suposiciones explícitas sobre qué puede fallar |
| Split brain | Cerebro dividido | Dos nodos creen ser el líder simultáneamente |

---

## Preguntas de Comprensión (Auto-evaluación)

1. ¿Por qué una falla parcial es más difícil de manejar que un crash total?
2. Desde la perspectiva de un nodo que envía un request, ¿cómo distingue entre un nodo muerto, un paquete perdido y un nodo lento?
3. ¿Cuál es el trade-off de elegir un timeout corto vs largo?
4. ¿Por qué no puedes usar timestamps de distintas máquinas para ordenar eventos? Da un ejemplo concreto.
5. ¿Cuál es la diferencia entre un time-of-day clock y un monotonic clock, y cuándo usarías cada uno?
6. ¿Cómo resuelven los relojes lógicos el problema del ordenamiento sin depender de tiempo real?
7. ¿Por qué una pausa de GC puede causar split brain con leases?
8. Explica cómo un fencing token protege contra un cliente que despierta con un lease expirado.
9. ¿Por qué un nodo no puede confiar solo en su propia perspectiva para declarar verdades del sistema?
10. ¿Qué modelo de sistema (red + timing + nodos) es el más realista para un datacenter, y por qué?
