import { NextResponse } from 'next/server';
import { createCheckoutUrl } from '@/lib/billing/provider';
import { withAuth } from '@/lib/api/middleware';

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const origin = request.headers.get('origin') || '';

    const url = await createCheckoutUrl({
      userId: user.id,
      userEmail: user.email!,
      origin,
      supabase,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 503 });
  }
});
