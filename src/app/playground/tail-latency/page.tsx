import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { TailLatencyPlayground } from './tail-latency-playground';

export const metadata: Metadata = {
  title: 'Tail Latency Lab — Jarre',
  description: 'Interactive tail latency exploration based on The Tail at Scale',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function TailLatencyPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Tail Latency Lab" subtitle="The Tail at Scale" embed={embed === '1'}>
      <TailLatencyPlayground />
    </PlaygroundShell>
  );
}
