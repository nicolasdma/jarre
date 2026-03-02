'use client';

import { useState } from 'react';
import { PricingModal } from '@/components/billing/pricing-modal';

interface PlanBannerProps {
  status: string;
  used: number;
  limit: number;
  voiceMinutesUsed?: number;
  voiceMinutesLimit?: number;
  variant?: 'inline' | 'card';
  showAlways?: boolean;
  language?: 'es' | 'en';
}

export function PlanBanner({
  status,
  used,
  limit,
  voiceMinutesUsed,
  voiceMinutesLimit,
  variant = 'inline',
  showAlways = false,
  language = 'es',
}: PlanBannerProps) {
  const [showPricing, setShowPricing] = useState(false);
  const isActive = status === 'active';
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isLow = percent >= 80;
  const exceeded = used >= limit;
  const tokensBarWidth = Math.max(Math.min(percent, 100), 2);

  const labels = language === 'es'
    ? {
        planPro: 'Pro',
        planFree: 'Free',
        tokens: 'Tokens',
        voice: 'Voz',
        monthlyUsage: 'Consumo mensual',
        used: 'usado',
        upgrade: 'Upgrade',
      }
    : {
        planPro: 'Pro',
        planFree: 'Free',
        tokens: 'Tokens',
        voice: 'Voice',
        monthlyUsage: 'Monthly usage',
        used: 'used',
        upgrade: 'Upgrade',
      };

  // Pro users who aren't low on tokens — don't show anything
  if (!showAlways && isActive && !isLow) return null;

  const voiceHasLimit = voiceMinutesLimit != null && voiceMinutesLimit !== Infinity;
  const voiceUsedValue = voiceMinutesUsed ?? 0;
  const voicePercent = voiceHasLimit
    ? Math.max(0, Math.min(100, Math.round((voiceUsedValue / (voiceMinutesLimit || 1)) * 100)))
    : 0;

  if (variant === 'card') {
    return (
      <div className="w-full border border-j-border bg-j-surface/70 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-j-text-tertiary">
            {labels.monthlyUsage}
          </p>
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${isActive ? 'text-j-accent' : 'text-j-text-secondary'}`}>
            {isActive ? labels.planPro : labels.planFree}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary">
              {labels.tokens}
            </span>
            <span className={`font-mono text-[11px] ${exceeded ? 'text-j-error' : 'text-j-text-secondary'}`}>
              {formatK(used)}/{formatK(limit)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-j-border/80">
            <div
              className={`h-full transition-all duration-500 ${exceeded || isLow ? 'bg-j-error' : 'bg-j-accent'}`}
              style={{ width: `${tokensBarWidth}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-j-text-tertiary">
            {percent}% {labels.used}
          </p>
        </div>

        {!isActive && voiceHasLimit && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary">
                {labels.voice}
              </span>
              <span className={`font-mono text-[11px] ${voiceUsedValue >= voiceMinutesLimit ? 'text-j-error' : 'text-j-text-secondary'}`}>
                {voiceUsedValue}/{voiceMinutesLimit}m
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden bg-j-border/80">
              <div
                className={`h-full transition-all duration-500 ${voiceUsedValue >= voiceMinutesLimit ? 'bg-j-error' : 'bg-j-accent'}`}
                style={{ width: `${Math.max(Math.min(voicePercent, 100), 2)}%` }}
              />
            </div>
          </div>
        )}

        {!isActive && (
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => setShowPricing(true)}
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-accent hover:underline"
            >
              {labels.upgrade}
            </button>
            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-j-text-tertiary">
      <span className={`uppercase tracking-[0.15em] ${isActive ? 'text-j-accent' : ''}`}>
        {isActive ? labels.planPro : labels.planFree}
      </span>
      <span className="text-j-border">·</span>
      <span className={exceeded ? 'text-red-400' : ''}>
        {formatK(used)}/{formatK(limit)} {labels.tokens.toLowerCase()}
      </span>
      {!isActive && voiceHasLimit && (
        <>
          <span className="text-j-border">·</span>
          <span className={voiceUsedValue >= voiceMinutesLimit ? 'text-red-400' : ''}>
            {voiceUsedValue}/{voiceMinutesLimit}m {labels.voice.toLowerCase()}
          </span>
        </>
      )}
      {!isActive && (
        <>
          <span className="text-j-border">·</span>
          <button
            onClick={() => setShowPricing(true)}
            className="text-j-accent hover:underline"
          >
            {labels.upgrade}
          </button>
          <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
        </>
      )}
    </div>
  );
}

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
