'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const BAR_WIDTH = 320;
const MAX_LAG = 80; // px representing max lag gap
const CYCLE_MS = 80;

export function ReplicationLagVisual() {
  const [lagPx, setLagPx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [readPos, setReadPos] = useState(0.7); // 0-1 normalized position along follower bar

  useEffect(() => {
    const interval = setInterval(() => {
      setLagPx((prev) => {
        const next = prev + direction * 1.5;
        if (next >= MAX_LAG) { setDirection(-1); return MAX_LAG; }
        if (next <= 0) { setDirection(1); return 0; }
        return next;
      });
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [direction]);

  // Read position oscillates slowly
  useEffect(() => {
    const interval = setInterval(() => {
      setReadPos((prev) => {
        const next = prev + 0.005;
        return next > 1 ? 0.5 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const leaderWidth = BAR_WIDTH;
  const followerWidth = BAR_WIDTH - lagPx;
  const lagSeconds = ((lagPx / MAX_LAG) * 4).toFixed(1);
  const readPosAbsolute = readPos * BAR_WIDTH;
  const isStale = readPosAbsolute > followerWidth;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Leader bar */}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] text-[#9c9a8e] w-14 text-right">Lider</span>
          <div className="relative" style={{ width: BAR_WIDTH, height: 12 }}>
            <motion.div
              className="absolute top-0 left-0 h-full"
              style={{ backgroundColor: '#4a5d4a', width: leaderWidth }}
            />
          </div>
        </div>

        {/* Follower bar */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] text-[#9c9a8e] w-14 text-right">Seguidor</span>
          <div className="relative" style={{ width: BAR_WIDTH, height: 12 }}>
            <div className="absolute top-0 left-0 h-full w-full" style={{ backgroundColor: '#e8e6e0' }} />
            <motion.div
              className="absolute top-0 left-0 h-full"
              style={{ backgroundColor: 'rgba(74, 93, 74, 0.5)' }}
              animate={{ width: followerWidth }}
              transition={{ duration: 0.08 }}
            />
            {/* Read marker */}
            <motion.div
              className="absolute top-0 flex flex-col items-center"
              animate={{ left: readPosAbsolute }}
              transition={{ duration: 0.1 }}
              style={{ top: -16 }}
            >
              <span
                className="font-mono text-[10px] whitespace-nowrap"
                style={{ color: isStale ? '#7d6b6b' : '#4a5d4a' }}
              >
                {isStale ? 'STALE' : 'OK'}
              </span>
              <div
                className="w-px h-7"
                style={{ backgroundColor: isStale ? '#7d6b6b' : '#4a5d4a' }}
              />
            </motion.div>
            {/* Lag zone label */}
            {lagPx > 20 && (
              <div
                className="absolute top-0 h-full flex items-center justify-center"
                style={{ left: followerWidth, width: lagPx }}
              >
                <span className="font-mono text-[8px] text-[#7d6b6b]">lag</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lag counter */}
      <motion.div
        className="font-mono text-[10px] tracking-[0.1em] px-3 py-1 border"
        animate={{
          borderColor: isStale ? '#7d6b6b' : '#e8e6e0',
          color: isStale ? '#7d6b6b' : '#9c9a8e',
        }}
        transition={{ duration: 0.15 }}
      >
        retraso: {lagSeconds}s
      </motion.div>

      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#9c9a8e]">
        retraso de replicacion
      </span>
    </div>
  );
}
