import { Metadata } from 'next';
import EditDealPageClient from './EditDealPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Deal | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditDealPage() {
  return <EditDealPageClient />;
} 