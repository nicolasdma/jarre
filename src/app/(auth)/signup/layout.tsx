import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up — Jarre',
  description: 'Create your Jarre learning account',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
