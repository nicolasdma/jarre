import { PlaygroundShell } from '@/components/playground/playground-shell';
import { EnginePlayground } from './engine-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function StorageEnginePage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Storage Engine Playground" subtitle="DDIA Ch.3" embed={embed === '1'}>
      <EnginePlayground />
    </PlaygroundShell>
  );
}
