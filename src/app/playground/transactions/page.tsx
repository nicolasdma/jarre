import { PlaygroundShell } from '@/components/playground/playground-shell';
import { TransactionsPlayground } from './transactions-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Transaction Anomalies" subtitle="DDIA Ch.7" embed={embed === '1'}>
      <TransactionsPlayground />
    </PlaygroundShell>
  );
}
