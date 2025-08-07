import { Metadata } from 'next';
import EditLoyaltyPointPageClient from './EditLoyaltyPointPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Loyalty Points | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditLoyaltyPointPage() {
  return <EditLoyaltyPointPageClient />;
} 