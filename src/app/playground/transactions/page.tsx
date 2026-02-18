import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { TransactionsPlayground } from './transactions-playground';

export const metadata: Metadata = {
  title: 'Transaction Anomalies — Jarre',
  description: 'Interactive playground for understanding transaction isolation anomalies',
};

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
