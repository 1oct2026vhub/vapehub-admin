import { Metadata } from 'next';
import PromotionalEmailPageClient from './PromotionalEmailPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Promotional Email | VapeHub',
};

// This page.tsx is now a Server Component
export default function PromotionalEmailPage() {
  return <PromotionalEmailPageClient />;
} 