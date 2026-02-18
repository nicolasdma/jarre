import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { StreamPlayground } from './stream-playground';

export const metadata: Metadata = {
  title: 'Stream Processing Lab — Jarre',
  description: 'Interactive stream processing playground for event-driven architectures',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function StreamProcessingPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Stream Processing Lab" subtitle="DDIA Ch.11" embed={embed === '1'}>
      <StreamPlayground />
    </PlaygroundShell>
  );
}
