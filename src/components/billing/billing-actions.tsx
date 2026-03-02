'use client';

import { useState } from 'react';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetchWithKeys('/api/billing/checkout', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
        return;
      }
    } catch {
      /* handled below */
    }
    setLoading(false);
  }

  return (
    <button
      className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors rounded bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover disabled:opacity-50 j-glow-accent hover:shadow-[0_0_20px_rgba(94,170,94,0.15)] px-5 sm:px-6 py-3 min-h-[44px]"
      onClick={handleUpgrade}
      disabled={loading}
    >
      {loading ? 'Redirecting…' : 'Upgrade to Pro — $5/month'}
    </button>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetchWithKeys('/api/billing/portal', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Portal request failed');
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
        return;
      }
    } catch {
      /* handled below */
    }
    setLoading(false);
  }

  return (
    <button
      className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors rounded border border-j-border-input bg-transparent text-j-text-secondary hover:border-j-accent hover:text-j-text disabled:opacity-50 px-4 py-2.5 sm:py-2 min-h-[44px]"
      onClick={handleManage}
      disabled={loading}
    >
      {loading ? 'Redirecting…' : 'Manage subscription'}
    </button>
  );
}
