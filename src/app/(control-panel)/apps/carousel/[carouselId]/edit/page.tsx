import { Metadata } from 'next';
import EditCarouselPageClient from './EditCarouselPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Edit Carousel | VapeHub',
};

// This page.tsx is now a Server Component
export default function EditCarouselPage() {
  return <EditCarouselPageClient />;
} 