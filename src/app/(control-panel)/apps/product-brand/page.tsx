// src/app/(control-panel)/apps/product-brand/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import React from "react";
import { Metadata } from "next";
import ProductBrand from "./Brand";

export const metadata: Metadata = {
  title: "Product Brands | VapeHub",
  description: "Manage product brands",
};

export default function BrandListPage() {
  return <ProductBrand />;
}
