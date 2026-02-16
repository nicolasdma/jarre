import { PlaygroundShell } from '@/components/playground/playground-shell';
import { ReplicationPlayground } from './replication-playground';

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
