import { Metadata } from 'next';
import SubscribersPageClient from './SubscribersPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Newsletter Subscribers | VapeHub',
};

// This page.tsx is now a Server Component
export default function SubscribersPage() {
  return <SubscribersPageClient />;
} 