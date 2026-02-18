import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { SandboxPlayground } from './sandbox-playground';

export const metadata: Metadata = {
  title: 'Agent Sandbox Patterns — Jarre',
  description: 'Interactive playground for exploring agent sandbox design patterns',
};

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
