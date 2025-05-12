// src/app/(control-panel)/apps/product-category/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import React from "react";
import { Metadata } from "next";
import ProductCategoryClientPage from "./Category"; // ProductCategory.tsx is the client component

export const metadata: Metadata = {
  title: "Product Categories | VapeHub",
  description: "Manage product categories",
};

export default function ProductCategoryListPage() {
  return <ProductCategoryClientPage />;
}
