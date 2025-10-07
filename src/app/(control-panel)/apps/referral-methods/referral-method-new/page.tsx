import { Metadata } from 'next';
import NewReferralMethodPageClient from './NewReferralMethodPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Referral Method | VapeHub',
};

// This page.tsx is now a Server Component
export default function NewReferralMethodPage() {
  return <NewReferralMethodPageClient />;
} 