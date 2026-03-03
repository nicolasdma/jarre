'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JarreButton } from '@/components/jarre-button';
import { ErrorMessage } from '@/components/error-message';

type Lang = 'es' | 'en';

const STRINGS: Record<string, Record<Lang, string>> = {
  title: { es: 'Recuperar contraseña', en: 'Reset password' },
  subtitle: { es: 'Te enviaremos un link para restablecer tu contraseña', en: "We'll send you a link to reset your password" },
  email: { es: 'Correo electrónico', en: 'Email' },
  sending: { es: 'Enviando...', en: 'Sending...' },
  send: { es: 'Enviar link de recuperación', en: 'Send reset link' },
  backToLogin: { es: 'Volver a iniciar sesión', en: 'Back to sign in' },
  successTitle: { es: 'Revisa tu correo', en: 'Check your email' },
  successMessage: { es: 'Si existe una cuenta con ese correo, recibirás un link para restablecer tu contraseña.', en: 'If an account exists with that email, you will receive a password reset link.' },
};

function detectLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'es';
  const browserLang = navigator.language?.split('-')[0];
  return browserLang === 'en' ? 'en' : 'es';
}

export default function ForgotPasswordPage() {
  const language = useMemo(() => detectLanguage(), []);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const s = (key: string) => STRINGS[key]?.[language] ?? STRINGS[key]?.en ?? key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{s('successTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-j-text-secondary mb-4">
              {s('successMessage')}
            </p>
            <Link
              href="/login"
              className="block text-center text-sm font-medium text-j-accent hover:underline"
            >
              {s('backToLogin')}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-j-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{s('title')}</CardTitle>
          <CardDescription>{s('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && <ErrorMessage message={error} variant="inline" />}

            <JarreButton type="submit" className="w-full" disabled={loading}>
              {loading ? s('sending') : s('send')}
            </JarreButton>
          </form>

          <p className="mt-4 text-center text-sm text-j-text-secondary">
            <Link href="/login" className="font-medium text-j-text hover:underline">
              {s('backToLogin')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
