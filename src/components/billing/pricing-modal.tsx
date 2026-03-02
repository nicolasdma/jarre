'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { UpgradeButton, ManageSubscriptionButton } from '@/components/billing/billing-actions';

const FREE_FEATURES = [
  '50K tokens/month (~2-3 courses)',
  'Unlimited courses',
  'Voice tutoring (7 modes)',
  'Spaced repetition',
  'Evaluations & scoring',
  'Bring your own API keys',
];

const PRO_FEATURES = [
  '2M tokens/month (~100+ courses)',
  'Everything in Free',
  '40x token budget',
  'Priority support',
  'Early access to new features',
];

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reset loading state when modal opens
    setLoading(true);
    fetch('/api/billing/status')
      .then((res) => (res.ok ? res.json() : { subscriptionStatus: 'free' }))
      .then((data) => setSubscriptionStatus(data.subscriptionStatus || 'free'))
      .catch(() => setSubscriptionStatus('free'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isActive = subscriptionStatus === 'active';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-j-bg border border-j-border rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-j-border">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                Pricing
              </p>
              <h2 className="text-xl font-semibold text-j-text mt-1">
                Simple pricing
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-j-text-tertiary hover:text-j-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-j-text-tertiary animate-pulse">Loading…</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-j-text-tertiary text-center mb-6">
                  Start free. Upgrade when you need more tokens.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Free tier */}
                  <div className="border border-j-border rounded-xl p-5 bg-j-surface">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                      Free
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-light text-j-text">$0</span>
                      <span className="text-sm text-j-text-tertiary">/month</span>
                    </div>
                    <p className="text-xs text-j-text-secondary mt-1 mb-4">
                      Full access with managed API keys
                    </p>

                    <ul className="space-y-2 mb-4">
                      {FREE_FEATURES.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-j-text-secondary">
                          <Check size={12} className="text-j-text-tertiary mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!isActive && subscriptionStatus === 'free' && (
                      <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-center border border-j-border text-j-text-tertiary">
                        Current plan
                      </div>
                    )}
                  </div>

                  {/* Pro tier */}
                  <div className="relative border-2 border-j-accent rounded-xl p-5 bg-j-surface">
                    <div className="absolute -top-3 left-5">
                      <span className="bg-j-accent text-j-bg text-[10px] font-mono tracking-[0.15em] uppercase px-2.5 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>

                    <span className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase">
                      Pro
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-light text-j-text">$5</span>
                      <span className="text-sm text-j-text-tertiary">/month</span>
                    </div>
                    <p className="text-xs text-j-text-secondary mt-1 mb-4">
                      10x more tokens for serious learners
                    </p>

                    <ul className="space-y-2 mb-4">
                      {PRO_FEATURES.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-j-text">
                          <Check size={12} className="text-j-accent mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isActive ? (
                      <div className="space-y-2">
                        <div className="px-3 py-1.5 rounded-lg text-xs font-medium text-center bg-j-accent/10 text-j-accent border border-j-accent/30">
                          Active
                        </div>
                        <ManageSubscriptionButton />
                      </div>
                    ) : (
                      <UpgradeButton />
                    )}
                  </div>
                </div>

                {/* BYOK note */}
                <div className="text-center mt-6">
                  <p className="text-xs text-j-text-tertiary">
                    Or{' '}
                    <Link href="/settings" className="text-j-accent hover:underline" onClick={onClose}>
                      bring your own API keys
                    </Link>{' '}
                    for unlimited usage on any plan.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
