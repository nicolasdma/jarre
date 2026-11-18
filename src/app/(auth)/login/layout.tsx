import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar — Jarre',
  description: 'Entrá a tu cuenta de Jarre',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
