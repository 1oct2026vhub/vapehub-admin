"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EditForm from "../EditForm";
import { categoryDetails } from "@/services/apiProductCategory";
import FuseLoading from "@fuse/core/FuseLoading";
import { useSnackbar } from "@/contexts/SnackbarContext";

const EditCategoryPage = () => {
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const categoryId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Update Product Category | VapeHub";
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await categoryDetails(categoryId);
        if (response?.data) {
          setCategory(response.data);
        }
      } catch (error: any) {
        console.error("Failed to fetch category:", error);
        showSnackbar(
          error?.message || "Failed to load category details",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, showSnackbar]);

  if (loading) {
    return <FuseLoading />;
  }

  if (!category) {
    return <p>Category not found.</p>;
  }

  return <EditForm category={category} />;
};

export default EditCategoryPage;
