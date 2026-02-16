import { PlaygroundShell } from '@/components/playground/playground-shell';
import { VaultPlayground } from './vault-playground';

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
