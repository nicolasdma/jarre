import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { ScalingLawsPlayground } from './scaling-laws-playground';

export const metadata: Metadata = {
  title: 'Scaling Laws Explorer — Jarre',
  description: 'Interactive explorer for neural language model scaling laws',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function ScalingLawsPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Scaling Laws Explorer" subtitle="Neural Language Models" embed={embed === '1'}>
      <ScalingLawsPlayground />
    </PlaygroundShell>
  );
}
