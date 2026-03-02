/**
 * Jarre - Stripe Client (lazy singleton)
 *
 * Avoids module-level instantiation so builds succeed
 * even when STRIPE_SECRET_KEY is not set (self-hosted mode).
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });
  }
  return _stripe;
}
