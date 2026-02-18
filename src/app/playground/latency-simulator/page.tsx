import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { LatencyPlayground } from './latency-playground';

export const metadata: Metadata = {
  title: 'Latency Simulator — Jarre',
  description: 'Interactive latency simulation for understanding system performance',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function LatencySimulatorPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Latency Simulator" subtitle="DDIA Ch.1" embed={embed === '1'}>
      <LatencyPlayground />
    </PlaygroundShell>
  );
}
