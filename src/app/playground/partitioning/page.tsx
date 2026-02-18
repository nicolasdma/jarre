import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { PartitionPlayground } from './partition-playground';

export const metadata: Metadata = {
  title: 'Partition Visualizer — Jarre',
  description: 'Interactive partition strategy visualizer for distributed databases',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function PartitioningPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Partition Visualizer" subtitle="DDIA Ch.6" embed={embed === '1'}>
      <PartitionPlayground />
    </PlaygroundShell>
  );
}
