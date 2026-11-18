import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAllowedUser, signupOpen } from '@/lib/api/allow-list';

export async function proxy(request: NextRequest) {
  const passthroughPaths = new Set([
    '/api/voice/session/transcript',
    '/api/voice/session/end',
  ]);

  if (passthroughPaths.has(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith('/signup') && !signupOpen()) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Signed in but not on the allow-list (allow-list.ts): every page but the
  // auth ones sends them to /login. API routes answer 403 in withAuth.
  const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/'];
  const isAuthPath = authPaths.some((p) => path.startsWith(p));
  if (user && !isAllowedUser(user.id)) {
    if (isAuthPath || path.startsWith('/api/')) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '?error=not_allowed';
    return NextResponse.redirect(url);
  }

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/evaluate'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login and sign-up
  if (user && (path.startsWith('/login') || path.startsWith('/signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
