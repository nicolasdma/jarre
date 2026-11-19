'use client';

import dynamic from 'next/dynamic';

/**
 * The pricing modal (and framer-motion with it) downloads only when someone
 * opens it. It renders nothing while closed, so pages that merely offer an
 * "Upgrade" button no longer ship it in their first load.
 */
const LoadedPricingModal = dynamic(() => import('./pricing-modal').then((m) => m.PricingModal), { ssr: false });

export function PricingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return isOpen ? <LoadedPricingModal isOpen onClose={onClose} /> : null;
}
