// src/app/(control-panel)/apps/product-brand/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import { Metadata } from 'next';
import BrandClientPage from "./Brand"; // Renaming import for clarity, assuming Brand.tsx is the client logic wrapper

export const metadata: Metadata = {
  title: 'Product Brands | VapeHub',
  description: 'Manage and view all product brands.',
};

export default function BrandListPage() {
  return <BrandClientPage />;
}
