import { NextResponse } from 'next/server';
import { createPortalUrl } from '@/lib/billing/provider';
import { withAuth } from '@/lib/api/middleware';

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const origin = request.headers.get('origin') || '';

    const url = await createPortalUrl({
      userId: user.id,
      origin,
      supabase,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Portal access failed';
    const status = message === 'No billing account found' ? 404 : 503;
    return NextResponse.json({ error: message }, { status });
  }
});
