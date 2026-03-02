'use client';

import { useRouter } from 'next/navigation';
import { PricingModal } from '@/components/billing/pricing-modal';

export function PricingModalPage() {
  const router = useRouter();

  return <PricingModal isOpen onClose={() => router.push('/dashboard')} />;
}
