'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

type Phase = 'normal' | 'failure' | 'detecting' | 'electing' | 'promoted';
const PHASES: { phase: Phase; duration: number }[] = [
  { phase: 'normal', duration: 2000 },
  { phase: 'failure', duration: 1000 },
  { phase: 'detecting', duration: 2500 },
  { phase: 'electing', duration: 1200 },
  { phase: 'promoted', duration: 2000 },
];
const NODES = ['L', 'F1', 'F2'] as const;
const STATUS: Record<Phase, string> = {
  normal: 'sistema operativo', failure: 'fallo del lider detectado',
  detecting: 'detectando fallo...', electing: 'eligiendo nuevo lider...',
  promoted: 'F1 promovido a lider',
};

export function FailoverVisual() {
  const [phase, setPhase] = useState<Phase>('normal');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let mounted = true;
    const run = () => {
      let elapsed = 0;
      const timeouts: NodeJS.Timeout[] = [];
      PHASES.forEach(({ phase: p, duration }) => {
        timeouts.push(setTimeout(() => { if (mounted) setPhase(p); }, elapsed));
        elapsed += duration;
      });
      timeouts.push(setTimeout(() => { if (mounted) run(); }, elapsed));
      return timeouts;
    };
    const timeouts = run();
    return () => { mounted = false; timeouts.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (phase !== 'detecting') { setCountdown(3); return; }
    const t1 = setTimeout(() => setCountdown(2), 800);
    const t2 = setTimeout(() => setCountdown(1), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  const failed = phase !== 'normal';
  const promoted = phase === 'promoted';
  const statusLabel = phase === 'detecting' ? `timeout: ${countdown}...` : STATUS[phase];

  const nodeStyle = (id: string) => {
    if (id === 'L') return {
      borderColor: failed ? '#7d6b6b' : '#4a5d4a', color: failed ? '#7d6b6b' : '#4a5d4a',
      backgroundColor: failed ? 'rgba(125,107,107,0.08)' : 'rgba(74,93,74,0.08)', opacity: failed ? 0.5 : 1,
    };
    if (id === 'F1' && promoted) return {
      borderColor: '#c4a07a', color: '#c4a07a', backgroundColor: 'rgba(196,160,122,0.1)', opacity: 1,
    };
    return { borderColor: '#e8e6e0', color: '#9c9a8e', backgroundColor: '#faf9f6', opacity: 1 };
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-6">
        {NODES.map((id) => (
          <div key={id} className="flex flex-col items-center gap-1">
            <motion.div
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-[10px]"
              animate={nodeStyle(id)}
              transition={{ duration: 0.3 }}
            >
              {id === 'L' && failed ? 'X' : id === 'F1' && promoted ? 'L' : id}
            </motion.div>
            <span className="font-mono text-[10px] text-[#9c9a8e]">
              {id === 'L' ? 'Lider' : id === 'F1' && promoted ? 'Nuevo L' : id}
            </span>
          </div>
        ))}
      </div>
      <motion.div
        className="font-mono text-[10px] tracking-[0.1em] px-3 py-1 border"
        animate={{
          borderColor: phase === 'normal' || promoted ? '#4a5d4a' : '#c4a07a',
          color: phase === 'normal' || promoted ? '#4a5d4a' : '#c4a07a',
        }}
        transition={{ duration: 0.25 }}
      >
        {statusLabel}
      </motion.div>
      <div className="flex gap-1">
        {PHASES.map(({ phase: p }) => (
          <motion.div
            key={p} className="w-8 h-1"
            animate={{ backgroundColor: p === phase ? '#c4a07a' : '#e8e6e0' }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#9c9a8e]">
        failover automatico
      </span>
    </div>
  );
}
