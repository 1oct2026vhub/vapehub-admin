// src/app/(control-panel)/apps/product-category/create-category/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import { Metadata } from "next";
import React from "react";
import CreateCategoryForm from "./CreateCategoryForm"; // Assuming CreateCategoryForm.tsx is the client logic

export const metadata: Metadata = {
  title: "Create Product Category | VapeHub",
  description: "Add a new product category",
};

export default function CreateCategoryPage() {
  return <CreateCategoryForm />;
}
