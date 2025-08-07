import { Metadata } from 'next';
import EditRefferalMethodPageClient from './EditRefferalMethodPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Referral Method | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditRefferalMethodPage() {
  return <EditRefferalMethodPageClient />;
} 