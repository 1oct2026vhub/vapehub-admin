import { Metadata } from 'next';
import NewRefferalMethodPageClient from './NewRefferalMethodPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Referral Method | VapeHub',
};

// This page.tsx is now a Server Component
export default function NewRefferalMethodPage() {
  return <NewRefferalMethodPageClient />;
} 