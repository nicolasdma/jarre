import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — Jarre',
  description: 'Sign in to your Jarre learning account',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
