import { Metadata } from 'next';
import ReferralMethodsPageClient from './ReferralMethodsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Referral Methods | VapeHub',
};

// This page.tsx is now a Server Component
export default function ReferralMethodsPage() {
  return <ReferralMethodsPageClient />;
} 