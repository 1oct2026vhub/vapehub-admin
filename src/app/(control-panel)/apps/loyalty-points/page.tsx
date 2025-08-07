import { Metadata } from 'next';
import LoyaltyPointsPageClient from './LoyaltyPointsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Loyalty Points | VapeHub',
};

// This page.tsx is now a Server Component
export default function LoyaltyPointsPage() {
  return <LoyaltyPointsPageClient />;
} 