import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { AttentionPlayground } from './attention-playground';

export const metadata: Metadata = {
  title: 'Attention Visualizer — Jarre',
  description: 'Interactive transformer attention mechanism visualizer',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function AttentionPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Attention Visualizer" subtitle="Transformer Architecture" embed={embed === '1'}>
      <AttentionPlayground />
    </PlaygroundShell>
  );
}
