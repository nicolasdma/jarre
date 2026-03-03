'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JarreButton } from '@/components/jarre-button';
import { ErrorMessage } from '@/components/error-message';

type Lang = 'es' | 'en';

const STRINGS: Record<string, Record<Lang, string>> = {
  title: { es: 'Nueva contraseña', en: 'New password' },
  subtitle: { es: 'Ingresa tu nueva contraseña', en: 'Enter your new password' },
  newPassword: { es: 'Nueva contraseña', en: 'New password' },
  confirmPassword: { es: 'Confirmar contraseña', en: 'Confirm password' },
  minChars: { es: 'Mínimo 6 caracteres', en: 'Minimum 6 characters' },
  mismatch: { es: 'Las contraseñas no coinciden', en: 'Passwords do not match' },
  updating: { es: 'Actualizando...', en: 'Updating...' },
  update: { es: 'Actualizar contraseña', en: 'Update password' },
};

function detectLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'es';
  const browserLang = navigator.language?.split('-')[0];
  return browserLang === 'en' ? 'en' : 'es';
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const language = useMemo(() => detectLanguage(), []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const s = (key: string) => STRINGS[key]?.[language] ?? STRINGS[key]?.en ?? key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(s('mismatch'));
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/library');
  };

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
              <Label htmlFor="password">{s('newPassword')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
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
              <p className="text-xs text-j-text-tertiary">{s('minChars')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{s('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && <ErrorMessage message={error} variant="inline" />}

            <JarreButton type="submit" className="w-full" disabled={loading}>
              {loading ? s('updating') : s('update')}
            </JarreButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
