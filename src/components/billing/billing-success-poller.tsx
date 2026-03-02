'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function BillingSuccessPoller() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [polling, setPolling] = useState(false);

  const isBillingSuccess = searchParams.get('billing') === 'success';

  useEffect(() => {
    if (!isBillingSuccess) return;
    setPolling(true);

    let attempts = 0;
    const maxAttempts = 10;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/billing/status');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'active') {
            clearInterval(interval);
            setPolling(false);
            window.history.replaceState({}, '', '/profile');
            router.refresh();
            return;
          }
        }
      } catch {
        // retry
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setPolling(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isBillingSuccess, router]);

  if (!polling) return null;

  return (
    <div className="border border-j-border rounded-lg px-4 py-3 mb-8 flex items-center gap-3 bg-j-bg-alt">
      <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-j-accent border-t-transparent" />
      <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary">
        Procesando pago…
      </p>
    </div>
  );
}
