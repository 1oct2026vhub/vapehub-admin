// src/app/(control-panel)/apps/product-brand/create-brand/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import { Metadata } from "next"; // Corrected type import if it was 'type { Metadata }'
import React from "react";
import CreateBrandForm from "./CreateBrandForm"; // Assuming CreateBrandForm.tsx is the client logic

export const metadata: Metadata = {
  title: "Create Product Brand | VapeHub",
  description: "Add a new product brand",
};

export default function CreateBrandPage() {
  return <CreateBrandForm />;
}
