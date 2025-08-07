import { Metadata } from 'next';
import ContactUsPageClient from './ContactUsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Contact Us | VapeHub',
};

// This page.tsx is now a Server Component
export default function ContactUsPage() {
  return <ContactUsPageClient />;
} 