"use client";
import { useSearchParams } from "next/navigation";
import EditForm from "../EditForm";

const EditVariantPage = () => {
  const searchParams = useSearchParams();
  const variantData = searchParams.get("brandData");

  const brand = variantData
    ? JSON.parse(decodeURIComponent(variantData))
    : null;

  //   if (!user) return <p>No user data found.</p>;

  return <EditForm  />;
};

export default EditVariantPage;
