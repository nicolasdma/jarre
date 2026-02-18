import type { Metadata } from 'next';
import { PlaygroundShell } from '@/components/playground/playground-shell';
import { VaultPlayground } from './vault-playground';

export const metadata: Metadata = {
  title: 'Vault Memory Explorer — Jarre',
  description: 'Interactive playground for exploring ClawVault agent memory patterns',
};

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function ClawVaultMemoryPage({ searchParams }: Props) {
  const { embed } = await searchParams;

  return (
    <PlaygroundShell title="Vault Memory Explorer" subtitle="ClawVault" embed={embed === '1'}>
      <VaultPlayground />
    </PlaygroundShell>
  );
}
