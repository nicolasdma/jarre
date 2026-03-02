/**
 * Jarre - Stripe Adapter
 *
 * Extracted Stripe-specific checkout and portal logic.
 * Imported dynamically by provider.ts when BILLING_PROVIDER=stripe.
 */

import { getStripe } from './stripe';
import { TABLES } from '@/lib/db/tables';
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

export async function createCheckoutUrl({
  userId,
  userEmail,
  origin,
  supabase,
}: CheckoutParams): Promise<string> {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error('Stripe is not configured');
  }

  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { user_id: userId },
    });
    customerId = customer.id;

    await supabase
      .from(TABLES.userProfiles)
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: userId },
    success_url: `${origin}/profile?billing=success`,
    cancel_url: `${origin}/profile`,
  });

  return session.url!;
}

export async function createPortalUrl({
  userId,
  origin,
  supabase,
}: PortalParams): Promise<string> {
  const stripe = getStripe();

  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error('No billing account found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/profile`,
  });

  return session.url;
}
