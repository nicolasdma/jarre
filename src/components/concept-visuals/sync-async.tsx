'use client';

import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

type Mode = 'sync' | 'async';
type Phase = 'idle' | 'write' | 'propagate' | 'ack' | 'confirm';

export function SyncAsyncVisual() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>('sync');
  const [phase, setPhase] = useState<Phase>('idle');

  const runCycle = useCallback(() => {
    const steps: { p: Phase; t: number }[] = [
      { p: 'write', t: 200 }, { p: 'propagate', t: 800 },
      { p: 'ack', t: 1400 }, { p: 'confirm', t: 2000 }, { p: 'idle', t: 3200 },
    ];
    const timeouts = steps.map(({ p, t }) => setTimeout(() => setPhase(p), t));
    return timeouts;
  }, []);

  useEffect(() => {
    let timeouts = runCycle();
    const interval = setInterval(() => { timeouts = runCycle(); }, 4000);
    return () => { clearInterval(interval); timeouts.forEach(clearTimeout); };
  }, [mode, runCycle]);

  const lanes = ['Cliente', 'Lider', 'F1 (sync)', 'F2 (async)'];
  const isSync = mode === 'sync';
  const showOk = isSync
    ? phase === 'confirm' || phase === 'ack'
    : phase !== 'idle' && phase !== 'write';

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {(['sync', 'async'] as Mode[]).map((modeOption) => (
            <button key={modeOption} onClick={() => setMode(modeOption)}
              className="font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 border transition-colors"
              style={{
                borderColor: mode === modeOption ? '#4a5d4a' : '#e8e6e0',
                color: mode === modeOption ? '#4a5d4a' : '#9c9a8e',
                backgroundColor: mode === modeOption ? 'rgba(74,93,74,0.06)' : 'transparent',
              }}
            >
              {modeOption === 'sync' ? 'Sincrono' : 'Asincrono'}
            </button>
          ))}
        </div>
        <div className="relative w-full" style={{ height: 160 }}>
          {lanes.map((label, i) => (
            <div key={label} className="absolute left-0 right-0 flex items-center" style={{ top: i * 38 }}>
              <span className="font-mono text-[10px] text-[#9c9a8e] w-16 shrink-0 text-right pr-2">
                {label}
              </span>
              <div className="relative flex-1 h-px bg-[#e8e6e0]">
                {i === 0 && phase !== 'idle' && (
                  <m.div className="absolute top-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#c4a07a', y: '-50%' }}
                    initial={{ left: '10%' }}
                    animate={reduced ? { left: phase === 'write' ? '10%' : '90%' } : { left: phase === 'write' ? '10%' : '90%' }}
                    transition={reduced ? { duration: 0 } : { duration: 0.4 }} />
                )}
                {i === 2 && (phase === 'propagate' || phase === 'ack' || phase === 'confirm') && (
                  <m.div className="absolute top-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#4a5d4a', y: '-50%' }}
                    initial={{ left: '10%' }}
                    animate={reduced ? { left: '70%' } : { left: '70%' }}
                    transition={reduced ? { duration: 0 } : { duration: 0.5 }} />
                )}
                {i === 3 && (phase === 'propagate' || phase === 'ack' || phase === 'confirm') && (
                  <m.div className="absolute top-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#9c9a8e', y: '-50%' }}
                    initial={{ left: '10%' }}
                    animate={reduced ? { left: '50%' } : { left: '50%' }}
                    transition={reduced ? { duration: 0 } : { duration: 0.8 }} />
                )}
                {i === 0 && showOk && (
                  <m.span className="absolute font-mono text-[10px] tracking-[0.1em]"
                    style={{ top: -14, right: 8, color: '#4a5d4a' }}
                    initial={{ opacity: 0 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1 }}
                    transition={reduced ? { duration: 0 } : undefined}>
                    OK
                  </m.span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="font-mono text-[10px] text-[#9c9a8e] text-center leading-relaxed max-w-xs">
          {isSync
            ? 'El lider espera confirmacion de F1 antes de responder al cliente'
            : 'El lider responde al cliente sin esperar confirmacion de los seguidores'}
        </p>
      </div>
    </LazyMotion>
  );
}
