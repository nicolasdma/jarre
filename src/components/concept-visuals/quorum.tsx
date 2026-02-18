'use client';

import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

const N = 5;
const W = 3;
const R = 3;
const NODE_IDS = ['n1', 'n2', 'n3', 'n4', 'n5'] as const;

export function QuorumVisual() {
  const reduced = useReducedMotion();
  const [alive, setAlive] = useState<boolean[]>([true, true, true, true, true]);

  const aliveCount = alive.filter(Boolean).length;
  const canWrite = aliveCount >= W;
  const canRead = aliveCount >= R;
  const quorumSatisfied = canWrite && canRead;

  const toggle = (i: number) => {
    setAlive((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col items-center gap-5">
        {/* Nodes */}
        <div className="flex gap-3">
          {alive.map((isAlive, idx) => {
            const nodeId = NODE_IDS[idx];
            return (
              <button key={nodeId} onClick={() => toggle(idx)} className="flex flex-col items-center gap-1">
                <m.div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-[10px] cursor-pointer select-none"
                  animate={reduced ? undefined : {
                    borderColor: isAlive ? '#4a5d4a' : '#e8e6e0',
                    color: isAlive ? '#4a5d4a' : '#9c9a8e',
                    backgroundColor: isAlive ? 'rgba(74, 93, 74, 0.08)' : '#faf9f6',
                  }}
                  whileHover={reduced ? undefined : { scale: 1.08 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                >
                  {isAlive ? `N${idx + 1}` : 'X'}
                </m.div>
              </button>
            );
          })}
        </div>

        {/* Formula */}
        <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.1em]">
          <span style={{ color: canWrite ? '#4a5d4a' : '#7d6b6b' }}>w={W}</span>
          <span className="text-[#9c9a8e]">+</span>
          <span style={{ color: canRead ? '#4a5d4a' : '#7d6b6b' }}>r={R}</span>
          <span className="text-[#9c9a8e]">&gt;</span>
          <span className="text-[#2c2c2c]">n={N}</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <m.div
            className="font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 border"
            animate={reduced ? undefined : {
              borderColor: quorumSatisfied ? '#4a5d4a' : '#7d6b6b',
              color: quorumSatisfied ? '#4a5d4a' : '#7d6b6b',
              backgroundColor: quorumSatisfied ? 'rgba(74, 93, 74, 0.06)' : 'rgba(125, 107, 107, 0.06)',
            }}
            transition={reduced ? { duration: 0 } : { duration: 0.25 }}
          >
            {quorumSatisfied ? 'Quorum OK' : 'Sin quorum'}
          </m.div>
          <span className="font-mono text-[10px] text-[#9c9a8e]">
            {aliveCount} de {N} activos
          </span>
        </div>

        {/* Write / Read sets */}
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#9c9a8e]">
              escritura
            </span>
            <div className="flex gap-1">
              {alive.map((isAlive, idx) => (
                <div
                  key={`write-${NODE_IDS[idx]}`}
                  className="w-3 h-3 rounded-full border"
                  style={{
                    borderColor: isAlive && idx < W ? '#c4a07a' : '#e8e6e0',
                    backgroundColor: isAlive && idx < W ? 'rgba(196, 160, 122, 0.2)' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#9c9a8e]">
              lectura
            </span>
            <div className="flex gap-1">
              {alive.map((isAlive, idx) => (
                <div
                  key={`read-${NODE_IDS[idx]}`}
                  className="w-3 h-3 rounded-full border"
                  style={{
                    borderColor: isAlive && idx >= N - R ? '#4a5d4a' : '#e8e6e0',
                    backgroundColor: isAlive && idx >= N - R ? 'rgba(74, 93, 74, 0.15)' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <span className="font-mono text-[10px] text-[#9c9a8e]">
          clic en un nodo para activar/desactivar
        </span>
      </div>
    </LazyMotion>
  );
}
