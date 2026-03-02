import { Header } from '@/components/header';
import { PricingModalPage } from './pricing-modal-page';

export const metadata = {
  title: 'Pricing — Jarre',
  description: 'Simple pricing for deep learning',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-j-bg j-bg-texture">
      <Header />
      <PricingModalPage />
    </div>
  );
}
