"use client";

import { useParams } from "next/navigation";
import EditForm from "./EditForm"; // Assuming EditForm is in the same directory or correct path

export default function AttributeUpdateClientPage() {
  const params = useParams();
  
  // Access id safely. If params is null, id will be undefined.
  // If params.id is an array, take the first element, otherwise use it as is.
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;

  if (!id) {
    return <p>Attribute ID not found in URL. Please check the link and try again.</p>;
  }

  // EditForm will fetch the attribute data by ID using the getAttributeDetails API
  return <EditForm />;
} 