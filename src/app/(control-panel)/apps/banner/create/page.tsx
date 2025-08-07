import { Metadata } from 'next';
import CreateBannerPageClient from './CreateBannerPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Banner | VapeHub',
};

// This page.tsx is now a Server Component
export default function CreateBannerPage() {
  return <CreateBannerPageClient />;
} 