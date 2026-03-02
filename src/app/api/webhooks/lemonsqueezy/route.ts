import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for LemonSqueezy webhook',
    );
  }
  return createClient(url, key);
}

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

/**
 * Map LemonSqueezy subscription status to our internal status.
 * Internal statuses: 'active' | 'past_due' | 'canceled' | 'free'
 */
function mapStatus(lsStatus: string): string {
  switch (lsStatus) {
    case 'active':
    case 'on_trial':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'cancelled':
    case 'expired':
      return 'canceled';
    default:
      return 'free';
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-signature');

  if (!signature || !verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  const eventName = meta?.event_name as string | undefined;
  const eventId = meta?.webhook_id as string | undefined;

  if (!eventName || !eventId) {
    return NextResponse.json({ error: 'Missing event data' }, { status: 400 });
  }

  const adminDb = getAdminClient();

  // Idempotency check
  const { data: existing } = await adminDb
    .from(TABLES.processedLemonsqueezyEvents)
    .select('event_id')
    .eq('event_id', eventId)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  const data = payload.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;

  if (!attributes) {
    return NextResponse.json({ error: 'Missing attributes' }, { status: 400 });
  }

  const customData = meta?.custom_data as Record<string, string> | undefined;
  const userId = customData?.user_id;
  const customerId = String(attributes.customer_id ?? '');
  const subscriptionId = String(data?.id ?? '');
  const lsStatus = String(attributes.status ?? '');

  const handledEvents = [
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_expired',
    'subscription_payment_success',
    'subscription_payment_failed',
  ];

  if (handledEvents.includes(eventName)) {
    const status =
      eventName === 'subscription_payment_failed'
        ? 'past_due'
        : mapStatus(lsStatus);

    const updateData: Record<string, string> = {
      subscription_status: status,
    };

    if (customerId) {
      updateData.lemonsqueezy_customer_id = customerId;
    }
    if (subscriptionId) {
      updateData.lemonsqueezy_subscription_id = subscriptionId;
    }

    if (userId) {
      // Primary: match by user_id from custom data
      await adminDb
        .from(TABLES.userProfiles)
        .update(updateData)
        .eq('id', userId);
    } else if (customerId) {
      // Fallback: match by lemonsqueezy_customer_id
      await adminDb
        .from(TABLES.userProfiles)
        .update(updateData)
        .eq('lemonsqueezy_customer_id', customerId);
    }
  }

  // Mark event as processed
  await adminDb
    .from(TABLES.processedLemonsqueezyEvents)
    .upsert({ event_id: eventId }, { onConflict: 'event_id' });

  return NextResponse.json({ received: true });
}
