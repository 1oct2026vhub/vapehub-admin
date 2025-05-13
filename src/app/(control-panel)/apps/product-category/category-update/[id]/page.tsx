"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import EditForm from "../EditForm";

const EditCategoryPage = () => {
  const searchParams = useSearchParams();
  useEffect(() => {
    document.title = "Update Product Category | VapeHub";
  }, []);
  const categoryData = searchParams ? searchParams.get("categoryData") : null;

  const category = categoryData
    ? JSON.parse(decodeURIComponent(categoryData))
    : null;

  //   if (!user) return <p>No user data found.</p>;
  return <EditForm category={category} />;
};

export default EditCategoryPage;
