// src/app/(control-panel)/apps/shop-by-categories/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import React from "react";
import { Metadata } from "next";
import ShopByCategoriesPageClient from "./ShopByCategoriesPageClient";

export const metadata: Metadata = {
  title: "Shop By Categories | VapeHub",
  description: "Manage shop by categories",
};

export default function ShopByCategoriesPage() {
  return <ShopByCategoriesPageClient />;
}

