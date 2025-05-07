"use client";

import { useSearchParams, useParams } from "next/navigation";
import EditTermForm from "./EditTerm"; // Assuming EditTerm.tsx is the form component

export default function TermUpdateClientPage() {
  const searchParams = useSearchParams();
  const params = useParams(); // To get ID from path if needed, though current logic uses searchParams
  
  // Null check for searchParams before calling .get()
  const termDataString = searchParams ? searchParams.get("termData") : null;
  
  // Access id safely. If params is null, id will be undefined.
  // If params.id is an array, take the first element, otherwise use it as is.
  const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined;

  const term = termDataString
    ? JSON.parse(decodeURIComponent(termDataString))
    : null;

  // Existing console log for debugging
  console.log("Term data in client page component:", term);
  console.log("Term ID from params:", id);


  if (!term && id) {
    // Potentially fetch term by ID if not in searchParams, or show error/redirect
    console.warn(`Term data not found in searchParams for ID: ${id}. EditTermForm might not have initial data.`);
    // return <p>Term data is missing. Please navigate from the terms list.</p>;
  }

  if (!term) {
     return <p>No term data found. Please go back and try again.</p>;
  }

  // Assuming EditTermForm takes a 'term' prop
  return <EditTermForm/>;
} 