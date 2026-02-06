# Plan: Mini Redis Storage Engine (DDIA Ch3 - Learn by Doing)

## Resumen

Construir un storage engine compatible con Redis desde cero en TypeScript, integrado en Jarre como módulo interactivo. Implementa cada concepto del Capítulo 3 de DDIA de forma incremental.

## Arquitectura

Dos partes:

```
┌──────────────────────────────────┐
│     Browser: /playground/        │
│     storage-engine               │
│  ┌───────────┬──────────────┐    │
│  │ Terminal   │ Visualización│    │
│  │ SET/GET    │ B-Tree, LSM  │    │
│  │ DEL/PING   │ WAL, Bloom   │    │
│  └───────────┴──────────────┘    │
└────────────┬─────────────────────┘
             │ HTTP (fetch)
             ▼
┌──────────────────────────────────┐
│  Next.js API Routes (Bridge)     │
│  /api/playground/storage-engine/ │
│  - POST /command → envía RESP    │
│  - GET /state → lee estado       │
└────────┬───────────────┬─────────┘
         │ TCP:6380      │ TCP:6381
         │ (RESP)        │ (JSON debug)
         ▼               ▼
┌──────────────────────────────────┐
│    Engine Process (standalone)    │
│    TypeScript, zero dependencies  │
│    Compatible con redis-cli       │
│                                   │
│    Backends intercambiables:      │
│    - Append-Only Log              │
│    - Hash Index                   │
│    - LSM-Tree                     │
│    - B-Tree                       │
└──────────────────────────────────┘
```

- **Engine**: proceso Node.js standalone en `/engine/`, habla RESP protocol en port 6380 (compatible con `redis-cli`), expone estado interno en port 6381 (JSON).
- **Web UI**: React client components en `/playground/storage-engine/`, terminal + visualización de estructuras internas.
- **Bridge**: API routes de Next.js que conectan HTTP del browser → TCP del engine.

## Estructura de Archivos

```
jarre/
├── engine/                          # Standalone storage engine
│   ├── src/
│   │   ├── server.ts                # Entry point (TCP server)
│   │   ├── resp/
│   │   │   ├── parser.ts            # RESP protocol parser
│   │   │   ├── serializer.ts        # RESP response builder
│   │   │   └── types.ts
│   │   ├── commands/
│   │   │   ├── router.ts            # Command dispatch
│   │   │   ├── string-commands.ts   # SET, GET, DEL
│   │   │   ├── server-commands.ts   # PING, INFO, DBSIZE
│   │   │   └── debug-commands.ts    # INSPECT, BACKEND, CRASH
│   │   ├── storage/
│   │   │   ├── interface.ts         # StorageBackend interface
│   │   │   ├── append-log.ts        # Session 1
│   │   │   ├── hash-index.ts        # Session 2
│   │   │   ├── wal.ts               # Session 3
│   │   │   ├── memtable.ts          # Session 4
│   │   │   ├── sstable.ts           # Session 4
│   │   │   ├── lsm-tree.ts          # Session 5
│   │   │   ├── bloom-filter.ts      # Session 5
│   │   │   └── btree.ts             # Session 6
│   │   ├── debug/
│   │   │   ├── introspection.ts     # State → JSON
│   │   │   └── server.ts            # Debug TCP server
│   │   └── utils/
│   │       ├── file-io.ts
│   │       ├── crc32.ts
│   │       └── buffer-utils.ts
│   ├── data/                        # Runtime data (gitignored)
│   └── tsconfig.json
│
├── src/app/
│   ├── playground/
│   │   └── storage-engine/
│   │       ├── page.tsx              # Server component (auth)
│   │       ├── engine-playground.tsx  # Client: main orchestrator
│   │       ├── command-terminal.tsx   # Client: terminal input/output
│   │       ├── state-inspector.tsx    # Client: state visualization
│   │       └── visualizations/
│   │           ├── append-log-viz.tsx
│   │           ├── hash-index-viz.tsx
│   │           ├── btree-viz.tsx
│   │           ├── lsm-viz.tsx
│   │           ├── wal-viz.tsx
│   │           └── bloom-filter-viz.tsx
│   └── api/playground/storage-engine/
│       ├── command/route.ts          # POST: send command to engine
│       └── state/route.ts           # GET: fetch internal state
│
└── src/types/storage-engine.ts       # Shared types
```

## Interfaz Core del Engine

```typescript
interface StorageBackend {
  readonly name: string;
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<boolean>;
  size(): Promise<number>;
  flush(): Promise<void>;
  close(): Promise<void>;
  inspect(): Promise<BackendState>;  // Para visualización
}
```

Cada backend implementa `inspect()` que retorna su estado interno como JSON (memtable entries, SSTable metadata, B-Tree nodes, etc.).

---

## Sessions

### Session 1: RESP Protocol + Append-Only Log

**Concepto DDIA:** Append-only log — la forma más simple de almacenar datos. O(1) write, O(n) read.

**Qué se construye:**
- RESP parser/serializer (engine/src/resp/)
- TCP server en port 6380
- AppendLog backend: SET appends al final del archivo, GET escanea todo
- Comandos: SET, GET, DEL, PING, DBSIZE
- StorageBackend interface

**Archivos a crear:**
```
engine/tsconfig.json
engine/src/server.ts
engine/src/resp/types.ts
engine/src/resp/parser.ts
engine/src/resp/serializer.ts
engine/src/commands/router.ts
engine/src/commands/string-commands.ts
engine/src/commands/server-commands.ts
engine/src/storage/interface.ts
engine/src/storage/append-log.ts
engine/src/utils/file-io.ts
```

**Test:**
```bash
npx tsx engine/src/server.ts
redis-cli -p 6380
> PING
PONG
> SET user:1 "Nicolas"
OK
> GET user:1
"Nicolas"
> DEL user:1
(integer) 1
> DBSIZE
(integer) 0
```

**Insight:** Este backend es terrible para lecturas. Cada GET lee todo el archivo. Eso motiva la necesidad de índices (session 2).

---

### Session 2: Hash Index + Web UI Shell

**Concepto DDIA:** Hash index (modelo Bitcask). In-memory hashmap apuntando a offsets en disco.

**Qué se construye:**
- HashIndex backend: `Map<key, {offset, size}>` sobre el append log
- SET → escribe log + actualiza hashmap. GET → un solo disk seek. O(1) reads.
- Debug introspection server en port 6381 (JSON over TCP)
- Web UI shell: `/playground/storage-engine` con command terminal
- API routes bridge: HTTP → TCP
- Visualizaciones: append-log + hash-index

**Archivos a crear:**
```
engine/src/storage/hash-index.ts
engine/src/debug/introspection.ts
engine/src/debug/server.ts
engine/src/commands/debug-commands.ts
src/app/playground/storage-engine/page.tsx
src/app/playground/storage-engine/engine-playground.tsx
src/app/playground/storage-engine/command-terminal.tsx
src/app/playground/storage-engine/state-inspector.tsx
src/app/playground/storage-engine/hooks/use-engine.ts
src/app/playground/storage-engine/visualizations/append-log-viz.tsx
src/app/playground/storage-engine/visualizations/hash-index-viz.tsx
src/app/api/playground/storage-engine/command/route.ts
src/app/api/playground/storage-engine/state/route.ts
src/types/storage-engine.ts
```

**Test:**
- `redis-cli -p 6380` sigue funcionando
- Browser en `/playground/storage-engine` → terminal funcional
- SET en terminal → visualización muestra hash index actualizado

**Insight:** Hash index es O(1) read, pero todas las keys deben caber en RAM. No soporta range queries. Eso motiva estructuras ordenadas (session 4).

---

### Session 3: Write-Ahead Log (WAL) + Crash Recovery

**Concepto DDIA:** WAL — escribir la intención ANTES de ejecutar. Durabilidad ante crashes.

**Qué se construye:**
- WAL binario con CRC32 checksums
- Formato: `[4B length][4B CRC32][1B op_type][key_len][key][val_len][value]`
- Recovery: al iniciar, replay WAL para reconstruir estado
- Integración con HashIndex backend
- Comando `DEBUG CRASH` para simular crash sin cleanup
- Visualización de WAL en web UI

**Archivos a crear:**
```
engine/src/storage/wal.ts
engine/src/utils/crc32.ts
engine/src/utils/buffer-utils.ts
src/app/playground/storage-engine/visualizations/wal-viz.tsx
```

**Test:**
```bash
redis-cli -p 6380
> SET a 1
> SET b 2
> SET c 3
> DEBUG CRASH
# Engine muere
npx tsx engine/src/server.ts  # Restart
redis-cli -p 6380
> GET a
"1"  # ← Datos recuperados del WAL
```

**Insight:** Sin WAL, un crash pierde todo lo que estaba en memoria. El WAL es el seguro de vida de la base de datos.

---

### Session 4: Memtable + SSTable

**Concepto DDIA:** Memtable (estructura ordenada en RAM) + SSTable (archivo ordenado inmutable en disco). Fundamento del LSM-Tree.

**Qué se construye:**
- Memtable: BST balanceado implementado from scratch (red-black o AVL simplificado)
- SSTable writer: flush memtable → archivo ordenado con index block al final
- SSTable reader: binary search en el index block → seek al dato
- Flush automático cuando memtable alcanza threshold configurable
- Formato SSTable: `[data block][index block][footer: index_offset + metadata]`

**Archivos a crear:**
```
engine/src/storage/memtable.ts
engine/src/storage/sstable.ts
```

**Archivos a actualizar:**
```
src/app/playground/storage-engine/visualizations/lsm-viz.tsx (parcial)
```

**Test:**
- SET 20 keys (threshold = 10) → primera flush crea SSTable
- GET keys que están en memtable (RAM) vs SSTable (disco)
- Visualización muestra memtable llenándose y luego flush

**Insight:** Memtable da escrituras ordenadas en RAM. SSTable da lecturas ordenadas en disco. Juntos son la base del LSM-Tree.

---

### Session 5: LSM-Tree + Bloom Filters + Compaction

**Concepto DDIA:** LSM-Tree completo. Write-optimized. Compaction como mantenimiento de fondo.

**Qué se construye:**
- LSM-Tree backend: compone memtable + WAL + múltiples SSTables
- Read path: memtable → bloom filter → SSTables newest-first
- Size-tiered compaction: cuando hay N SSTables en un nivel, merge al siguiente
- Bloom filter: estructura probabilística (`definitely not here` vs `maybe here`)
- Visualización completa: memtable + SSTables + compaction animation + bloom bits

**Archivos a crear:**
```
engine/src/storage/lsm-tree.ts
engine/src/storage/bloom-filter.ts
src/app/playground/storage-engine/visualizations/bloom-filter-viz.tsx
```

**Read path detallado:**
```
GET key →
  1. Check memtable → found? return
  2. For each SSTable (newest first):
     a. Check bloom filter → "definitely not here"? skip
     b. Binary search index → seek to data
     c. Found? return
  3. Not found → return null
```

**Test:**
- SET 100+ keys → ver múltiples flushes
- Compaction ocurre automáticamente
- `DEBUG BLOOM key` muestra qué filtros dicen "maybe" vs "no"
- Visualización muestra SSTables mergeándose

**Insight:** LSM-Trees son write-optimized (I/O secuencial). El costo está en reads (múltiples SSTables). Bloom filters mitigan eso. Compaction es el janitor de fondo.

---

### Session 6: B-Tree

**Concepto DDIA:** B-Tree — read-optimized, O(log n) garantizado, pages de tamaño fijo, splits.

**Qué se construye:**
- B-Tree backend: orden configurable, pages en disco
- Node structure: keys + child pointers (internal) o keys + values (leaf)
- Insert con node splitting cuando está lleno
- Delete con merge/borrow
- WAL integration para crash safety
- Visualización interactiva del árbol con highlight del search path

**Formato de page (ej: 4KB):**
```
[1B node_type][2B key_count][keys con length prefix][values o child page IDs][padding]
```

**Archivos a crear:**
```
engine/src/storage/btree.ts
src/app/playground/storage-engine/visualizations/btree-viz.tsx
```

**Test:**
- `DEBUG BACKEND btree` → cambia a B-Tree
- SET keys → ver árbol crecer, splits
- GET → ver search path highlighted en la visualización

**Insight:** B-Trees son read-optimized (3-4 disk reads siempre). Writes son más caros por random I/O y splits. Opuesto a LSM-Tree. Este es el core del capítulo 3.

---

### Session 7: Benchmarks + Comparación + Polish

**Concepto DDIA:** Write amplification, read amplification, space amplification. Trade-offs.

**Qué se construye:**
- Comandos: `BENCH WRITE 1000`, `BENCH READ 1000`, `BENCH MIXED 1000`
- Vista comparativa: misma carga en todos los backends lado a lado
- Métricas: ops/sec, bytes escritos, disk reads por operación, uso de disco
- UI polish: estética Jarre, traducciones ES/EN, loading states, error handling
- Concept cards: explicaciones inline que linkan a `/learn/ddia-ch3`

**Tabla de comparación esperada:**

| Métrica | Append-Log | Hash Index | LSM-Tree | B-Tree |
|---------|-----------|-----------|----------|--------|
| Write speed | O(1) | O(1) | O(1) amort | O(log n) |
| Read speed | O(n) | O(1) | O(log n) * levels | O(log n) |
| Disk usage | Alto (dupes) | Alto | Medio (compaction) | Bajo |
| Range queries | No | No | Sí | Sí |
| Keys en RAM | No | Todas | Sparse index | No |

---

## Decisiones de Diseño

1. **Zero dependencies en el engine** — solo Node.js built-ins (net, fs, crypto, path, buffer). Cada estructura from scratch.
2. **Formatos binarios** — SSTables y B-Tree pages usan formato binario, no JSON. Se aprende a trabajar con buffers y offsets.
3. **Visualizaciones en SVG puro** — React + SVG, sin D3. Simple y coherente con la estética.
4. **Hot-swap de backends** — `DEBUG BACKEND <name>` cambia el backend en vivo.
5. **Engine como proceso separado** — se inicia con `npm run engine`. Si no está corriendo, la UI muestra instrucciones.

## Scripts

```json
{
  "engine": "tsx engine/src/server.ts",
  "engine:dev": "tsx watch engine/src/server.ts"
}
```

## Archivos Existentes a Reusar

- `src/app/resource/[resourceId]/split-pane-layout.tsx` — layout de paneles
- `src/app/api/notes/[resourceId]/canvas/route.ts` — patrón de API routes
- `src/app/learn/[resourceId]/ddia-ch3.tsx` — cross-link a explicaciones
- `src/lib/translations.ts` — agregar keys del playground

## Verificación por Session

1. `redis-cli -p 6380` → SET/GET/DEL funcionan
2. `npm run build` → Next.js compila sin errores
3. Browser en `/playground/storage-engine` → terminal y visualización funcionan
4. No hay regressions en el resto de Jarre
