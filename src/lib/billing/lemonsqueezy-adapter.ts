/**
 * Jarre - LemonSqueezy Adapter
 *
 * Checkout and portal logic for LemonSqueezy.
 * Imported dynamically by provider.ts when BILLING_PROVIDER=lemonsqueezy.
 */

import {
  createCheckout,
  getSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';
import { initLemonSqueezy, getLemonSqueezyConfig } from './lemonsqueezy';
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
}: CheckoutParams): Promise<string> {
  initLemonSqueezy();
  const { storeId, variantId } = getLemonSqueezyConfig();

  const response = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
      custom: { user_id: userId },
    },
    productOptions: {
      redirectUrl: `${origin}/profile?billing=success`,
    },
  });

  const url = response.data?.data.attributes.url;
  if (!url) {
    throw new Error('Failed to create LemonSqueezy checkout');
  }

  return url;
}

export async function createPortalUrl({
  userId,
  supabase,
}: PortalParams): Promise<string> {
  initLemonSqueezy();

  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('lemonsqueezy_subscription_id')
    .eq('id', userId)
    .single();

  if (!profile?.lemonsqueezy_subscription_id) {
    throw new Error('No billing account found');
  }

  const response = await getSubscription(
    profile.lemonsqueezy_subscription_id,
  );

  const portalUrl =
    response.data?.data.attributes.urls.customer_portal;
  if (!portalUrl) {
    throw new Error('Failed to get LemonSqueezy portal URL');
  }

  return portalUrl;
}
