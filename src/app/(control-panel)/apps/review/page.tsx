import { Metadata } from 'next';
import ReviewsPageClient from './ReviewsPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Reviews | VapeHub',
};

// This page.tsx is now a Server Component
export default function ReviewsPage() {
  return <ReviewsPageClient />;
} 