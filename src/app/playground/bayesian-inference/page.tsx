import { PlaygroundShell } from '@/components/playground/playground-shell';
import { BayesianInferencePlayground } from './bayesian-inference-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function BayesianInferencePage({ searchParams }: Props) {
  const { embed } = await searchParams;
  return (
    <PlaygroundShell title="Bayesian Inference" subtitle="MLE vs MAP" embed={embed === '1'}>
      <BayesianInferencePlayground />
    </PlaygroundShell>
  );
}
