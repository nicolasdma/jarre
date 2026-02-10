'use client';

interface ControlsPanelProps {
  mode: 'step' | 'auto';
  speed: number;
  tick: number;
  currentLeader: string | null;
  selectedNode: string | null;
  selectedNodeStatus: 'alive' | 'dead' | null;
  isPartitioned: boolean;
  onStep: () => void;
  onToggleMode: () => void;
  onSpeedChange: (speed: number) => void;
  onClientWrite: () => void;
  onKillNode: () => void;
  onRecoverNode: () => void;
  onPartition: () => void;
  onHeal: () => void;
  onReset: () => void;
}

export function ControlsPanel({
  mode,
  speed,
  tick,
  currentLeader,
  selectedNode,
  selectedNodeStatus,
  isPartitioned,
  onStep,
  onToggleMode,
  onSpeedChange,
  onClientWrite,
  onKillNode,
  onRecoverNode,
  onPartition,
  onHeal,
  onReset,
}: ControlsPanelProps) {
  return (
    <div className="px-4 py-3 bg-j-bg flex items-center gap-3 flex-wrap">
      {/* Step button — always prominent */}
      <button
        onClick={onStep}
        className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-mono text-[11px] tracking-wider transition-colors rounded"
      >
        STEP
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-j-border" />

      {/* Auto / Pause toggle */}
      <button
        onClick={onToggleMode}
        className={`px-3 py-1.5 font-mono text-[11px] tracking-wider transition-colors rounded border ${
          mode === 'auto'
            ? 'bg-[#991b1b] text-white border-[#991b1b]'
            : 'bg-white text-j-text border-j-border hover:border-[#991b1b] hover:text-[#991b1b]'
        }`}
      >
        {mode === 'auto' ? 'PAUSE' : 'AUTO'}
      </button>

      {/* Speed slider */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-[#a0a090] uppercase">
          Vel
        </span>
        <input
          type="range"
          min={100}
          max={2000}
          step={100}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-16 h-1 accent-[#991b1b]"
        />
        <span className="font-mono text-[9px] text-[#888] w-8">
          {speed}ms
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-j-border" />

      {/* Client Write */}
      <button
        onClick={onClientWrite}
        className="px-3 py-1.5 bg-white border border-j-border hover:border-[#059669] hover:text-[#059669] text-j-text font-mono text-[11px] tracking-wider transition-colors rounded"
      >
        WRITE
      </button>

      {/* Kill / Recover selected */}
      {selectedNode && selectedNodeStatus === 'alive' && (
        <button
          onClick={onKillNode}
          className="px-3 py-1.5 bg-white border border-j-border hover:border-red-400 hover:text-red-600 text-j-text font-mono text-[11px] tracking-wider transition-colors rounded"
        >
          KILL {selectedNode}
        </button>
      )}
      {selectedNode && selectedNodeStatus === 'dead' && (
        <button
          onClick={onRecoverNode}
          className="px-3 py-1.5 bg-white border border-j-border hover:border-emerald-400 hover:text-emerald-600 text-j-text font-mono text-[11px] tracking-wider transition-colors rounded"
        >
          RECOVER {selectedNode}
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-j-border" />

      {/* Partition / Heal */}
      {!isPartitioned ? (
        <button
          onClick={onPartition}
          className="px-3 py-1.5 bg-white border border-j-border hover:border-[#991b1b] hover:text-[#991b1b] text-j-text font-mono text-[11px] tracking-wider transition-colors rounded"
        >
          PARTITION
        </button>
      ) : (
        <button
          onClick={onHeal}
          className="px-3 py-1.5 bg-[#991b1b] text-white font-mono text-[11px] tracking-wider transition-colors rounded hover:bg-[#7f1d1d]"
        >
          HEAL
        </button>
      )}

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-3 py-1.5 bg-white border border-j-border hover:border-[#888] text-[#888] font-mono text-[11px] tracking-wider transition-colors rounded"
      >
        RESET
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicators */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-[#a0a090] uppercase">
            Tick
          </span>
          <span className="font-mono text-[12px] text-j-text font-bold tabular-nums">
            {tick}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-[#a0a090] uppercase">
            Leader
          </span>
          <span
            className={`font-mono text-[11px] font-bold ${
              currentLeader ? 'text-[#059669]' : 'text-[#9ca3af]'
            }`}
          >
            {currentLeader ?? 'ninguno'}
          </span>
        </div>
      </div>
    </div>
  );
}
