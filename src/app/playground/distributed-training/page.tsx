import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { DistributedTrainingPlayground } from './distributed-training-playground';

export const metadata: Metadata = {
  title: 'Distributed Training Simulator — Jarre',
  description: 'Interactive distributed training parallelism visualizer',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function DistributedTrainingPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Distributed Training" subtitle="Parallelism Strategies" embed={embed === '1'}>
      <DistributedTrainingPlayground />
    </PlaygroundShell>
  );
}
