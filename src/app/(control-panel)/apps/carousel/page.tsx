import CarouselList  from './CarouselList';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export default function CarouselPage() {
  return (
    <div className="container mx-auto p-4">
      <PageBreadcrumb />
      {/* <h1 className="text-2xl font-bold mb-4">Carousel Management</h1> */}
      <CarouselList />
    </div>
  );
} 