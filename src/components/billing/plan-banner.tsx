'use client';

import { useState } from 'react';
import { PricingModal } from '@/components/billing/pricing-modal';

interface PlanBannerProps {
  status: string;
  used: number;
  limit: number;
  voiceMinutesUsed?: number;
  voiceMinutesLimit?: number;
}

export function PlanBanner({ status, used, limit, voiceMinutesUsed, voiceMinutesLimit }: PlanBannerProps) {
  const [showPricing, setShowPricing] = useState(false);
  const isActive = status === 'active';
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isLow = percent >= 80;
  const exceeded = used >= limit;

  // Pro users who aren't low on tokens — don't show anything
  if (isActive && !isLow) return null;

  return (
    <div className="mb-6 flex items-center gap-3 text-[11px] font-mono text-j-text-tertiary">
      <span className={`uppercase tracking-[0.15em] ${isActive ? 'text-j-accent' : ''}`}>
        {isActive ? 'Pro' : 'Free'}
      </span>
      <span className="text-j-border">·</span>
      <span className={exceeded ? 'text-red-400' : ''}>
        {formatK(used)}/{formatK(limit)} tokens
      </span>
      {!isActive && voiceMinutesLimit != null && voiceMinutesLimit !== Infinity && (
        <>
          <span className="text-j-border">·</span>
          <span className={voiceMinutesUsed != null && voiceMinutesUsed >= voiceMinutesLimit ? 'text-red-400' : ''}>
            {voiceMinutesUsed ?? 0}/{voiceMinutesLimit} min voz
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
            Upgrade
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
