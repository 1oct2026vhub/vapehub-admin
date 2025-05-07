// src/app/(control-panel)/apps/product-category/create-category/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import { Metadata } from "next";
import CreateCategoryFormClient from "./CreateCategoryForm"; // Assuming CreateCategoryForm.tsx is the client logic

export const metadata: Metadata = {
  title: "Create New Product Category | VapeHub",
  description: "Add a new product category to the platform.",
};

export default function CreateCategoryPage() {
  return <CreateCategoryFormClient />;
}
