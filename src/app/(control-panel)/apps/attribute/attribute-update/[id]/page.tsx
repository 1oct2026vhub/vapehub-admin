"use client";
import { useSearchParams, useParams } from "next/navigation";
import EditForm from "../EditForm";

const EditAttributePage = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const attributeData = searchParams.get("attributeData");
  
  // Get the ID from the URL params
  const { id } = params;

  const attribute = attributeData
    ? JSON.parse(decodeURIComponent(attributeData))
    : null;

  // Log for debugging
  console.log("Attribute ID from params:", id);
  console.log("Attribute data:", attribute);

  if (!attribute) {
    return <p>No attribute data found. Please go back and try again.</p>;
  }

  return <EditForm attribute={attribute} />;
};

export default EditAttributePage;
