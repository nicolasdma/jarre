'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JarreButton } from '@/components/jarre-button';
import { ErrorMessage } from '@/components/error-message';

type Lang = 'es' | 'en';

const AUTH_STRINGS: Record<string, Record<Lang, string>> = {
  welcomeBack: { es: 'Bienvenido de nuevo', en: 'Welcome back' },
  signInSubtitle: { es: 'Inicia sesión para continuar aprendiendo', en: 'Sign in to continue your learning journey' },
  continueWithGoogle: { es: 'Continuar con Google', en: 'Continue with Google' },
  orContinueWith: { es: 'o continúa con email', en: 'or continue with email' },
  email: { es: 'Correo electrónico', en: 'Email' },
  password: { es: 'Contraseña', en: 'Password' },
  signingIn: { es: 'Iniciando sesión...', en: 'Signing in...' },
  signIn: { es: 'Iniciar sesión', en: 'Sign in' },
  noAccount: { es: '¿No tienes cuenta?', en: "Don't have an account?" },
  signUp: { es: 'Registrarse', en: 'Sign up' },
  forgotPassword: { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?' },
  loading: { es: 'Cargando...', en: 'Loading...' },
};

function detectLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'es';
  const browserLang = navigator.language?.split('-')[0];
  return browserLang === 'en' ? 'en' : 'es';
}

function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return '/';
  // Only allow relative paths, block protocol-based redirects
  if (!redirect.startsWith('/') || redirect.includes('://')) return '/';
  return redirect;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeRedirect(searchParams.get('redirect'));
  const language = useMemo(() => detectLanguage(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const s = (key: string) => AUTH_STRINGS[key]?.[language] ?? AUTH_STRINGS[key]?.en ?? key;

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-j-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{s('welcomeBack')}</CardTitle>
          <CardDescription>{s('signInSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-j-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {s('continueWithGoogle')}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-j-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-j-text-tertiary">{s('orContinueWith')}</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{s('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{s('password')}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-j-text-tertiary hover:text-j-accent transition-colors"
                >
                  {s('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-j-text-tertiary hover:text-j-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <ErrorMessage message={error} variant="inline" />}

            <JarreButton type="submit" className="w-full" disabled={loading}>
              {loading ? s('signingIn') : s('signIn')}
            </JarreButton>
          </form>

          <p className="mt-4 text-center text-sm text-j-text-secondary">
            {s('noAccount')}{' '}
            <Link href="/signup" className="font-medium text-j-text hover:underline">
              {s('signUp')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-j-bg">
        <p className="text-j-text-tertiary">{AUTH_STRINGS.loading.es}</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
