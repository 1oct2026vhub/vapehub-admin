import { Metadata } from 'next';
import DealsPageClient from './DealsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Deals | VapeHub',
};

// This page.tsx is now a Server Component - deals list page
export default function DealsPage() {
  return <DealsPageClient />;
} 