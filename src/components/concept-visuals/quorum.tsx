'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const N = 5;
const W = 3;
const R = 3;

export function QuorumVisual() {
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
    <div className="flex flex-col items-center gap-5">
      {/* Nodes */}
      <div className="flex gap-3">
        {alive.map((isAlive, i) => (
          <button key={i} onClick={() => toggle(i)} className="flex flex-col items-center gap-1">
            <motion.div
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-[10px] cursor-pointer select-none"
              animate={{
                borderColor: isAlive ? '#4a5d4a' : '#e8e6e0',
                color: isAlive ? '#4a5d4a' : '#9c9a8e',
                backgroundColor: isAlive ? 'rgba(74, 93, 74, 0.08)' : '#faf9f6',
              }}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.2 }}
            >
              {isAlive ? `N${i + 1}` : 'X'}
            </motion.div>
          </button>
        ))}
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
        <motion.div
          className="font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 border"
          animate={{
            borderColor: quorumSatisfied ? '#4a5d4a' : '#7d6b6b',
            color: quorumSatisfied ? '#4a5d4a' : '#7d6b6b',
            backgroundColor: quorumSatisfied ? 'rgba(74, 93, 74, 0.06)' : 'rgba(125, 107, 107, 0.06)',
          }}
          transition={{ duration: 0.25 }}
        >
          {quorumSatisfied ? 'Quorum OK' : 'Sin quorum'}
        </motion.div>
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
            {alive.map((isAlive, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border"
                style={{
                  borderColor: isAlive && i < W ? '#c4a07a' : '#e8e6e0',
                  backgroundColor: isAlive && i < W ? 'rgba(196, 160, 122, 0.2)' : 'transparent',
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
            {alive.map((isAlive, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border"
                style={{
                  borderColor: isAlive && i >= N - R ? '#4a5d4a' : '#e8e6e0',
                  backgroundColor: isAlive && i >= N - R ? 'rgba(74, 93, 74, 0.15)' : 'transparent',
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
  );
}
