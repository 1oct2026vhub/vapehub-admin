"use client";

import { useSearchParams, useParams } from "next/navigation";
import EditForm from "./EditForm"; // Assuming EditForm is in the same directory or correct path

export default function AttributeUpdateClientPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const attributeDataString = searchParams.get("attributeData");
  
  const { id } = params; // id from URL path

  const attribute = attributeDataString
    ? JSON.parse(decodeURIComponent(attributeDataString))
    : null;

  // It might be more robust to fetch attribute data by ID if attributeDataString is not present or invalid
  // For now, strictly follows existing logic.

  if (!attribute && id) {
    // If attributeData is not in searchParams, you might want to redirect or show a specific error
    // or even try to fetch by id here (though that adds complexity to a client component initially designed for data via props/searchParams)
    console.warn(`Attribute data not found in searchParams for ID: ${id}. EditForm might not have initial data.`);
    // Depending on EditForm's capability to handle a null attribute initially (e.g., for creation or fetching internally)
    // return <p>Attribute data missing for update. Please navigate from the attributes list.</p>;
  }
  
  if (!attribute) {
    // This case handles if attribute is null even after the above checks (e.g. if id is also missing, though less likely with dynamic route)
    return <p>No attribute data found. Please go back and try again.</p>;
  }

  return <EditForm attribute={attribute} />;
} 