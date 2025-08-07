import { Metadata } from 'next';
import CarouselList  from './CarouselList';
import PageBreadcrumb from '@/components/PageBreadcrumb';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Carousels | VapeHub',
};

export default function CarouselPage() {
  return (
    <div className="mx-auto p-4">
      <PageBreadcrumb />
      <CarouselList />
    </div>
  );
} 