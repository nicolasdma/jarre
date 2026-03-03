import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { TABLES } from '@/lib/db/tables';
import { IS_MANAGED } from '@/lib/config';
import { UpgradeButton, ManageSubscriptionButton } from '@/components/billing/billing-actions';
import { ApiKeysSettings } from '@/components/settings/api-keys-settings';
import { BillingSuccessPoller } from '@/components/billing/billing-success-poller';

export const metadata: Metadata = {
  title: 'Profile — Jarre',
  description: 'View your learning profile and token usage statistics',
};

const PRO_BENEFITS = [
  '2M tokens/mes (40× el plan gratuito)',
  'Voice sin límite de minutos',
  'Acceso anticipado a nuevas funciones',
  'Soporte prioritario',
];

function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const subscriptionStatus = profile?.subscription_status || 'free';

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const { data: rows } = await supabase
    .from(TABLES.tokenUsage)
    .select('tokens, created_at')
    .eq('user_id', user.id)
    .gte('created_at', monthStart.toISOString());

  let currentMonth = 0;
  for (const row of rows || []) {
    currentMonth += row.tokens;
  }

  const monthlyLimit = subscriptionStatus === 'active' ? 2_000_000 : 50_000;
  const usagePercent = Math.min(100, Math.round((currentMonth / monthlyLimit) * 100));

  const showUpgrade = IS_MANAGED && subscriptionStatus !== 'active';
  const showProStatus = IS_MANAGED && subscriptionStatus === 'active';

  return (
    <div className="min-h-screen bg-j-bg j-bg-texture">
      <Header />

      <main className="mx-auto max-w-2xl px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16">
        <SectionLabel>Perfil</SectionLabel>

        <Suspense>
          <BillingSuccessPoller />
        </Suspense>

        {/* 1. Upgrade card — prominent marketing style */}
        {showUpgrade && (
          <section className="relative border-2 border-j-accent rounded-xl p-6 mb-8 bg-j-surface">
            <div className="absolute -top-3 left-5">
              <span className="bg-j-accent text-j-bg text-[10px] font-mono tracking-[0.15em] uppercase px-2.5 py-0.5 rounded-full">
                Recomendado
              </span>
            </div>

            <span className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase">
              Pro
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-light text-j-text">$5</span>
              <span className="text-sm text-j-text-tertiary">/mes</span>
            </div>
            <p className="text-xs text-j-text-secondary mt-1 mb-5">
              Aprovechá Jarre al máximo.
            </p>

            <ul className="space-y-2 mb-6">
              {PRO_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-xs text-j-text">
                  <Check size={12} className="text-j-accent mt-0.5 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>

            <UpgradeButton />

            {subscriptionStatus === 'canceled' && (
              <p className="text-xs text-j-text-tertiary mt-3">
                Tu suscripción fue cancelada. Reactivá para volver a tener 2M tokens/mes.
              </p>
            )}
            {subscriptionStatus === 'past_due' && (
              <p className="text-xs text-j-warm-dark mt-3">
                Tu último pago falló. Actualizá tu método de pago para mantener el acceso Pro.
              </p>
            )}
          </section>
        )}

        {/* 2. Pro active status */}
        {showProStatus && (
          <section className="border border-j-border rounded-xl p-6 mb-8 bg-j-surface">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-j-accent/10 text-j-accent text-[10px] font-mono tracking-[0.15em] uppercase px-2.5 py-1 rounded-full border border-j-accent/30">
                Pro · Activo
              </span>
            </div>
            <ManageSubscriptionButton />
          </section>
        )}

        {/* 3. Monthly usage bar */}
        {IS_MANAGED && (
          <section className="border border-j-border rounded-xl p-5 mb-8 bg-j-surface">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                Uso mensual
              </span>
              <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-secondary tabular-nums">
                {formatNumber(currentMonth)} / {formatNumber(monthlyLimit)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-j-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90
                    ? 'bg-red-500'
                    : usagePercent >= 70
                      ? 'bg-j-warm'
                      : 'bg-j-accent'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {usagePercent >= 80 && (
              <p className="text-[11px] text-j-text-tertiary mt-2">
                Usá tus propias API keys para quitar límites.{' '}
                <Link href="#api-keys" className="text-j-accent hover:underline">
                  Configurar
                </Link>
              </p>
            )}
          </section>
        )}

        {/* 4. API Keys — collapsible developer section */}
        {IS_MANAGED && (
          <section id="api-keys" className="mb-8">
            <details>
              <summary className="font-mono text-[10px] tracking-[0.15em] uppercase bg-j-text text-j-bg-alt px-4 py-3 rounded-lg cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                {'>'} developer — api keys
              </summary>
              <div className="mt-3 border border-j-border rounded-xl p-6 bg-j-surface">
                <ApiKeysSettings />
              </div>
            </details>
          </section>
        )}

        {/* 5. User info footer */}
        <section className="border-t border-j-border pt-6 mt-4">
          <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            <span>{user.email}</span>
            <span className="text-j-border">·</span>
            <span>{user.id.slice(0, 8)}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
