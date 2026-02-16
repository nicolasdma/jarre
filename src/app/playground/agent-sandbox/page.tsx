import { PlaygroundShell } from '@/components/playground/playground-shell';
import { SandboxPlayground } from './sandbox-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function AgentSandboxPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Agent Sandbox Patterns" subtitle="Harrison Chase" embed={embed === '1'}>
      <SandboxPlayground />
    </PlaygroundShell>
  );
}
