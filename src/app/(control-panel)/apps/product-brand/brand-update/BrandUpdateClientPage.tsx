"use client";

import { useSearchParams, useParams } from "next/navigation";
import EditForm from "./EditForm"; // Assuming EditForm is in the same directory

export default function BrandUpdateClientPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const brandDataString = searchParams.get("brandData");
  
  const { id } = params; // id from URL path

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