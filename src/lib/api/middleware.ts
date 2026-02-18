/**
 * Jarre - API Route Middleware
 *
 * `withAuth` wraps route handlers to eliminate auth + error boilerplate.
 * Every authenticated route becomes a single function that receives
 * the authenticated supabase client and user.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiError, errorResponse } from './errors';
import type { User } from '@supabase/supabase-js';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface AuthContext<P = undefined> {
  supabase: SupabaseClient;
  user: User;
  params: P;
}

/**
 * Wraps an API route handler with auth verification + error handling.
 *
 * Usage (no route params):
 *   export const POST = withAuth(async (request, { supabase, user }) => { ... });
 *
 * Usage (with route params):
 *   export const GET = withAuth<{ id: string }>(async (request, { supabase, user, params }) => { ... });
 */
export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: (request: Request, ctx: AuthContext<P>) => Promise<NextResponse>,
) {
  return async (
    request: Request,
    routeContext?: { params: Promise<P> },
  ): Promise<NextResponse> => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const params = routeContext?.params
        ? await routeContext.params
        : ({} as P);

      return await handler(request, { supabase, user, params });
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error);
      }
      console.error(`[API] Unexpected error:`, error);
      return errorResponse(error);
    }
  };
}
