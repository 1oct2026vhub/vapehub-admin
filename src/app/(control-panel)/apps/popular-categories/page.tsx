// src/app/(control-panel)/apps/popular-categories/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import React from "react";
import { Metadata } from "next";
import PopularCategoriesPageClient from "./PopularCategoriesPageClient";

export const metadata: Metadata = {
  title: "Popular Categories | VapeHub",
  description: "Manage popular categories",
};

export default function PopularCategoriesPage() {
  return <PopularCategoriesPageClient />;
}

