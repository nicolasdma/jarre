# Phase 1 — Distributed Systems Playgrounds

**Date:** 2026-02-06
**Scope:** 4 interactive playgrounds for DDIA Chapters 1, 5, 6, 8-9
**Sessions:** 7a-10d (11 sessions total, parallelizable)

---

## Motivacion

El playground del Ch3 (Storage Engine) fue transformador: construir y visualizar > leer. Necesitamos replicar ese patron para todos los capitulos de Phase 1. Cada playground es frontend-only (sin backend engine) porque simulamos algoritmos, no I/O real.

---

## Arquitectura comun

Todos siguen el patron del storage engine playground:

```
src/app/playground/{name}/
├── page.tsx                    # Server Component wrapper + header
├── {name}-playground.tsx       # Client Component orchestrador (3-panel layout)
├── lesson-guide.tsx            # Panel izquierdo: lecciones en espanol
├── {interactive-panel}.tsx     # Panel central: interaccion principal
└── {metrics-panel}.tsx         # Panel derecho: stats/visualizacion
```

**Diferencia clave vs storage engine:** No hay backend Node.js. Toda la simulacion corre en React state con `setInterval`/`requestAnimationFrame`. No se necesitan API routes.

**Temas de color distintos:**
- Storage Engine: verde/purpura/teal (existente)
- Latency Simulator: ambar/naranja (`#d97706`)
- Replication Lab: azul/navy (`#2d4a6a`)
- Partition Visualizer: esmeralda (`#059669`)
- Consensus Stepper: rojo/carmesi (`#991b1b`)

---

## Playground 1: Latency Simulator (DDIA Ch1)

**Ruta:** `/playground/latency-simulator`

### Que ensena
- Latencia vs throughput
- Percentiles (p50, p95, p99, p999) — por que el promedio miente
- Tail latency amplification (fan-out)
- SLOs/SLIs y error budgets
- Distribuciones: normal, log-normal, bimodal (GC pauses)

### Estructura de archivos
```
src/app/playground/latency-simulator/
├── page.tsx
├── latency-playground.tsx        # Orchestrador + simulation loop
├── lesson-guide.tsx              # 10 lecciones
├── control-panel.tsx             # Sliders + charts SVG
└── metrics-panel.tsx             # Percentiles + SLO tracking
```

### Interaccion
- Control panel con sliders: request rate, base latency, distribucion, fan-out
- Charts SVG: histograma de latencias, timeline de percentiles, throughput gauge
- SLO line configurable sobre los charts
- Presets clickeables desde las lecciones ("Normal 50ms ± 10ms", "Add GC pauses")

### Simulacion (en browser)
- `setInterval(100ms)` genera N requests segun rate
- Latencias generadas con Box-Muller (normal), exp(normal) (log-normal), o bimodal
- Fan-out: `Math.max(...N_samples)` — el mas lento gana
- Rolling window de 1000 requests para percentiles
- Percentiles recalculados cada 100 requests

### Modelo de estado
```typescript
interface SimulationState {
  isRunning: boolean
  requestRate: number           // req/s
  distribution: 'normal' | 'lognormal' | 'bimodal'
  baseLatency: number           // ms (mean)
  stdDev: number                // standard deviation
  slowRequestRate: number       // % of slow requests (bimodal)
  slowLatencyMultiplier: number
  downstreamServices: number    // fan-out factor (0-5)
  requests: RequestData[]       // last 1000 requests
  percentiles: { p50, p95, p99, p999 }
  sloTarget: number             // ms (e.g., p95 < 200ms)
  sloViolations: number
}
```

### 10 Lecciones (espanol)
1. **Latencia vs Throughput** — Diferencia fundamental. Preset: 10 req/s, 50ms
2. **Distribuciones: Normal vs Real** — Log-normal tiene cola larga. Preset: switch a log-normal
3. **Percentiles: por que el promedio miente** — p95 importa mas. Preset: 1% slow requests
4. **SLOs: definir lo aceptable** — Service Level Objectives. Preset: SLO p95 < 100ms
5. **Tail Latency Amplification** — Fan-out = el mas lento gana. Preset: 3 downstream services
6. **Carga: requests por segundo** — Mas carga = mas latencia. Preset: rate de 10 a 50
7. **GC Pauses y spikes** — Distribuciones bimodales. Preset: bimodal (90% fast, 10% slow)
8. **Escalabilidad vertical vs horizontal** — Techo de throughput. Preset: rate 100
9. **Cascading slowness** — Fan-out + slow downstream. Preset: combinado
10. **Error budgets** — Cuantos requests lentos puedes "pagar". Preset: calcular budget

### Sessions
- **Session 7a:** Estructura + simulacion + control panel basico + charts stub
- **Session 7b:** Charts SVG completos + metrics panel + 10 lecciones

---

## Playground 2: Replication Lab (DDIA Ch5)

**Ruta:** `/playground/replication-lab`

### Que ensena
- Leader-based replication
- Sync vs async replication
- Replication lag
- Read-after-write consistency
- Monotonic reads
- Failover (leader crash)
- Split brain

### Estructura de archivos
```
src/app/playground/replication-lab/
├── page.tsx
├── replication-playground.tsx     # Orchestrador + simulation tick
├── lesson-guide.tsx              # 11 lecciones
├── node-diagram.tsx              # SVG: 3 nodos + mensajes animados
└── event-log.tsx                 # Timeline de operaciones
```

### Interaccion
- SVG con 3 nodos: Leader (arriba) + 2 Followers (abajo)
- Mensajes animados entre nodos (write propagation)
- Click nodo = crash/revive
- Boton "Write" = escribe al leader
- Click follower = read (detecta stale reads)
- Slider latencia, toggle sync/async
- Boton "Partition" / "Heal"

### Modelo de simulacion
```typescript
interface Node {
  id: string                    // 'leader' | 'follower-1' | 'follower-2'
  role: 'leader' | 'follower'
  status: 'healthy' | 'lagging' | 'crashed' | 'partitioned'
  data: Map<string, { value: string; version: number }>
  position: { x: number; y: number }
}

interface Message {
  id: string
  type: 'write' | 'replicate' | 'ack'
  from: string; to: string
  data: { key: string; value: string; version: number }
  sentAt: number; delay: number
  status: 'pending' | 'delivered' | 'dropped'
}

interface Event {
  timestamp: number
  type: 'client_write' | 'client_read' | 'replication_sent' | 'node_crash' | 'consistency_violation' | ...
  description: string
  severity: 'info' | 'warning' | 'error'
}
```

- `setInterval(16ms)` tick loop procesa mensajes que llegaron (based on delay)
- Deteccion automatica de violaciones:
  - Read-after-write: leiste del follower y no tiene tu escritura reciente
  - Monotonic read: leiste de follower A (version 5), luego de B (version 3)
  - Split brain: dos nodos con role='leader'

### Node Diagram (SVG)
- Nodos como circulos (80px) con mini data table adentro
- Colores: verde=healthy, amarillo=lagging, rojo=crashed
- Flechas animadas entre nodos mostrando flujo de datos
- Paquetes de mensajes moviendose a lo largo de las flechas
- Linea punteada = network partition

### 11 Lecciones (espanol)
1. **Por que replicar** — Tolerancia a fallos, latencia, escalar lecturas
2. **Leader-based replication** — 1 leader escribe, N followers replican
3. **Async vs Sync** — Tradeoff velocidad vs seguridad
4. **Replication lag** — Followers siempre atras (en async)
5. **Read-after-write consistency** — Lees tu propia escritura... o no
6. **Monotonic reads** — No retroceder en el tiempo
7. **Consistent prefix reads** — Orden causal
8. **Failover** — El leader muere, que pasa?
9. **Split brain** — Dos leaders, datos divergentes
10. **Multi-leader** — N leaders en N datacenters (breve)
11. **Trade-offs finales** — Consistencia vs disponibilidad

### Sessions
- **Session 8a:** Tipos + ReplicationEngine + layout 3-panel + node diagram basico + event log
- **Session 8b:** Mensajes animados SVG + interactividad (click crash, slider latencia, partition)
- **Session 8c:** Deteccion de violaciones de consistencia + 11 lecciones completas

---

## Playground 3: Partition Visualizer (DDIA Ch6)

**Ruta:** `/playground/partitioning`

### Que ensena
- Hash partitioning (modulo) — y su problema al agregar nodos
- Consistent hashing con virtual nodes
- Range partitioning
- Hotspots
- Rebalancing

### Estructura de archivos
```
src/app/playground/partitioning/
├── page.tsx
├── partition-playground.tsx       # Orchestrador
├── lesson-guide.tsx              # 8 lecciones
├── ring-visualizer.tsx           # SVG: consistent hashing ring + range bars
└── partition-stats.tsx           # Load distribution + skew metrics
```

### Interaccion
- **Hash mode:** Anillo SVG con nodos como arcos coloreados, keys como puntos
- **Range mode:** Barra horizontal con rangos por nodo
- Botones: Add/remove nodo, Add N random keys, Search key
- Slider: virtual nodes (consistent hashing)
- Toggle: hash/range mode
- Animacion de redistribucion cuando se agregan/quitan nodos

### Simulacion
```typescript
// Hash simple: hash(key) % nodeCount
// Consistent hashing: virtual nodes en ring [0, 2^32)
// Range: dividir keyspace en N rangos iguales

function hashConsistent(key: string, nodes: Node[], virtualNodes: number): string {
  // Cada nodo tiene `virtualNodes` posiciones en el ring
  // Hash key a posicion, buscar primer nodo clockwise
}
```

### Stats panel
- Keys por particion (min/max/avg)
- Load distribution bar chart
- Skew metric (max/avg ratio)
- Numero de keys que se movieron en ultimo rebalance

### 8 Lecciones (espanol)
1. **Por que particionar** — Scaling horizontal
2. **Hash simple: modulo N** — Simple pero fragil
3. **Agregar un nodo** — 66% de keys se mueven (desastre)
4. **Consistent hashing** — Virtual nodes minimizan movimiento a 1/N
5. **Range partitioning** — Rangos ordenados, boundaries
6. **Hotspots** — El problema de las celebrities
7. **Partitioning + Replication** — Como trabajan juntos
8. **Indices secundarios** — Document-partitioned vs term-partitioned

### Sessions
- **Session 9a:** Estructura + hash simple + ring SVG basico + stats
- **Session 9b:** Consistent hashing + range mode + animaciones de redistribucion + 8 lecciones

---

## Playground 4: Consensus Stepper (DDIA Ch8-9)

**Ruta:** `/playground/consensus`

### Que ensena
- Por que el consenso es dificil
- Raft: follower/candidate/leader states
- Leader election con terms
- Log replication
- Commit con quorum mayoritario
- Network partitions y split brain prevention
- Linearizability

### Estructura de archivos
```
src/app/playground/consensus/
├── page.tsx
├── consensus-playground.tsx       # Orchestrador
├── lesson-guide.tsx              # 12 lecciones
├── raft-engine.ts                # Logica Raft pura (no React)
├── cluster-visualizer.tsx        # SVG: 5 nodos en circulo + mensajes
├── log-visualizer.tsx            # 5 columnas side-by-side de logs
└── controls-panel.tsx            # Step/Auto/Kill/Partition
```

### Interaccion
- 5 nodos SVG en circulo, cada uno muestra: estado (badge), term, log length
- Mensajes animados: RequestVote (azul dashed), AppendEntries (verde solid), heartbeats (gris thin)
- **Step mode:** Boton "Step" avanza 1 tick
- **Auto mode:** Ejecucion continua con speed slider
- Click nodo = kill/heal
- Boton "Partition" = split cluster en mayoria/minoria
- Boton "Client Write" = proponer valor
- Log visualizer abajo: 5 columnas con entries committed (verde) vs uncommitted (amarillo)

### Raft Engine (simplificado pero correcto)
```typescript
interface RaftNode {
  id: string
  state: 'follower' | 'candidate' | 'leader'
  currentTerm: number
  votedFor: string | null
  log: LogEntry[]
  commitIndex: number
  electionTimeout: number    // random 150-300ms (discretized to ticks)
  lastHeartbeat: number
  // Leader-only:
  nextIndex?: Map<string, number>
  matchIndex?: Map<string, number>
}

interface LogEntry {
  term: number
  command: string   // e.g., "SET x=5"
  index: number
}

// Mensajes RPC
type RaftMessage =
  | { type: 'RequestVote'; term; candidateId; lastLogIndex; lastLogTerm }
  | { type: 'RequestVoteResponse'; term; voteGranted }
  | { type: 'AppendEntries'; term; leaderId; prevLogIndex; prevLogTerm; entries[]; commitIndex }
  | { type: 'AppendEntriesResponse'; term; success; matchIndex }
```

**Invariantes:**
- Election Safety: maximo 1 leader por term
- Leader Append-Only: leader nunca sobreescribe su log
- Log Matching: misma entry (index + term) = logs identicos hasta ahi
- Leader Completeness: entry committed en term T aparece en todos los leaders futuros

**Simplificaciones:**
- 5 nodos siempre (sin membership changes)
- Sin log compaction ni snapshots
- Network delay: 1-3 ticks por mensaje
- No persistence (state en memoria)

### 12 Lecciones (espanol)
1. **El problema del consenso** — FLP impossibility, por que es dificil
2. **Los tres estados** — Follower, Candidate, Leader
3. **Eleccion de lider** — RequestVote, majority quorum
4. **Terminos** — Reloj logico monotonamente creciente
5. **Heartbeats y timeouts** — Leader mantiene autoridad
6. **Replicacion del log** — Client write → leader → followers
7. **Commit y durabilidad** — Majority ack = committed
8. **Garantias de seguridad** — Por que Raft es correcto
9. **Particiones de red** — Quorum previene split brain
10. **Nodo recuperado** — Rejoin + catch up del log
11. **Linearizability** — Consistencia fuerte
12. **Trade-offs** — Raft vs Paxos, CAP theorem

### Sessions
- **Session 10a:** Raft engine puro (election + RequestVote + timeout logic)
- **Session 10b:** Cluster visualizer SVG + controles + step mode
- **Session 10c:** Log replication (AppendEntries) + log visualizer + client writes
- **Session 10d:** Partitions + kill/heal + 12 lecciones completas

---

## Plan de ejecucion (waves paralelas)

Los playgrounds son independientes. Se pueden construir con multiples agentes simultaneos.

```
Wave 1 (4 agentes en paralelo):
  ├── Agent A: Session 7a (Latency Simulator - estructura + simulacion)
  ├── Agent B: Session 8a (Replication Lab - engine + layout)
  ├── Agent C: Session 9a (Partition Viz - hash + ring SVG)
  └── Agent D: Session 10a (Consensus - raft engine)

Wave 2 (4 agentes en paralelo):
  ├── Agent A: Session 7b (Latency - charts + lecciones)
  ├── Agent B: Session 8b (Replication - animaciones + interactividad)
  ├── Agent C: Session 9b (Partition - consistent hash + lecciones)
  └── Agent D: Session 10b (Consensus - cluster viz + controles)

Wave 3 (2 agentes en paralelo):
  ├── Agent B: Session 8c (Replication - violaciones + lecciones)
  └── Agent D: Session 10c (Consensus - log replication + viz)

Wave 4 (1 agente):
  └── Agent D: Session 10d (Consensus - partitions + lecciones)

Wave 5 (integracion):
  └── Actualizar routing (resource-card.tsx, learn page, BACKLOG.md)
```

---

## Integracion con routing existente

Actualizar estos archivos despues de completar los playgrounds:

1. **`src/app/library/resource-card.tsx`** — agregar IDs a `RESOURCES_WITH_LEARN_PAGES`
2. **`src/app/learn/[resourceId]/page.tsx`** — agregar a `PRACTICAL_ROUTES`:
   - `'ddia-ch1'` → `/playground/latency-simulator`
   - `'ddia-ch5'` → `/playground/replication-lab`
   - `'ddia-ch6'` → `/playground/partitioning`
   - `'ddia-ch8'` → `/playground/consensus`
   - `'ddia-ch9'` → `/playground/consensus`
3. **`src/app/learn/[resourceId]/questions/page.tsx`** — mismo mapeo en `NEXT_STEP`

---

## Verificacion por playground

Cada playground se verifica con:
1. `npm run build` — compila sin errores
2. Navegacion: `/playground/{name}` carga correctamente
3. Cada leccion se puede completar paso a paso
4. Visualizaciones responden a interacciones
5. Edge cases no crashean (rate=0, kill all nodes, empty state)

---

## Archivos de referencia (patrones existentes)

- `src/app/playground/storage-engine/engine-playground.tsx` — patron 3-panel layout
- `src/app/playground/storage-engine/lesson-guide.tsx` — patron de lecciones con steps
- `src/app/playground/storage-engine/state-inspector.tsx` — patron de visualizacion
- `src/app/playground/storage-engine/page.tsx` — patron de page wrapper con header
- `src/app/playground/storage-engine/command-terminal.tsx` — patron de terminal interactivo
