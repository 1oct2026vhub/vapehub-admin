import { Metadata } from 'next';
import BannerPageClient from './BannerPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Banners | VapeHub',
};

// This page.tsx is now a Server Component
export default function BannerPage() {
  return <BannerPageClient />;
} 