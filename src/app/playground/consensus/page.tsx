import { PlaygroundShell } from '@/components/playground/playground-shell';
import { ConsensusPlayground } from './consensus-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function ConsensusPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Consensus Stepper" subtitle="DDIA Ch.8-9" embed={embed === '1'}>
      <ConsensusPlayground />
    </PlaygroundShell>
  );
}
