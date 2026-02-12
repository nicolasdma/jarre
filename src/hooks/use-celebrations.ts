'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { XPResult } from '@/types';

export type CelebrationType =
  | 'daily_goal'
  | 'streak_milestone'
  | 'level_up'
  | 'mastery_advance';

export interface CelebrationEvent {
  type: CelebrationType;
  message: string;
  detail?: string;
}

const STREAK_MESSAGES: Record<number, string> = {
  3: '3 dias seguidos!',
  7: 'Una semana completa!',
  14: '2 semanas de racha!',
  30: '1 mes imparable!',
  50: '50 dias de dedicacion!',
  100: '100 dias — leyenda!',
};

/**
 * Derives celebration events from an XP result.
 */
export function deriveCelebrations(result: XPResult): CelebrationEvent[] {
  const events: CelebrationEvent[] = [];

  if (result.dailyGoalHit) {
    events.push({
      type: 'daily_goal',
      message: 'Meta diaria completada!',
      detail: `${result.dailyXp}/${result.dailyTarget} XP`,
    });
  }

  if (result.streakMilestone > 0) {
    events.push({
      type: 'streak_milestone',
      message: STREAK_MESSAGES[result.streakMilestone] ?? `${result.streakMilestone} dias!`,
      detail: `Racha de ${result.streakDays} dias`,
    });
  }

  if (result.levelUp) {
    events.push({
      type: 'level_up',
      message: `Nivel ${result.xpLevel}!`,
      detail: `${result.totalXp} XP total`,
    });
  }

  return events;
}

/**
 * Hook for managing a queue of celebration events with auto-dismiss.
 */
export function useCelebrations() {
  const [current, setCurrent] = useState<CelebrationEvent | null>(null);
  const queueRef = useRef<CelebrationEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = useCallback(() => {
    if (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      setCurrent(next);
      timerRef.current = setTimeout(() => {
        setCurrent(null);
        // Show next after a short gap
        setTimeout(showNext, 300);
      }, 3000);
    }
  }, []);

  const trigger = useCallback(
    (events: CelebrationEvent[]) => {
      if (events.length === 0) return;
      queueRef.current.push(...events);
      if (!current) showNext();
    },
    [current, showNext]
  );

  const triggerFromXP = useCallback(
    (result: XPResult) => {
      trigger(deriveCelebrations(result));
    },
    [trigger]
  );

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(null);
    setTimeout(showNext, 300);
  }, [showNext]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { current, trigger, triggerFromXP, dismiss };
}
