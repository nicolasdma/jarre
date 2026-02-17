import { PlaygroundShell } from '@/components/playground/playground-shell';
import { LinearAlgebraPlayground } from './linear-algebra-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function LinearAlgebraPage({ searchParams }: Props) {
  const { embed } = await searchParams;
  return (
    <PlaygroundShell title="Matrix Transformer" subtitle="Álgebra Lineal" embed={embed === '1'}>
      <LinearAlgebraPlayground />
    </PlaygroundShell>
  );
}
