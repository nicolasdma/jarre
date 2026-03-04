import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Courses — Jarre',
  description: 'Unified learning hub',
};

export default function DashboardPage() {
  redirect('/library');
}
