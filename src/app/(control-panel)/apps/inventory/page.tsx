import { Metadata } from 'next';
import InventoryPageClient from './InventoryPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Inventory | VapeHub',
};

// This page.tsx is now a Server Component
export default function InventoryPage() {
  return <InventoryPageClient />;
} 