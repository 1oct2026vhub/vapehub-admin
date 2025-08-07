import { Metadata } from 'next';
import RefferalMethodsPageClient from './RefferalMethodsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Referral Methods | VapeHub',
};

// This page.tsx is now a Server Component
export default function RefferalMethodsPage() {
  return <RefferalMethodsPageClient />;
} 