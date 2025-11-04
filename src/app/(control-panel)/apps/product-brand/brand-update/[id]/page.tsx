"use client";
import { useParams } from "next/navigation";
import EditForm from "../EditForm";
import { useEffect, useState } from "react";
import { brandDetails } from "@/services/apiProductBrand";
import FuseLoading from "@fuse/core/FuseLoading";
import { useSnackbar } from "@/contexts/SnackbarContext";

const EditBrandPage = () => {
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const brandId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Update Product Brand | VapeHub";
  }, []);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!brandId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await brandDetails(brandId);
        if (response?.data) {
          setBrand(response.data);
        }
      } catch (error: any) {
        console.error("Failed to fetch brand:", error);
        showSnackbar(
          error?.message || "Failed to load brand details",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [brandId, showSnackbar]);

  if (loading) {
    return <FuseLoading />;
  }

  if (!brand) {
    return <p>Brand not found.</p>;
  }

  return <EditForm brand={brand} />;
};

export default EditBrandPage;

// 'use client'
// import { useSearchParams } from 'next/navigation';
// import EditForm from '../EditForm';

// const EditUserPage = () => {
//   const searchParams = useSearchParams();
//   const brandId = searchParams.get('brandId');

// //   const brand = brandData ? JSON.parse(decodeURIComponent(brandData)) : null;

// //   if (!user) return <p>No user data found.</p>;

//   return <EditForm brandId={brandId} />;
// };

// export default EditUserPage;
