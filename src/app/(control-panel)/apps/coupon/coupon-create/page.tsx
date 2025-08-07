import { Metadata } from 'next';
import CreateCouponPageClient from './CreateCouponPageClient';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Coupon | VapeHub',
};

// This page.tsx is now a Server Component
export default function CreateCouponPage() {
  return <CreateCouponPageClient />;
} 