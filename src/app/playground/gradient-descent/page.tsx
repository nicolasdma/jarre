import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { GradientDescentPlayground } from './gradient-descent-playground';

export const metadata: Metadata = {
  title: 'Gradient Descent — Jarre',
  description: 'Interactive gradient descent optimization playground',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function GradientDescentPage({ searchParams }: Props) {
  const { embed } = await searchParams;
  return (
    <PlaygroundShell title="Gradient Descent" subtitle="Optimización" embed={embed === '1'}>
      <GradientDescentPlayground />
    </PlaygroundShell>
  );
}
