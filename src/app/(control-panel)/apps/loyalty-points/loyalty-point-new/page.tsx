import { Metadata } from 'next';
import CreateLoyaltyPointPageClient from './CreateLoyaltyPointPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Loyalty Points | VapeHub',
};

// This page.tsx is now a Server Component
export default function CreateLoyaltyPointPage() {
  return <CreateLoyaltyPointPageClient />;
} 