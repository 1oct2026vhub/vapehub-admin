import { Metadata } from 'next';
import EditReferralMethodPageClient from './EditReferralMethodPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Referral Method | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditReferralMethodPage() {
  return <EditReferralMethodPageClient />;
} 