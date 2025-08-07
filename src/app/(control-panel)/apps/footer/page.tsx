import { Metadata } from 'next';
import FooterClientWrapper from './FooterClientWrapper';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Footer | VapeHub',
};

// This page.tsx is now a Server Component
export default function FooterPage() {
  return <FooterClientWrapper />;
} 