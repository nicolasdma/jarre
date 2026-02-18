'use client';

export interface EngineState {
  timestamp: string;
  uptimeMs: number;
  backend: {
    name: string;
    keyCount: number;
    details: Record<string, unknown>;
  };
}

interface StateInspectorProps {
  state: EngineState | null;
  status: 'connecting' | 'connected' | 'disconnected';
}

export function StateInspector({ state, status }: StateInspectorProps) {
  if (status === 'disconnected') {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border border-j-border flex items-center justify-center mx-auto mb-4">
            <span className="font-mono text-[#a0a090] text-lg">/</span>
          </div>
          <p className="font-mono text-xs text-j-text-secondary mb-2">Engine offline</p>
          <code className="font-mono text-[10px] text-[#a0a090] bg-[#f0efe8] px-2 py-1">
            npm run engine
          </code>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[11px] text-[#a0a090]">Loading...</span>
      </div>
    );
  }

  const { backend } = state;
  const details = backend.details;
  const isHashIndex = backend.name === 'hash-index';
  const isLSM = backend.name === 'lsm-tree';
  const isBTree = backend.name === 'b-tree';

  const badgeStyle = isBTree
    ? 'bg-[#e8f0f2] text-[#2d6a7a]'
    : isLSM
      ? 'bg-[#eee8f5] text-[#6b4f8a]'
      : isHashIndex
        ? 'bg-[#eef3ee] text-j-accent'
        : 'bg-[#f5f0e8] text-[#a08050]';

  const diagramBg = isBTree
    ? 'bg-[#f5f9fa] border-[#d0dfe4]'
    : isLSM
      ? 'bg-[#f9f7fc] border-[#ddd5e8]'
      : isHashIndex
        ? 'bg-[#f8faf8] border-[#dde5dd]'
        : 'bg-[#faf8f4] border-[#e8e0d0]';

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with backend name */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          State Inspector
        </span>
        <span className={`font-mono text-[11px] font-medium px-2 py-0.5 ${badgeStyle}`}>
          {backend.name}
        </span>
      </div>

      {/* How it works — diagram */}
      <div className={`px-5 py-4 border-b ${diagramBg}`}>
        {isBTree ? (
          <BTreeDiagram />
        ) : isLSM ? (
          <LSMTreeDiagram />
        ) : isHashIndex ? (
          <HashIndexDiagram />
        ) : (
          <AppendLogDiagram />
        )}
      </div>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-j-border">
        {isBTree ? (
          <BTreeStats details={details} uptimeMs={state.uptimeMs} />
        ) : isLSM ? (
          <LSMStats details={details} uptimeMs={state.uptimeMs} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Live Keys" value={String(backend.keyCount)} />
            <Stat
              label="Archivo"
              value={formatBytes(details.fileSizeBytes as number ?? 0)}
            />
            <Stat
              label="Records en disco"
              value={String(details.totalRecords ?? details.totalRecordsOnDisk ?? 0)}
            />
            <Stat label="Uptime" value={formatUptime(state.uptimeMs)} />
          </div>
        )}
      </div>

      {/* Backend-specific visualization */}
      {backend.name === 'append-log' && (
        <AppendLogViz details={details} />
      )}
      {backend.name === 'hash-index' && (
        <HashIndexViz details={details} />
      )}
      {backend.name === 'lsm-tree' && (
        <LSMTreeViz details={details} />
      )}
      {backend.name === 'b-tree' && (
        <BTreeViz details={details} />
      )}
    </div>
  );
}

// ── RAM vs SSD Diagrams ───────────────────────────────────────

function AppendLogDiagram() {
  return (
    <div>
      <p className="font-mono text-[10px] text-[#a08050] uppercase tracking-wider mb-3">
        Donde viven los datos
      </p>
      <div className="flex gap-2 mb-3">
        {/* RAM */}
        <div className="flex-1 border border-dashed border-[#ddd] bg-white px-2 py-2">
          <p className="font-mono text-[9px] text-[#bbb] uppercase tracking-wider mb-2">RAM</p>
          <p className="font-mono text-[10px] text-[#ccc] italic text-center py-3">
            vacia
          </p>
          <p className="font-mono text-[9px] text-[#ccc] text-center">
            no hay indice
          </p>
        </div>
        {/* SSD */}
        <div className="flex-1 border border-[#e8e0d0] bg-white px-2 py-2">
          <p className="font-mono text-[9px] text-[#a08050] uppercase tracking-wider mb-2">SSD (archivo)</p>
          <div className="space-y-0.5">
            <div className="bg-[#f5f0e8] px-1.5 py-0.5 font-mono text-[9px] text-[#888]">SET ciudad Madrid</div>
            <div className="bg-[#f5f0e8] px-1.5 py-0.5 font-mono text-[9px] text-[#888]">SET pais Peru</div>
            <div className="bg-[#fdf8f0] px-1.5 py-0.5 font-mono text-[9px] text-[#666] border-l-2 border-j-warm">SET ciudad Barcelona</div>
          </div>
        </div>
      </div>
      {/* GET explanation */}
      <div className="bg-white border border-[#e8e0d0] px-2 py-2">
        <p className="font-mono text-[10px] text-[#a08050] mb-1">GET ciudad →</p>
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          Lee record 3... no es. Lee record 2... no es. Lee record 1... si!
          <span className="text-[#c07070]"> Escanea TODOS los records.</span>
        </p>
      </div>
    </div>
  );
}

function HashIndexDiagram() {
  return (
    <div>
      <p className="font-mono text-[10px] text-j-accent uppercase tracking-wider mb-3">
        Donde viven los datos
      </p>
      <div className="flex gap-2 mb-3">
        {/* RAM */}
        <div className="flex-1 border border-[#dde5dd] bg-white px-2 py-2">
          <p className="font-mono text-[9px] text-j-accent uppercase tracking-wider mb-2">RAM (indice)</p>
          <div className="space-y-0.5">
            <div className="flex justify-between bg-[#f0f4f0] px-1.5 py-0.5 font-mono text-[9px]">
              <span className="text-j-text">ciudad</span>
              <span className="text-j-accent">→ byte 39</span>
            </div>
            <div className="flex justify-between bg-[#f0f4f0] px-1.5 py-0.5 font-mono text-[9px]">
              <span className="text-j-text">pais</span>
              <span className="text-j-accent">→ byte 21</span>
            </div>
          </div>
        </div>
        {/* SSD */}
        <div className="flex-1 border border-[#dde5dd] bg-white px-2 py-2">
          <p className="font-mono text-[9px] text-[#888] uppercase tracking-wider mb-2">SSD (archivo)</p>
          <div className="space-y-0.5">
            <div className="bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[9px] text-[#ccc]">SET ciudad Madrid</div>
            <div className="bg-[#f0f4f0] px-1.5 py-0.5 font-mono text-[9px] text-[#666] border-l-2 border-j-accent">SET pais Peru</div>
            <div className="bg-[#f0f4f0] px-1.5 py-0.5 font-mono text-[9px] text-[#666] border-l-2 border-j-accent">SET ciudad Barcelona</div>
          </div>
        </div>
      </div>
      {/* WAL explanation */}
      <div className="bg-white border border-[#5b6abf] border-dashed px-2 py-2 mb-2">
        <p className="font-mono text-[10px] text-[#5b6abf] mb-1">WAL (Write-Ahead Log)</p>
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          Cada SET escribe al WAL <span className="text-[#5b6abf]">antes</span> del log principal.
          Si el proceso muere, el WAL tiene los datos con checksum CRC32.
        </p>
      </div>
      {/* GET explanation */}
      <div className="bg-white border border-[#dde5dd] px-2 py-2">
        <p className="font-mono text-[10px] text-j-accent mb-1">GET ciudad →</p>
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          RAM dice "byte 39" → lee SOLO ese byte del disco.
          <span className="text-j-accent"> Siempre 1 lectura, sin importar el tamaño.</span>
        </p>
      </div>
    </div>
  );
}

// ── Append Log visualization ──────────────────────────────────

function AppendLogViz({ details }: { details: Record<string, unknown> }) {
  const records = (details.recentRecords ?? []) as Array<{
    type: string;
    key: string;
    value: string | null;
    offset: number;
    size: number;
  }>;

  const fileSizeBytes = details.fileSizeBytes as number ?? 0;
  const totalRecords = details.totalRecords as number;
  const liveKeys = details.liveKeys as number;

  if (records.length === 0) {
    return (
      <div className="px-5 py-4">
        <div className="border border-dashed border-[#ddd] px-4 py-8 text-center">
          <p className="font-mono text-xs text-[#999]">Archivo vacio — 0 bytes</p>
          <p className="font-mono text-[10px] text-[#bbb] mt-1">Haz SET key value para escribir</p>
        </div>
      </div>
    );
  }

  // Track which keys are "stale" (overwritten by a later record)
  const latestForKey = new Map<string, number>();
  for (let i = 0; i < records.length; i++) {
    latestForKey.set(records[i].key, i);
  }

  const wasteRatio = totalRecords > 0
    ? ((totalRecords - liveKeys) / totalRecords * 100).toFixed(0)
    : '0';

  return (
    <div className="px-5 py-4">
      {/* File header */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
          Archivo en disco
        </span>
        <span className="font-mono text-[10px] text-[#999]">
          {fileSizeBytes} bytes
        </span>
      </div>
      <p className="font-mono text-[10px] text-[#bbb] mb-3">
        engine/data/engine.log
      </p>

      {/* File visualization — stacked blocks */}
      <div className="border border-[#e0dfd8] bg-[#fcfcfa] mb-4">
        <div className="flex items-center justify-between px-2 py-1 bg-[#f0efe8] border-b border-[#e0dfd8]">
          <span className="font-mono text-[9px] text-[#aaa]">byte 0</span>
          <span className="font-mono text-[9px] text-[#aaa]">byte {fileSizeBytes}</span>
        </div>

        <div className="divide-y divide-[#eee]">
          {records.map((record, i) => {
            const isLatest = latestForKey.get(record.key) === i;
            const isDeleted = record.type === 'DEL';
            const isStale = !isLatest && !isDeleted;

            return (
              <div

                key={`record-${i}`}
                className={`px-2 py-1.5 font-mono text-[11px] ${
                  isDeleted
                    ? 'bg-[#fdf5f5]'
                    : isStale
                      ? 'bg-[#f9f8f4] opacity-50'
                      : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[#bbb] w-10 shrink-0 text-right tabular-nums">
                    {record.offset}
                  </span>
                  <span className="text-[#ddd]">|</span>
                  <span className={`text-[10px] w-7 shrink-0 ${
                    isDeleted ? 'text-[#c07070]' : 'text-j-accent'
                  }`}>
                    {record.type}
                  </span>
                  <span className={isStale ? 'text-[#bbb]' : 'text-[#555]'}>
                    {record.key}
                  </span>
                  {record.value !== null && (
                    <>
                      <span className="text-[#ddd]">=</span>
                      <span className={`truncate ${isStale ? 'text-[#ccc]' : 'text-[#888]'}`}>
                        {record.value}
                      </span>
                    </>
                  )}
                  <span className="ml-auto text-[9px] text-[#ccc] shrink-0 tabular-nums">
                    {record.size}B
                  </span>
                </div>
                {isStale && (
                  <span className="text-[9px] text-[#d4a07a] ml-12">
                    obsoleto — sobreescrito
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {totalRecords > records.length && (
        <p className="font-mono text-[10px] text-[#bbb] mb-3">
          ...mostrando ultimos {records.length} de {totalRecords}
        </p>
      )}

      {/* Waste indicator */}
      {totalRecords > liveKeys && (
        <div className="bg-[#fdf8f0] border border-[#ece0c8] px-3 py-2">
          <p className="font-mono text-[10px] text-[#a08050]">
            {wasteRatio}% del archivo son records obsoletos
          </p>
        </div>
      )}
    </div>
  );
}

// ── Hash Index visualization ──────────────────────────────────

function HashIndexViz({ details }: { details: Record<string, unknown> }) {
  const entries = (details.indexEntries ?? []) as Array<{
    key: string;
    offset: number;
    valueLength: number;
  }>;
  const totalDiskRecords = details.totalRecordsOnDisk as number ?? 0;
  const indexSize = details.indexSize as number ?? 0;
  const walState = details.wal as {
    fileSizeBytes: number;
    entryCount: number;
    corruptedCount: number;
    entries: Array<{
      type: string;
      key: string;
      value: string;
      offset: number;
      totalSize: number;
      checksumValid: boolean;
    }>;
  } | undefined;
  const lastWalRecoveryCount = details.lastWalRecoveryCount as number ?? 0;

  return (
    <div className="px-5 py-4">
      {/* WAL section */}
      <WALViz walState={walState} lastRecoveryCount={lastWalRecoveryCount} />

      {/* Index table */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
            Index en RAM
          </span>
          <span className="font-mono text-[10px] text-j-accent">
            Map&lt;key, offset&gt;
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="border border-dashed border-[#dde5dd] px-4 py-6 text-center">
            <p className="font-mono text-xs text-[#999]">Index vacio</p>
            <p className="font-mono text-[10px] text-[#bbb] mt-1">Haz SET key value</p>
          </div>
        ) : (
          <div className="border border-[#dde5dd] bg-[#fcfdfb]">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f4f0] border-b border-[#dde5dd] font-mono text-[9px] text-[#a0a090] uppercase">
              <span className="w-20 shrink-0">Key</span>
              <span className="text-center flex-1">→</span>
              <span className="w-14 shrink-0 text-right">Offset</span>
              <span className="w-14 shrink-0 text-right">Bytes</span>
            </div>
            {entries.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] border-b border-[#eef3ee] last:border-0"
              >
                <span className="w-20 shrink-0 text-j-text truncate font-medium">
                  {entry.key}
                </span>
                <span className="text-j-accent text-center flex-1">→</span>
                <span className="w-14 shrink-0 text-right text-j-accent tabular-nums">
                  byte {entry.offset}
                </span>
                <span className="w-14 shrink-0 text-right text-[#a0a090] tabular-nums">
                  {entry.valueLength}B
                </span>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && entries.length < indexSize && (
          <p className="font-mono text-[10px] text-[#bbb] mt-2">
            ...mostrando {entries.length} de {indexSize}
          </p>
        )}
      </div>

      {/* Disk waste comparison */}
      {totalDiskRecords > 0 && totalDiskRecords > indexSize && (
        <div className="bg-[#f8faf8] border border-[#dde5dd] px-3 py-2">
          <p className="font-mono text-[10px] text-[#666]">
            <span className="text-j-text font-medium">{indexSize}</span> keys en RAM,{' '}
            <span className="text-[#a08050]">{totalDiskRecords}</span> records en disco.{' '}
            <span className="text-[#999]">
              Los {totalDiskRecords - indexSize} extra son versiones viejas.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── LSM-Tree diagram ─────────────────────────────────────────

function LSMTreeDiagram() {
  return (
    <div>
      <p className="font-mono text-[10px] text-[#6b4f8a] uppercase tracking-wider mb-3">
        Como funciona el LSM-Tree
      </p>
      {/* Three layers */}
      <div className="space-y-1.5 mb-3">
        {/* RAM: Memtable */}
        <div className="border border-[#d5d0e8] bg-white px-2 py-2">
          <div className="flex items-center justify-between mb-1">
            <p className="font-mono text-[9px] text-[#6b4f8a] uppercase tracking-wider">RAM — Memtable</p>
            <p className="font-mono text-[9px] text-[#aaa]">ordenada</p>
          </div>
          <div className="flex gap-0.5">
            <div className="bg-[#f0edf8] px-1.5 py-0.5 font-mono text-[9px] text-[#6b4f8a]">a=1</div>
            <div className="bg-[#f0edf8] px-1.5 py-0.5 font-mono text-[9px] text-[#6b4f8a]">b=2</div>
            <div className="bg-[#f0edf8] px-1.5 py-0.5 font-mono text-[9px] text-[#6b4f8a]">c=3</div>
            <div className="font-mono text-[9px] text-[#ccc] px-1">...</div>
          </div>
        </div>
        {/* Arrow: flush */}
        <div className="text-center font-mono text-[9px] text-[#bbb]">
          ↓ flush cuando se llena ↓
        </div>
        {/* SSD: SSTables */}
        <div className="border border-[#ddd] bg-white px-2 py-2">
          <p className="font-mono text-[9px] text-[#888] uppercase tracking-wider mb-1">SSD — SSTables (inmutables)</p>
          <div className="space-y-0.5">
            <div className="bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[9px] text-[#888]">sst_2.sst: d→z (mas reciente)</div>
            <div className="bg-[#f8f8f5] px-1.5 py-0.5 font-mono text-[9px] text-[#bbb]">sst_1.sst: a→c (mas vieja)</div>
          </div>
        </div>
      </div>
      {/* Read explanation */}
      <div className="bg-white border border-[#d5d0e8] px-2 py-2 mb-1.5">
        <p className="font-mono text-[10px] text-[#6b4f8a] mb-1">GET key →</p>
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          1. Memtable → 2. <span className="text-[#4a8a4a]">Bloom filter</span> de cada SSTable → 3. Disco si &quot;maybe&quot;.
          <span className="text-[#6b4f8a]"> Primer resultado gana.</span>
        </p>
      </div>
      {/* Compaction hint */}
      <div className="bg-white border border-dashed border-[#d5d0e8] px-2 py-1.5">
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          <span className="text-[#5b7abf]">Compaction:</span> cuando hay 4+ SSTables,
          se fusionan en 1 (merge sort). Elimina duplicados y tombstones.
        </p>
      </div>
    </div>
  );
}

function LSMStats({ details, uptimeMs }: { details: Record<string, unknown>; uptimeMs: number }) {
  const memtable = details.memtable as {
    size: number; liveCount: number; sizeBytes: number; flushThreshold: number;
  } | undefined;
  const sstableCount = details.sstableCount as number ?? 0;
  const flushCount = details.flushCount as number ?? 0;
  const compactionCount = details.compactionCount as number ?? 0;
  const compactionThreshold = details.compactionThreshold as number ?? 4;
  const bloomStats = details.bloom as { totalNegatives: number; totalPositives: number } | undefined;

  const fillPercent = memtable
    ? Math.min(100, Math.round((memtable.size / memtable.flushThreshold) * 100))
    : 0;

  const totalBloomChecks = (bloomStats?.totalNegatives ?? 0) + (bloomStats?.totalPositives ?? 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Stat label="En Memtable" value={`${memtable?.size ?? 0} / ${memtable?.flushThreshold ?? 0}`} />
        <Stat label="SSTables" value={`${sstableCount} / ${compactionThreshold}`} />
        <Stat label="Flushes" value={String(flushCount)} />
        <Stat label="Compactions" value={String(compactionCount)} />
      </div>
      {/* Memtable fill bar */}
      {memtable && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] text-[#aaa] uppercase">Memtable</span>
            <span className="font-mono text-[9px] text-[#aaa]">{fillPercent}%</span>
          </div>
          <div className="h-2 bg-[#f0f0ec] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                fillPercent >= 90 ? 'bg-[#c07070]' : fillPercent >= 60 ? 'bg-[#c4a07a]' : 'bg-[#6b4f8a]'
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          {fillPercent >= 90 && (
            <p className="font-mono text-[9px] text-[#c07070] mt-1">
              Casi llena — proximo SET provoca flush a disco
            </p>
          )}
        </div>
      )}
      {/* Bloom filter stats */}
      {totalBloomChecks > 0 && (
        <div className="bg-[#f0f8f0] border border-[#d5e8d5] px-3 py-2">
          <p className="font-mono text-[9px] text-[#4a6a4a] uppercase tracking-wider mb-1">Bloom Filter</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <span className="text-[#4a8a4a]">
              {bloomStats?.totalNegatives ?? 0} skips
            </span>
            <span className="text-[#888]">
              {bloomStats?.totalPositives ?? 0} checks
            </span>
          </div>
          <p className="font-mono text-[9px] text-[#999] mt-0.5">
            {bloomStats?.totalNegatives ?? 0} lecturas de disco evitadas
          </p>
        </div>
      )}
    </div>
  );
}

// ── LSM-Tree visualization ───────────────────────────────────

function LSMTreeViz({ details }: { details: Record<string, unknown> }) {
  const memtable = details.memtable as {
    entries: Array<{ key: string; value: string; deleted: boolean }>;
    size: number;
    liveCount: number;
    flushThreshold: number;
  } | undefined;
  const sstables = (details.sstables ?? []) as Array<{
    filePath: string;
    fileSizeBytes: number;
    numRecords: number;
    numIndexEntries: number;
    minKey: string;
    maxKey: string;
    bloom?: {
      numBits: number;
      numHashes: number;
      bitsSet: number;
      falsePositiveRate: number;
    };
    bloomNegatives: number;
    bloomPositives: number;
    version: number;
    level: number;
  }>;
  const walState = details.wal as {
    fileSizeBytes: number;
    entryCount: number;
    corruptedCount: number;
    entries: Array<{
      type: string; key: string; value: string;
      offset: number; totalSize: number; checksumValid: boolean;
    }>;
  } | undefined;
  const lastWalRecoveryCount = details.lastWalRecoveryCount as number ?? 0;

  return (
    <div className="px-5 py-4">
      {/* WAL */}
      <WALViz walState={walState} lastRecoveryCount={lastWalRecoveryCount} />

      {/* Memtable */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
            Memtable (RAM)
          </span>
          <span className="font-mono text-[10px] text-[#6b4f8a]">
            {memtable?.size ?? 0} entradas (ordenadas)
          </span>
        </div>

        {memtable && memtable.entries.length > 0 ? (
          <div className="border border-[#d5d0e8] bg-[#fafaff]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0edf8] border-b border-[#d5d0e8] font-mono text-[9px] text-[#8888aa] uppercase">
              <span className="w-20 shrink-0">Key</span>
              <span className="flex-1">Value</span>
              <span className="w-12 shrink-0 text-right">Estado</span>
            </div>
            {memtable.entries.map((entry) => (
              <div
                key={entry.key}
                className={`flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] border-b border-[#eeedf8] last:border-0 ${
                  entry.deleted ? 'bg-[#fdf5f5]' : ''
                }`}
              >
                <span className="w-20 shrink-0 text-j-text truncate font-medium">
                  {entry.key}
                </span>
                <span className={`flex-1 truncate ${entry.deleted ? 'text-[#c07070] line-through' : 'text-[#666]'}`}>
                  {entry.deleted ? '(tombstone)' : entry.value}
                </span>
                <span className={`w-12 shrink-0 text-right text-[9px] ${
                  entry.deleted ? 'text-[#c07070]' : 'text-[#6b4f8a]'
                }`}>
                  {entry.deleted ? 'DEL' : 'LIVE'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#d5d0e8] px-4 py-4 text-center">
            <p className="font-mono text-[10px] text-[#aaa]">Memtable vacia</p>
            <p className="font-mono text-[9px] text-[#ccc] mt-1">Haz SET para agregar datos</p>
          </div>
        )}
      </div>

      {/* SSTables */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
            SSTables (Disco)
          </span>
          <span className="font-mono text-[10px] text-[#888]">
            {sstables.length} archivo{sstables.length !== 1 ? 's' : ''}
          </span>
        </div>

        {sstables.length > 0 ? (
          <div className="space-y-1.5">
            {sstables.map((sst, i) => {
              const fileName = sst.filePath.split('/').pop() ?? sst.filePath;
              const isNewest = i === sstables.length - 1;
              const isCompacted = sst.level > 0;
              return (
                <div
                  key={sst.filePath}
                  className={`border px-3 py-2 ${
                    isCompacted
                      ? 'border-[#d0d8e8] bg-[#f8faff]'
                      : isNewest
                        ? 'border-[#d5d0e8] bg-[#fafaff]'
                        : 'border-j-border bg-[#fcfcfa]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#555] font-medium">
                        {fileName}
                      </span>
                      {isCompacted && (
                        <span className="font-mono text-[8px] text-[#5b7abf] bg-[#eef0f8] px-1 py-0.5">
                          compacted
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[9px] text-[#aaa]">
                      {formatBytes(sst.fileSizeBytes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[9px] text-[#999]">
                    <span>{sst.numRecords} records</span>
                    <span className="text-[#ddd]">|</span>
                    <span>{sst.numIndexEntries} idx</span>
                    <span className="text-[#ddd]">|</span>
                    <span>{sst.minKey} → {sst.maxKey}</span>
                  </div>
                  {/* Bloom filter info */}
                  {sst.bloom && (
                    <div className="flex items-center gap-3 font-mono text-[9px] mt-1">
                      <span className="text-[#4a8a4a]">
                        bloom: {sst.bloom.numBits}bit
                      </span>
                      <span className="text-[#999]">
                        {sst.bloom.bitsSet}/{sst.bloom.numBits} set
                      </span>
                      <span className="text-j-warm">
                        FP: {(sst.bloom.falsePositiveRate * 100).toFixed(1)}%
                      </span>
                      {(sst.bloomNegatives > 0 || sst.bloomPositives > 0) && (
                        <span className="text-[#4a8a4a]">
                          {sst.bloomNegatives} skip{sst.bloomNegatives !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                  {isNewest && !isCompacted && (
                    <span className="font-mono text-[9px] text-[#6b4f8a] mt-1 inline-block">
                      mas reciente — se busca primero
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-j-border px-4 py-4 text-center">
            <p className="font-mono text-[10px] text-[#aaa]">Sin SSTables todavia</p>
            <p className="font-mono text-[9px] text-[#ccc] mt-1">
              Cuando la memtable se llene, se escribe un SSTable
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WAL visualization ────────────────────────────────────────

function WALViz({ walState, lastRecoveryCount }: {
  walState: {
    fileSizeBytes: number;
    entryCount: number;
    corruptedCount: number;
    entries: Array<{
      type: string;
      key: string;
      value: string;
      offset: number;
      totalSize: number;
      checksumValid: boolean;
    }>;
  } | undefined;
  lastRecoveryCount: number;
}) {
  if (!walState) return null;

  const hasEntries = walState.entryCount > 0;
  const hasCorruption = walState.corruptedCount > 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
          Write-Ahead Log
        </span>
        <span className={`font-mono text-[10px] px-2 py-0.5 ${
          hasEntries
            ? 'bg-[#eeedf8] text-[#5b6abf]'
            : hasCorruption
              ? 'bg-[#fdf0f0] text-[#c07070]'
              : 'bg-[#f0f0ec] text-[#aaa]'
        }`}>
          {hasEntries ? `${walState.entryCount} pendiente${walState.entryCount !== 1 ? 's' : ''}` : hasCorruption ? 'corrupto' : 'limpio'}
        </span>
      </div>

      {/* Last recovery info */}
      {lastRecoveryCount > 0 && (
        <div className="bg-[#eeedf8] border border-[#d5d3ee] px-3 py-2 mb-2">
          <p className="font-mono text-[10px] text-[#5b6abf]">
            Ultimo inicio: {lastRecoveryCount} entrada{lastRecoveryCount !== 1 ? 's' : ''} recuperada{lastRecoveryCount !== 1 ? 's' : ''} del WAL
          </p>
        </div>
      )}

      {/* WAL entries */}
      {hasEntries ? (
        <div className="border border-[#d5d3ee] bg-[#fafaff]">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f0eff8] border-b border-[#d5d3ee] font-mono text-[9px] text-[#8888aa] uppercase">
            <span className="w-10 shrink-0">Byte</span>
            <span className="w-7 shrink-0">Op</span>
            <span className="flex-1">Key = Value</span>
            <span className="w-10 shrink-0 text-right">CRC</span>
          </div>
          {walState.entries.map((entry) => (
            <div
              key={`wal-${entry.offset}`}
              className={`flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] border-b border-[#eeedf8] last:border-0 ${
                entry.checksumValid ? '' : 'bg-[#fdf5f5]'
              }`}
            >
              <span className="w-10 shrink-0 text-[9px] text-[#bbb] tabular-nums">
                {entry.offset}
              </span>
              <span className={`w-7 shrink-0 text-[10px] ${
                entry.type === 'DEL' ? 'text-[#c07070]' : 'text-[#5b6abf]'
              }`}>
                {entry.type}
              </span>
              <span className="flex-1 text-[#555] truncate">
                {entry.key}{entry.type === 'SET' ? ` = ${entry.value}` : ''}
              </span>
              <span className={`w-10 shrink-0 text-right text-[9px] ${
                entry.checksumValid ? 'text-j-accent' : 'text-[#c07070]'
              }`}>
                {entry.checksumValid ? 'OK' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`border border-dashed px-3 py-3 text-center ${
          hasCorruption ? 'border-[#e0c0c0] bg-[#fdf8f8]' : 'border-[#d5d3ee]'
        }`}>
          <p className="font-mono text-[10px] text-[#aaa]">
            {hasCorruption
              ? `WAL corrupto — ${walState.corruptedCount} entrada${walState.corruptedCount !== 1 ? 's' : ''} no valida${walState.corruptedCount !== 1 ? 's' : ''}`
              : 'WAL vacio — haz SET para ver entradas acumularse'}
          </p>
          {!hasCorruption && (
            <p className="font-mono text-[9px] text-[#ccc] mt-1">
              DEBUG WAL CHECKPOINT para limpiar
            </p>
          )}
        </div>
      )}

      {/* WAL file size */}
      {walState.fileSizeBytes > 0 && (
        <p className="font-mono text-[9px] text-[#bbb] mt-1">
          engine.wal — {walState.fileSizeBytes} bytes
        </p>
      )}
    </div>
  );
}

// ── B-Tree diagram ────────────────────────────────────────────

function BTreeDiagram() {
  return (
    <div>
      <p className="font-mono text-[10px] text-[#2d6a7a] uppercase tracking-wider mb-3">
        Como funciona el B-Tree
      </p>
      <div className="space-y-1.5 mb-3">
        {/* Disk: Pages */}
        <div className="border border-[#c0d8e0] bg-white px-2 py-2">
          <div className="flex items-center justify-between mb-1">
            <p className="font-mono text-[9px] text-[#2d6a7a] uppercase tracking-wider">SSD — Paginas de 4 KB</p>
            <p className="font-mono text-[9px] text-[#aaa]">acceso aleatorio</p>
          </div>
          <div className="space-y-0.5">
            <div className="bg-[#e8f0f2] px-1.5 py-0.5 font-mono text-[9px] text-[#2d6a7a] text-center">
              Pagina 3 (raiz): [ d ]
            </div>
            <div className="flex gap-0.5">
              <div className="flex-1 bg-[#f0f6f8] px-1.5 py-0.5 font-mono text-[9px] text-[#555] text-center">
                Pag 1: [a, b, c]
              </div>
              <div className="flex-1 bg-[#f0f6f8] px-1.5 py-0.5 font-mono text-[9px] text-[#555] text-center">
                Pag 2: [d, e]
              </div>
            </div>
          </div>
        </div>
        {/* Key difference */}
        <div className="text-center font-mono text-[9px] text-[#bbb]">
          ↕ modificacion IN-PLACE (reescribe la pagina) ↕
        </div>
        {/* Contrast */}
        <div className="bg-white border border-dashed border-[#c0d8e0] px-2 py-2">
          <p className="font-mono text-[9px] text-[#999] leading-relaxed">
            <span className="text-[#2d6a7a]">vs LSM-Tree:</span> el B-Tree
            SOBREESCRIBE paginas existentes en lugar de crear archivos nuevos.
            No necesita compaction, pero reescribe 4 KB por cada cambio.
          </p>
        </div>
      </div>
      {/* Read explanation */}
      <div className="bg-white border border-[#c0d8e0] px-2 py-2 mb-1.5">
        <p className="font-mono text-[10px] text-[#2d6a7a] mb-1">GET key →</p>
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          Raiz → busqueda binaria → hijo correcto → ... → hoja.
          <span className="text-[#2d6a7a]"> Siempre O(log n) — predecible.</span>
        </p>
      </div>
      {/* Write explanation */}
      <div className="bg-white border border-[#c0d8e0] px-2 py-2">
        <p className="font-mono text-[10px] text-[#2d6a7a] mb-1">SET key value →</p>
        <p className="font-mono text-[9px] text-[#999] leading-relaxed">
          Encuentra la hoja → inserta ordenado → si se desborda →
          <span className="text-[#c07070]"> split (divide la pagina en 2).</span>
        </p>
      </div>
    </div>
  );
}

function BTreeStats({ details, uptimeMs }: { details: Record<string, unknown>; uptimeMs: number }) {
  const height = details.height as number ?? 1;
  const totalPages = details.totalPages as number ?? 2;
  const splitCount = details.splitCount as number ?? 0;
  const fileSizeBytes = details.fileSizeBytes as number ?? 0;
  const keyCount = details.keyCount as number ?? 0;
  const maxKeysPerNode = details.maxKeysPerNode as number ?? 4;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Live Keys" value={String(keyCount)} />
      <Stat label="Altura" value={String(height)} />
      <Stat label="Paginas" value={String(totalPages)} />
      <Stat label="Splits" value={String(splitCount)} />
      <Stat label="Archivo" value={formatBytes(fileSizeBytes)} />
      <Stat label="Uptime" value={formatUptime(uptimeMs)} />
    </div>
  );
}

// ── B-Tree visualization ──────────────────────────────────────

function BTreeViz({ details }: { details: Record<string, unknown> }) {
  const nodes = (details.nodes ?? []) as Array<{
    pageId: number;
    type: 'leaf' | 'internal';
    keys: string[];
    values?: string[];
    childIds?: number[];
    level: number;
  }>;
  const maxKeysPerNode = details.maxKeysPerNode as number ?? 4;
  const walState = details.wal as {
    fileSizeBytes: number;
    entryCount: number;
    corruptedCount: number;
    entries: Array<{
      type: string; key: string; value: string;
      offset: number; totalSize: number; checksumValid: boolean;
    }>;
  } | undefined;
  const lastWalRecoveryCount = details.lastWalRecoveryCount as number ?? 0;

  // Group nodes by level for level-by-level rendering
  const levels = new Map<number, typeof nodes>();
  for (const node of nodes) {
    const level = levels.get(node.level) ?? [];
    level.push(node);
    levels.set(node.level, level);
  }
  const sortedLevels = Array.from(levels.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="px-5 py-4">
      {/* WAL */}
      <WALViz walState={walState} lastRecoveryCount={lastWalRecoveryCount} />

      {/* Tree structure */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
            Arbol en disco
          </span>
          <span className="font-mono text-[10px] text-[#2d6a7a]">
            {nodes.length} pagina{nodes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {nodes.length === 0 || (nodes.length === 1 && nodes[0].keys.length === 0) ? (
          <div className="border border-dashed border-[#c0d8e0] px-4 py-6 text-center">
            <p className="font-mono text-xs text-[#999]">Arbol vacio</p>
            <p className="font-mono text-[10px] text-[#bbb] mt-1">Haz SET key value para insertar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLevels.map(([level, levelNodes]) => (
              <div key={level}>
                <p className="font-mono text-[9px] text-[#aaa] uppercase tracking-wider mb-1.5">
                  Nivel {level} {level === 0 ? '(raiz)' : ''}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {levelNodes.map((node) => (
                    <BTreeNodeBox
                      key={node.pageId}
                      node={node}
                      maxKeys={maxKeysPerNode}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BTreeNodeBox({ node, maxKeys }: {
  node: {
    pageId: number;
    type: 'leaf' | 'internal';
    keys: string[];
    values?: string[];
    childIds?: number[];
  };
  maxKeys: number;
}) {
  const utilization = node.keys.length / maxKeys;
  const utilizationPercent = Math.round(utilization * 100);
  const isLeaf = node.type === 'leaf';

  return (
    <div className={`border px-3 py-2 min-w-[140px] ${
      isLeaf
        ? 'border-[#c0d8e0] bg-[#f8fbfc]'
        : 'border-[#a0c8d4] bg-[#f0f6f8]'
    }`}>
      {/* Header: page id + type */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] text-[#2d6a7a] font-medium">
          Pag {node.pageId}
        </span>
        <span className={`font-mono text-[8px] px-1 py-0.5 ${
          isLeaf
            ? 'text-[#4a8a4a] bg-[#eef5ee]'
            : 'text-[#2d6a7a] bg-[#e0eef2]'
        }`}>
          {isLeaf ? 'hoja' : 'interno'}
        </span>
      </div>

      {/* Keys */}
      {node.keys.length > 0 ? (
        <div className="space-y-0.5 mb-1.5">
          {node.keys.map((key, keyIdx) => (
            <div key={key} className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-j-text font-medium">{key}</span>
              {isLeaf && node.values && (
                <>
                  <span className="text-[#ccc]">=</span>
                  <span className="text-[#666] truncate">{node.values[keyIdx]}</span>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-[9px] text-[#ccc] italic mb-1.5">vacia</p>
      )}

      {/* Child pointers for internal nodes */}
      {!isLeaf && node.childIds && (
        <div className="flex gap-1 mb-1.5">
          {node.childIds.map((childId) => (
            <span key={childId} className="font-mono text-[8px] text-[#2d6a7a] bg-[#e0eef2] px-1 py-0.5">
              →{childId}
            </span>
          ))}
        </div>
      )}

      {/* Utilization bar */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono text-[8px] text-[#bbb]">
            {node.keys.length}/{maxKeys}
          </span>
          <span className="font-mono text-[8px] text-[#bbb]">
            {utilizationPercent}%
          </span>
        </div>
        <div className="h-1 bg-[#eee] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              utilization >= 1 ? 'bg-[#c07070]' : utilization >= 0.75 ? 'bg-[#c4a07a]' : 'bg-[#2d6a7a]'
            }`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f5f5f0] px-3 py-2">
      <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
        {label}
      </p>
      <p className="font-mono text-sm text-j-text mt-0.5">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
