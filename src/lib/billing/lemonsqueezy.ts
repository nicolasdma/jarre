/**
 * Jarre - LemonSqueezy Client (lazy singleton)
 *
 * Avoids module-level instantiation so builds succeed
 * even when LEMONSQUEEZY_API_KEY is not set.
 */

import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

let _initialized = false;

export function initLemonSqueezy(): void {
  if (_initialized) return;
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) {
    throw new Error('LEMONSQUEEZY_API_KEY is not configured');
  }
  lemonSqueezySetup({ apiKey: key });
  _initialized = true;
}

export function getLemonSqueezyConfig() {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!storeId || !variantId) {
    throw new Error(
      'LEMONSQUEEZY_STORE_ID and LEMONSQUEEZY_VARIANT_ID must be set',
    );
  }
  return { storeId, variantId };
}
