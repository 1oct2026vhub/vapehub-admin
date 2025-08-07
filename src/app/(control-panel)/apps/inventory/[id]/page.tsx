import { Metadata } from 'next';
import InventoryDetailPageClient from './InventoryDetailPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Inventory Details | VapeHub',
};

// This page.tsx is now a Server Component
export default function InventoryDetailPage() {
  return <InventoryDetailPageClient />;
} 