import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { EncodingPlayground } from './encoding-playground';

export const metadata: Metadata = {
  title: 'Encoding Explorer — Jarre',
  description: 'Interactive playground for exploring data encoding formats',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function EncodingPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Encoding Explorer" subtitle="DDIA Ch.4" embed={embed === '1'}>
      <EncodingPlayground />
    </PlaygroundShell>
  );
}
