import { Metadata } from 'next';
import EditMailSubscriptionSettingPageClient from './EditMailSubscriptionSettingPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Mail Subscription Setting | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditMailSubscriptionSettingPage() {
  return <EditMailSubscriptionSettingPageClient />;
} 