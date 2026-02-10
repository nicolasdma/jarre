'use client';

import type { RaftNodeSnapshot } from './raft-engine';

interface LogVisualizerProps {
  nodes: RaftNodeSnapshot[];
}

const STATE_COLORS: Record<string, string> = {
  follower: '#6b7280',
  candidate: '#d97706',
  leader: '#059669',
};

const STATE_BG: Record<string, string> = {
  follower: 'bg-gray-100',
  candidate: 'bg-amber-50',
  leader: 'bg-emerald-50',
};

export function LogVisualizer({ nodes }: LogVisualizerProps) {
  const maxLogLength = Math.max(...nodes.map((n) => n.log.length), 0);

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-4 py-2 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] text-[#888] tracking-wider uppercase">
          Logs Replicados
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {maxLogLength} {maxLogLength === 1 ? 'entry' : 'entries'} max
        </span>
      </div>

      {/* Log columns */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`flex-1 border-r border-j-border last:border-r-0 flex flex-col min-w-0 ${
              node.status === 'dead' ? 'opacity-40' : ''
            }`}
          >
            {/* Column header */}
            <div
              className={`px-2 py-1.5 border-b border-j-border flex items-center justify-between shrink-0 ${
                STATE_BG[node.state]
              }`}
            >
              <span className="font-mono text-[10px] text-j-text font-medium truncate">
                {node.id}
              </span>
              <span
                className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 ml-1"
                style={{
                  backgroundColor:
                    node.status === 'dead'
                      ? '#9ca3af'
                      : STATE_COLORS[node.state],
                }}
              >
                {node.status === 'dead'
                  ? 'DEAD'
                  : node.state.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Log entries (scrollable, newest on top) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1">
              {node.log.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="font-mono text-[9px] text-[#ccc]">
                    vacio
                  </span>
                </div>
              ) : (
                <div className="flex flex-col-reverse gap-0.5">
                  {node.log.map((entry) => {
                    const isCommitted = entry.index <= node.commitIndex;
                    return (
                      <div
                        key={entry.index}
                        className={`px-1.5 py-1 rounded font-mono text-[9px] flex items-center gap-1 ${
                          isCommitted
                            ? 'bg-emerald-100 border border-emerald-300'
                            : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`text-[8px] font-bold shrink-0 ${
                            isCommitted ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          [{entry.index}]
                        </span>
                        <span
                          className={`text-[8px] shrink-0 ${
                            isCommitted ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          T{entry.term}
                        </span>
                        <span
                          className={`truncate ${
                            isCommitted ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {entry.command}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Commit index footer */}
            <div className="px-2 py-1 border-t border-j-border shrink-0">
              <span className="font-mono text-[8px] text-[#999]">
                commit: {node.commitIndex}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
