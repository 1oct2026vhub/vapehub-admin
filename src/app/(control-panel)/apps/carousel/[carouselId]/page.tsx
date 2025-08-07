import { Metadata } from 'next';
import CarouselDetailPageClient from './CarouselDetailPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Carousel Details | VapeHub',
};

// This page.tsx is now a Server Component
export default function CarouselDetailPage() {
  return <CarouselDetailPageClient />;
} 