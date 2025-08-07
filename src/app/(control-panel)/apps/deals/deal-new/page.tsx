import { Metadata } from 'next';
import NewDealPageClient from './NewDealPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Deal | VapeHub',
};

// This page.tsx is now a Server Component
export default function NewDealPage() {
  return <NewDealPageClient />;
} 