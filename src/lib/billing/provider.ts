/**
 * Jarre - Billing Provider Dispatcher
 *
 * Routes checkout/portal calls to the active billing provider.
 * Uses dynamic imports to avoid loading unused provider SDKs.
 */

import { BILLING_PROVIDER } from '@/lib/config';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CheckoutParams {
  userId: string;
  userEmail: string;
  origin: string;
  supabase: SupabaseClient;
}

interface PortalParams {
  userId: string;
  origin: string;
  supabase: SupabaseClient;
}

export async function createCheckoutUrl(
  params: CheckoutParams,
): Promise<string> {
  if (BILLING_PROVIDER === 'stripe') {
    const mod = await import('./stripe-adapter');
    return mod.createCheckoutUrl(params);
  }
  const mod = await import('./lemonsqueezy-adapter');
  return mod.createCheckoutUrl(params);
}

export async function createPortalUrl(
  params: PortalParams,
): Promise<string> {
  if (BILLING_PROVIDER === 'stripe') {
    const mod = await import('./stripe-adapter');
    return mod.createPortalUrl(params);
  }
  const mod = await import('./lemonsqueezy-adapter');
  return mod.createPortalUrl(params);
}
