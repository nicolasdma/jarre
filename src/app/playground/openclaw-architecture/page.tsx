import { PlaygroundShell } from '@/components/playground/playground-shell';
import { OpenClawArchitecturePlayground } from './openclaw-architecture-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function OpenClawArchitecturePage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Architecture Explorer" subtitle="OpenClaw Case Study" embed={embed === '1'}>
      <OpenClawArchitecturePlayground />
    </PlaygroundShell>
  );
}
