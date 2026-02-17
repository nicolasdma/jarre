import { PlaygroundShell } from '@/components/playground/playground-shell';
import { ProbabilityPlayground } from './probability-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function ProbabilityPage({ searchParams }: Props) {
  const { embed } = await searchParams;
  return (
    <PlaygroundShell title="Bayesian Updater" subtitle="Probabilidad" embed={embed === '1'}>
      <ProbabilityPlayground />
    </PlaygroundShell>
  );
}
