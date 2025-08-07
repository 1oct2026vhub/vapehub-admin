import { Metadata } from 'next';
import MailSubscriptionSettingsPageClient from './MailSubscriptionSettingsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Mail Subscription Settings | VapeHub',
};

// This page.tsx is now a Server Component
export default function MailSubscriptionSettingsPage() {
  return <MailSubscriptionSettingsPageClient />;
} 