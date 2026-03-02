import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { createClient } from '@supabase/supabase-js';

// Use service-role client — webhooks are not authenticated via Supabase auth
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for Stripe webhook');
  }
  return createClient(url, key);
}

async function updateSubscriptionStatus(
  customerId: string,
  status: string,
) {
  const supabase = getAdminClient();
  await supabase
    .from('user_profiles')
    .update({ subscription_status: status })
    .eq('stripe_customer_id', customerId);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check — skip already-processed events
  const adminDb = getAdminClient();
  const { data: existing } = await adminDb
    .from('processed_stripe_events')
    .select('event_id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  // Execute mutations BEFORE marking as processed.
  // If the mutation fails, the event stays unprocessed and Stripe retries correctly.
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      if (customerId) {
        const supabase = getAdminClient();
        if (session.metadata?.user_id) {
          // Primary: match by user_id from session metadata
          await supabase
            .from('user_profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_status: 'active',
            })
            .eq('id', session.metadata.user_id);
        } else {
          // Fallback: match by stripe_customer_id (set during checkout)
          await supabase
            .from('user_profiles')
            .update({ subscription_status: 'active' })
            .eq('stripe_customer_id', customerId);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const stripeStatus = subscription.status;

      let status = 'free';
      if (stripeStatus === 'active' || stripeStatus === 'trialing') {
        status = 'active';
      } else if (stripeStatus === 'past_due') {
        status = 'past_due';
      } else if (stripeStatus === 'canceled' || stripeStatus === 'unpaid') {
        status = 'canceled';
      }

      await updateSubscriptionStatus(customerId, status);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionStatus(
        subscription.customer as string,
        'canceled',
      );
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
        await updateSubscriptionStatus(
          invoice.customer as string,
          'past_due',
        );
      }
      break;
    }
  }

  // Mark event as processed AFTER successful mutation
  await adminDb
    .from('processed_stripe_events')
    .upsert({ event_id: event.id }, { onConflict: 'event_id' });

  return NextResponse.json({ received: true });
}
