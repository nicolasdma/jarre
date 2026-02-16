import { PlaygroundShell } from '@/components/playground/playground-shell';
import { AttentionPlayground } from './attention-playground';

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
