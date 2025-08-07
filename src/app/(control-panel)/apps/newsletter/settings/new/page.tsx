import { Metadata } from 'next';
import NewMailSubscriptionSettingPageClient from './NewMailSubscriptionSettingPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'New Mail Subscription Setting | VapeHub',
};

// This page.tsx is now a Server Component
export default function NewMailSubscriptionSettingPage() {
  return <NewMailSubscriptionSettingPageClient />;
} 