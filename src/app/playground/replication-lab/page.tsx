import Link from 'next/link';
import { ReplicationPlayground } from './replication-playground';

export default function ReplicationLabPage() {
  return (
    <div className="h-screen flex flex-col bg-[#faf9f6]">
      <header className="border-b border-[#e8e6e0] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 border border-[#4a5d4a] flex items-center justify-center">
              <span className="text-[#4a5d4a] font-mono text-[10px]">J</span>
            </div>
          </Link>
          <div className="w-px h-4 bg-[#e8e6e0]" />
          <span className="font-mono text-[11px] tracking-[0.15em] text-[#2c2c2c] uppercase">
            Replication Lab
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#a0a090] tracking-wider">
          DDIA Ch.5
        </span>
      </header>
      <div className="flex-1 min-h-0">
        <ReplicationPlayground />
      </div>
    </div>
  );
}
