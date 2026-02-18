import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { ReplicationPlayground } from './replication-playground';

export const metadata: Metadata = {
  title: 'Replication Lab — Jarre',
  description: 'Interactive replication strategies playground for distributed databases',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function ReplicationLabPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Replication Lab" subtitle="DDIA Ch.5" embed={embed === '1'}>
      <ReplicationPlayground />
    </PlaygroundShell>
  );
}
