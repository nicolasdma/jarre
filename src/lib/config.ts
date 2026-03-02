/**
 * Jarre - App Configuration
 *
 * Determines whether the app is running in self-hosted or managed mode.
 * Self-hosted is the default — no extra configuration needed.
 */

export type AppMode = 'self-hosted' | 'managed';

export const APP_MODE: AppMode =
  (process.env.NEXT_PUBLIC_APP_MODE as AppMode) || 'self-hosted';

export const IS_MANAGED = APP_MODE === 'managed';
export const IS_SELF_HOSTED = APP_MODE === 'self-hosted';

export type BillingProvider = 'stripe' | 'lemonsqueezy';

export const BILLING_PROVIDER: BillingProvider =
  (process.env.BILLING_PROVIDER as BillingProvider) || 'lemonsqueezy';
