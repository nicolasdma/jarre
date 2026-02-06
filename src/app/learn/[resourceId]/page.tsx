import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DDIAChapter1 } from './ddia-ch1';
import { DDIAChapter2 } from './ddia-ch2';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

/** Maps resource IDs to their interactive playgrounds */
const PLAYGROUND_ROUTES: Record<string, string> = {
  'ddia-ch3': '/playground/storage-engine',
};

/** Resources with deep explanation components */
const EXPLANATION_COMPONENTS: Record<string, () => React.JSX.Element> = {
  'ddia-ch1': () => <DDIAChapter1 />,
  'ddia-ch2': () => <DDIAChapter2 />,
};

const AVAILABLE_RESOURCES = new Set([
  ...Object.keys(PLAYGROUND_ROUTES),
  ...Object.keys(EXPLANATION_COMPONENTS),
]);

export default async function LearnPage({ params }: PageProps) {
  const { resourceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/learn/${resourceId}`);
  }

  // If this resource has a playground, redirect there
  if (PLAYGROUND_ROUTES[resourceId]) {
    redirect(PLAYGROUND_ROUTES[resourceId]);
  }

  // Get resource
  const { data: resource } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (!resource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-[#c4a07a]">Recurso no encontrado</p>
      </div>
    );
  }

  if (!AVAILABLE_RESOURCES.has(resourceId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] p-8">
        <p className="mb-4 text-[#7a7a6e]">Explicacion no disponible aun para este recurso.</p>
        <Link href="/library" className="text-[#4a5d4a] hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const renderContent = EXPLANATION_COMPONENTS[resourceId];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Minimal header */}
      <div className="sticky top-0 z-50 border-b border-[#e8e6e0] bg-[#faf9f6]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
          <Link
            href="/library"
            className="text-sm text-[#9c9a8e] hover:text-[#2c2c2c] transition-colors"
          >
            ← Biblioteca
          </Link>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            Explicacion Profunda
          </span>
          <Link
            href={`/evaluate/${resourceId}`}
            className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-3 py-1.5 uppercase hover:bg-[#3d4d3d] transition-colors"
          >
            Evaluar
          </Link>
        </div>
      </div>

      {/* Content */}
      {renderContent?.()}
    </div>
  );
}
