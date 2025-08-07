import { Metadata } from 'next';
import EditBannerPageClient from './EditBannerPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Banner | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditBannerPage() {
  return <EditBannerPageClient />;
} 