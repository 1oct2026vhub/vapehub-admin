import { Metadata } from 'next';
import SeoListPageClient from './SeoListPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'SEO Management | VapeHub',
};

// This page.tsx is now a Server Component
export default function SeoListPage() {
  return <SeoListPageClient />;
} 