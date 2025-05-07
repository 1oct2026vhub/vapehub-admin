// src/app/(control-panel)/apps/product-brand/create-brand/page.tsx
// THIS FILE MUST NOT HAVE "use client";
import { Metadata } from "next"; // Corrected type import if it was 'type { Metadata }'
import CreateBrandFormClient from "./CreateBrandForm"; // Assuming CreateBrandForm.tsx is the client logic

export const metadata: Metadata = {
  title: "Create New Brand | VapeHub",
  description: "Add a new product brand to the platform.",
};

export default function CreateBrandPage() {
  return <CreateBrandFormClient />;
}
