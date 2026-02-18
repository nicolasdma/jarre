import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { EnginePlayground } from './engine-playground';

export const metadata: Metadata = {
  title: 'Storage Engine Playground — Jarre',
  description: 'Interactive storage engine visualization for LSM trees and B-trees',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function StorageEnginePage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Storage Engine Playground" subtitle="DDIA Ch.3" embed={embed === '1'}>
      <EnginePlayground />
    </PlaygroundShell>
  );
}
