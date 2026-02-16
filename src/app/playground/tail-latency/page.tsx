import Link from 'next/link';
import { TailLatencyPlayground } from './tail-latency-playground';

interface Props {
  searchParams: Promise<{ embed?: string }>;
}

export default async function TailLatencyPage({ searchParams }: Props) {
  const { embed } = await searchParams;
  const isEmbed = embed === '1';

  return (
    <div className="h-screen flex flex-col bg-j-bg">
      {!isEmbed && (
        <header className="border-b border-j-border px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 border border-j-accent flex items-center justify-center">
                <span className="text-j-accent font-mono text-[10px]">J</span>
              </div>
            </Link>
            <div className="w-px h-4 bg-j-border" />
            <span className="font-mono text-[11px] tracking-[0.15em] text-j-text uppercase">
              Tail Latency Lab
            </span>
          </div>
          <span className="font-mono text-[10px] text-j-text-tertiary tracking-wider">
            The Tail at Scale
          </span>
        </header>
      )}
      <div className="flex-1 min-h-0">
        <TailLatencyPlayground />
      </div>
    </div>
  );
}
