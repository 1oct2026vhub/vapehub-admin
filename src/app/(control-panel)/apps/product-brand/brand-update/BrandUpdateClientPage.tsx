"use client";

import { useSearchParams, useParams } from "next/navigation";
import EditForm from "./EditForm"; // Assuming EditForm is in the same directory

export default function BrandUpdateClientPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  
  const brandDataString = searchParams ? searchParams.get("brandData") : null;
  
  // Access id safely. If params is null, id will be undefined.
  // If params.id is an array, take the first element, otherwise use it as is.
  // This also handles the case where id might not be on params.
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;

  const brand = brandDataString
    ? JSON.parse(decodeURIComponent(brandDataString))
    : null;

  if (!brand && id) {
    console.warn(`Brand data not found in searchParams for ID: ${id}. EditForm might not have initial data.`);
  }
  
  if (!brand) {
    return <p>No brand data found. Please go back and try again.</p>;
  }

  return <EditForm brand={brand} />;
} 