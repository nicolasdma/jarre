'use client';

import { useState, useMemo } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = '#991b1b';

type Strategy = 'dp' | 'pp' | 'tp' | 'zero';

interface StrategyConfig {
  label: string;
  description: string;
}

const STRATEGIES: Record<Strategy, StrategyConfig> = {
  dp: { label: 'Data Parallelism', description: 'Copiar modelo, dividir datos' },
  pp: { label: 'Pipeline Parallelism', description: 'Dividir modelo por capas' },
  tp: { label: 'Tensor Parallelism', description: 'Dividir operaciones dentro de una capa' },
  zero: { label: 'ZeRO Optimizer', description: 'Eliminar redundancia de memoria' },
};

// Model size presets (in billions of parameters)
const MODEL_PRESETS = [
  { label: '7B', params: 7, layers: 32 },
  { label: '70B', params: 70, layers: 80 },
  { label: '175B', params: 175, layers: 96 },
  { label: '1T', params: 1000, layers: 128 },
];

// ---------------------------------------------------------------------------
// Computation helpers
// ---------------------------------------------------------------------------

/** Bytes per parameter for different components */
const BYTES_WEIGHTS_FP32 = 4;
const BYTES_WEIGHTS_FP16 = 2;
const BYTES_GRADIENTS = 4;
const BYTES_OPTIMIZER_ADAM = 8; // 2 momentum states × 4 bytes each

function computeMemoryDP(paramsBillions: number, gpus: number) {
  const paramsBytes = paramsBillions * 1e9;
  // Each GPU stores: full weights + full gradients + full optimizer states
  const perGpu = paramsBytes * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM);
  return {
    perGpuGB: perGpu / 1e9,
    totalGB: (perGpu * gpus) / 1e9,
    utilization: 1.0, // No bubbles in DP
    communicationVolume: (paramsBytes * BYTES_GRADIENTS) / 1e9, // AllReduce gradients per step
  };
}

function computeMemoryPP(paramsBillions: number, gpus: number, microbatches: number) {
  const paramsBytes = paramsBillions * 1e9;
  // Each GPU stores: 1/gpus of the model
  const perGpu = (paramsBytes / gpus) * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM);
  const bubbleFraction = (gpus - 1) / (microbatches + gpus - 1);
  return {
    perGpuGB: perGpu / 1e9,
    totalGB: (perGpu * gpus) / 1e9,
    utilization: 1 - bubbleFraction,
    bubbleFraction,
    communicationVolume: (paramsBytes * BYTES_WEIGHTS_FP16) / (gpus * 1e9), // Activations between stages
  };
}

function computeMemoryTP(paramsBillions: number, gpus: number) {
  const paramsBytes = paramsBillions * 1e9;
  // Each GPU stores: 1/gpus of each layer's weights
  const perGpu = (paramsBytes / gpus) * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM);
  return {
    perGpuGB: perGpu / 1e9,
    totalGB: (perGpu * gpus) / 1e9,
    utilization: 0.95, // ~5% overhead from AllReduce within layers
    communicationVolume: (paramsBytes * BYTES_WEIGHTS_FP16 * 2) / (gpus * 1e9), // 2 AllReduce per layer
  };
}

function computeMemoryZeRO(paramsBillions: number, gpus: number, stage: number) {
  const paramsBytes = paramsBillions * 1e9;
  let perGpu: number;
  switch (stage) {
    case 1:
      // Partition optimizer states only
      perGpu = paramsBytes * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM / gpus);
      break;
    case 2:
      // + Partition gradients
      perGpu = paramsBytes * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS / gpus + BYTES_OPTIMIZER_ADAM / gpus);
      break;
    case 3:
      // + Partition parameters
      perGpu = paramsBytes * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM) / gpus;
      break;
    default:
      perGpu = paramsBytes * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM);
  }
  return {
    perGpuGB: perGpu / 1e9,
    totalGB: (perGpu * gpus) / 1e9,
    utilization: stage === 3 ? 0.90 : 0.95, // Stage 3 has more AllGather overhead
    communicationVolume: stage === 3
      ? (paramsBytes * BYTES_WEIGHTS_FP16 * 2) / 1e9  // AllGather params + AllReduce gradients
      : (paramsBytes * BYTES_GRADIENTS) / 1e9, // AllReduce gradients
  };
}

// ---------------------------------------------------------------------------
// GPU Memory Bar Component
// ---------------------------------------------------------------------------

function GpuMemoryBar({ index, memoryGB, maxMemoryGB, gpuCapacity }: {
  index: number;
  memoryGB: number;
  maxMemoryGB: number;
  gpuCapacity: number;
}) {
  const fillPct = Math.min((memoryGB / maxMemoryGB) * 100, 100);
  const fits = memoryGB <= gpuCapacity;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-j-text-tertiary w-8 shrink-0">
        G{index}
      </span>
      <div className="flex-1 h-5 bg-j-bg-secondary rounded-sm overflow-hidden relative">
        <div
          className="h-full transition-all duration-500 rounded-sm"
          style={{
            width: `${fillPct}%`,
            backgroundColor: fits ? ACCENT : '#dc2626',
          }}
        />
        {/* Capacity line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-j-text/30"
          style={{ left: `${Math.min((gpuCapacity / maxMemoryGB) * 100, 100)}%` }}
        />
      </div>
      <span className={`font-mono text-[10px] w-14 text-right ${fits ? 'text-j-text-secondary' : 'text-red-600 font-medium'}`}>
        {memoryGB.toFixed(1)} GB
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Timeline Component
// ---------------------------------------------------------------------------

function PipelineTimeline({ gpus, microbatches }: { gpus: number; microbatches: number }) {
  const totalSlots = microbatches + gpus - 1;
  const cellWidth = Math.max(100 / totalSlots, 3);
  const bubbleFraction = (gpus - 1) / (microbatches + gpus - 1);

  return (
    <div className="mt-4 p-4 border border-j-border rounded-sm">
      <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-3">
        Pipeline Schedule (Forward Pass)
      </p>
      <div className="space-y-1">
        {Array.from({ length: Math.min(gpus, 8) }, (_, gpu) => (
          <div key={gpu} className="flex items-center gap-1">
            <span className="font-mono text-[9px] text-j-text-tertiary w-6 shrink-0">S{gpu}</span>
            <div className="flex gap-px flex-1">
              {Array.from({ length: totalSlots }, (_, slot) => {
                const mbIndex = slot - gpu;
                const isActive = mbIndex >= 0 && mbIndex < microbatches;
                return (
                  <div
                    key={slot}
                    className="h-4 rounded-[1px] transition-all duration-300"
                    style={{
                      width: `${cellWidth}%`,
                      backgroundColor: isActive ? ACCENT : '#f0efeb',
                      opacity: isActive ? 0.6 + (mbIndex / microbatches) * 0.4 : 1,
                    }}
                    title={isActive ? `Microbatch ${mbIndex}` : 'Bubble'}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-j-text-tertiary mt-2">
        Bubble fraction: <span className="text-j-text font-medium">{(bubbleFraction * 100).toFixed(1)}%</span>
        {' '}= ({gpus}-1)/({microbatches}+{gpus}-1)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DistributedTrainingPlayground() {
  const [strategy, setStrategy] = useState<Strategy>('dp');
  const [modelIdx, setModelIdx] = useState(0);
  const [gpuCount, setGpuCount] = useState(8);
  const [microbatches, setMicrobatches] = useState(16);
  const [zeroStage, setZeroStage] = useState(1);
  const [gpuCapacity, setGpuCapacity] = useState(80); // A100 80GB

  const model = MODEL_PRESETS[modelIdx];

  const metrics = useMemo(() => {
    switch (strategy) {
      case 'dp':
        return computeMemoryDP(model.params, gpuCount);
      case 'pp':
        return computeMemoryPP(model.params, gpuCount, microbatches);
      case 'tp':
        return computeMemoryTP(model.params, gpuCount);
      case 'zero':
        return computeMemoryZeRO(model.params, gpuCount, zeroStage);
    }
  }, [strategy, model.params, gpuCount, microbatches, zeroStage]);

  const fitsInGpu = metrics.perGpuGB <= gpuCapacity;
  const maxDisplayMemory = Math.max(metrics.perGpuGB * 1.2, gpuCapacity * 1.1);

  return (
    <PlaygroundLayout accentColor={ACCENT} disableTutor lessons={<LessonGuide />}>
      <div className="h-full overflow-y-auto p-6">
        {/* Strategy selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(Object.entries(STRATEGIES) as [Strategy, StrategyConfig][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStrategy(key)}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase border transition-colors ${
                strategy === key
                  ? 'border-[#991b1b] bg-[#991b1b]/10 text-[#991b1b]'
                  : 'border-j-border text-j-text-tertiary hover:border-j-text-secondary'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Model size */}
          <div className="p-4 border border-j-border rounded-sm">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">Modelo</p>
            <div className="flex gap-2">
              {MODEL_PRESETS.map((preset, i) => (
                <button
                  key={preset.label}
                  onClick={() => setModelIdx(i)}
                  className={`px-2 py-1 font-mono text-xs border transition-colors ${
                    modelIdx === i
                      ? 'border-[#991b1b] bg-[#991b1b]/10 text-[#991b1b]'
                      : 'border-j-border text-j-text-secondary hover:border-j-text-secondary'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-j-text-tertiary mt-2">
              {model.params}B params · {model.layers} layers ·{' '}
              {(model.params * BYTES_WEIGHTS_FP32).toFixed(0)} GB FP32
            </p>
          </div>

          {/* GPU count */}
          <div className="p-4 border border-j-border rounded-sm">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
              GPUs: {gpuCount}
            </p>
            <input
              type="range"
              min={2}
              max={128}
              step={2}
              value={gpuCount}
              onChange={(e) => setGpuCount(Number(e.target.value))}
              className="w-full accent-[#991b1b]"
            />
            <div className="flex justify-between font-mono text-[9px] text-j-text-tertiary mt-1">
              <span>2</span>
              <span>GPU Capacity: {gpuCapacity} GB</span>
              <span>128</span>
            </div>
          </div>
        </div>

        {/* Strategy-specific controls */}
        {strategy === 'pp' && (
          <div className="p-4 border border-j-border rounded-sm mb-6">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
              Microbatches: {microbatches}
            </p>
            <input
              type="range"
              min={1}
              max={64}
              value={microbatches}
              onChange={(e) => setMicrobatches(Number(e.target.value))}
              className="w-full accent-[#991b1b]"
            />
            <div className="flex justify-between font-mono text-[9px] text-j-text-tertiary mt-1">
              <span>1</span>
              <span>Recomendado: m ≥ 4d = {gpuCount * 4}</span>
              <span>64</span>
            </div>
          </div>
        )}

        {strategy === 'zero' && (
          <div className="p-4 border border-j-border rounded-sm mb-6">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
              ZeRO Stage
            </p>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setZeroStage(s)}
                  className={`px-3 py-1.5 font-mono text-xs border transition-colors ${
                    zeroStage === s
                      ? 'border-[#991b1b] bg-[#991b1b]/10 text-[#991b1b]'
                      : 'border-j-border text-j-text-secondary hover:border-j-text-secondary'
                  }`}
                >
                  Stage {s}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-j-text-tertiary mt-2">
              {zeroStage === 1 && 'Particiona optimizer states (8B/param → 8/N B/param)'}
              {zeroStage === 2 && '+ Particiona gradientes (4B/param → 4/N B/param)'}
              {zeroStage === 3 && '+ Particiona parametros (2B/param → 2/N B/param)'}
            </p>
          </div>
        )}

        {/* Metrics dashboard */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className={`p-3 border rounded-sm ${fitsInGpu ? 'border-j-border' : 'border-red-400 bg-red-50'}`}>
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase">Memoria/GPU</p>
            <p className={`font-mono text-lg ${fitsInGpu ? 'text-j-text' : 'text-red-600'}`}>
              {metrics.perGpuGB.toFixed(1)} GB
            </p>
            {!fitsInGpu && (
              <p className="font-mono text-[9px] text-red-500">Excede {gpuCapacity} GB</p>
            )}
          </div>
          <div className="p-3 border border-j-border rounded-sm">
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase">Utilizacion</p>
            <p className="font-mono text-lg text-j-text">
              {((metrics.utilization ?? 1) * 100).toFixed(0)}%
            </p>
          </div>
          <div className="p-3 border border-j-border rounded-sm">
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase">Comunicacion</p>
            <p className="font-mono text-lg text-j-text">
              {metrics.communicationVolume.toFixed(1)} GB
            </p>
          </div>
          <div className="p-3 border border-j-border rounded-sm">
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase">Total cluster</p>
            <p className="font-mono text-lg text-j-text">
              {metrics.totalGB.toFixed(0)} GB
            </p>
          </div>
        </div>

        {/* GPU memory visualization */}
        <div className="p-4 border border-j-border rounded-sm mb-6">
          <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-3">
            Memoria por GPU ({Math.min(gpuCount, 16)} de {gpuCount} mostradas)
          </p>
          <div className="space-y-1">
            {Array.from({ length: Math.min(gpuCount, 16) }, (_, i) => (
              <GpuMemoryBar
                key={i}
                index={i}
                memoryGB={metrics.perGpuGB}
                maxMemoryGB={maxDisplayMemory}
                gpuCapacity={gpuCapacity}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 font-mono text-[9px] text-j-text-tertiary">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ACCENT }} /> En uso
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-red-500" /> Excede capacidad
            </span>
            <span className="flex items-center gap-1">
              <div className="w-px h-3 bg-j-text/30" /> Limite GPU ({gpuCapacity} GB)
            </span>
          </div>
        </div>

        {/* Pipeline timeline (only for PP) */}
        {strategy === 'pp' && (
          <PipelineTimeline gpus={Math.min(gpuCount, 8)} microbatches={microbatches} />
        )}

        {/* Strategy explanation */}
        <div className="p-4 border border-j-border rounded-sm">
          <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
            {STRATEGIES[strategy].label}
          </p>
          <p className="text-sm text-j-text-secondary">
            {strategy === 'dp' && `Cada GPU almacena el modelo completo (${(model.params * (BYTES_WEIGHTS_FP16 + BYTES_GRADIENTS + BYTES_OPTIMIZER_ADAM)).toFixed(0)} GB) y procesa 1/${gpuCount} del batch. Gradientes se sincronizan via AllReduce. Simple pero limitado: el modelo debe caber en una sola GPU.`}
            {strategy === 'pp' && `El modelo de ${model.layers} capas se divide en ${gpuCount} stages de ${Math.ceil(model.layers / gpuCount)} capas cada uno. Cada stage procesa ${microbatches} microbatches. Bubble fraction: ${(((gpuCount - 1) / (microbatches + gpuCount - 1)) * 100).toFixed(1)}%.`}
            {strategy === 'tp' && `Cada capa se divide entre ${gpuCount} GPUs. Las matrices de peso se particionan por columnas/filas. Requiere 2 AllReduce por capa (4 con backward). Funciona mejor con NVLink (intra-nodo).`}
            {strategy === 'zero' && `ZeRO Stage ${zeroStage}: ${zeroStage >= 1 ? 'optimizer states particionados' : ''}${zeroStage >= 2 ? ' + gradientes particionados' : ''}${zeroStage >= 3 ? ' + parametros particionados' : ''}. Memoria por GPU: ${metrics.perGpuGB.toFixed(1)} GB (vs ${computeMemoryDP(model.params, gpuCount).perGpuGB.toFixed(1)} GB en DP puro).`}
          </p>
        </div>
      </div>
    </PlaygroundLayout>
  );
}
