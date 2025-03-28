"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useFetch } from "@/hooks/useFetch";
import { listProductCategory } from "@/services/apiProductCategory";
import { listProductBrand } from "@/services/apiProductBrand";
import {
  createProduct,
  getProduct,
  type CreateProductData,
  updateProduct,
} from "@/services/apiProduct";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { useProductForm } from "../ProductFormContext";
import { getAuthToken } from "@/utils/auth";
import FormSearchableSelectField from "@/components/Shared/FormSearchableSelectField";
import FormCKEditor from "@/components/Shared/FormCKEditor";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  description: z.string().optional().default(""),
  category_id: z.number().min(1, "Category is required"),
  brand_id: z.number().min(1, "Brand is required"),
  is_new: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function BasicInfoTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  // const { data: categories } = useFetch(
  //   ["productCategoryList", {}],
  //   listProductCategory,
  //   {}
  // );
  // const { data: brands } = useFetch(
  //   ["productBrandList", {}],
  //   listProductBrand,
  //   { limit: 100 }
  // );
  const { data: categories } = useFetch("categories", listProductCategory, {
    limit: 1000, // Request a high limit to get all brands
  });
  const { data: brands } = useFetch("brands", listProductBrand, {
    limit: 1000, // Request a high limit to get all brands
  });
  const [isLoading, setIsLoading] = useState(false);
  const { formData, updateFormData, nextStep, markStepAsCompleted } =
    useProductForm();
  const [productId, setProductId] = useState<number | null>(null);

  // Determine if we're in edit mode
  const isEditMode = Boolean(productId && productId > 0);

  const {
    control,
    trigger,
    setValue,
    reset,
    formState: { isValid, errors },
    handleSubmit,
  } = useForm<FormData>({
    mode: "all",
    defaultValues: {
      name: formData.name || "",
      slug: formData.slug || "",
      description: formData.description || "",
      category_id: formData.category_id || 0,
      brand_id: formData.brand_id || 0,
      // is_new: formData.is_new ?? true,
    },
    resolver: zodResolver(schema),
  });

  console.log("productId", productId);

  // Fetch product data when component mounts or productId changes
  useEffect(() => {
    const fetchProductData = async () => {
      const urlProductId = searchParams.get("productId");
      const finalProductId = urlProductId || localStorage.getItem("productId");

      if (finalProductId && finalProductId !== "new") {
        try {
          setProductId(Number(finalProductId));
          const response = await getProduct(Number(finalProductId));
          console.log("Product data received:", response?.data);

          if (response?.data) {
            const productData = response.data;

            // Update form with fetched data
            setValue("name", productData.name || "");
            setValue("slug", productData.slug || "");
            setValue("description", productData.description || "");
            setValue("category_id", productData.category_id || 0);
            setValue("brand_id", productData.brand_id || 0);
            setValue("is_new", productData.is_new ?? true);

            // Update form context
            updateFormData({
              name: productData.name || "",
              slug: productData.slug || "",
              description: productData.description || "",
              category_id: productData.category_id || 0,
              brand_id: productData.brand_id || 0,
              is_new: productData.is_new ?? true,
              productId: Number(finalProductId),
            });
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          // showSnackbar("Failed to load product details", "error");
        }
      } else {
        // Clear productId if we're creating a new product
        setProductId(null);
        localStorage.removeItem("productId");
      }
    };

    fetchProductData();
  }, [searchParams, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      console.log("Starting product creation/update process...");
      console.log("Form data to be submitted:", data);

      // Validate required fields
      if (!data.name || !data.slug || !data.category_id || !data.brand_id) {
        throw new Error("Please fill in all required fields");
      }

      // Format the data according to the API requirements
      const productData: CreateProductData = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description || "",
        category_id: Number(data.category_id),
        brand_id: Number(data.brand_id),
        is_new: Boolean(data.is_new),
      };

      console.log("Formatted product data:", productData);

      // Check if we have a valid token
      const token = getAuthToken();
      console.log("Auth token present:", !!token);

      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      let response;
      if (isEditMode) {
        // Update existing product
        console.log("Updating existing product with ID:", productId);
        response = await updateProduct(Number(productId), productData);
        showSnackbar("Product updated successfully", "success");

        // Update form data and stay on the same page
        updateFormData({
          ...data,
          productId: Number(productId),
          hasErrors: false,
        });
      } else {
        // Create new product
        console.log("Creating new product");
        response = await createProduct(productData);
        showSnackbar("Product created successfully", "success");

        // Update form data and move to next step
        updateFormData({
          ...data,
          productId: response.data.id,
          hasErrors: false,
        });

        // Update URL with the new product ID
        router.push(`/apps/product/edit?productId=${response.data.id}`);

        // Move to next step only for new products
        nextStep();
      }

      console.log("API response:", response);

      if (!response?.data?.id) {
        throw new Error("Failed to save product: No ID returned");
      }

      console.log("Product saved successfully with ID:", response.data.id);
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
    //   console.error("Detailed error in BasicInfoTab:", {
    //     error,
    //     message: error.message,
    //     response: error.response,
    //     request: error.request,
    //     config: error.config,
    //     stack: error.stack,
    //   });

    //   updateFormData({ hasErrors: true });

    //   // Show more specific error messages
    //   if (error.message === "Authentication required. Please login again.") {
    //     showSnackbar(error.message, "error");
    //     window.location.href = "/sign-in";
    //   } else if (error.message) {
    //     showSnackbar(error.message, "error");
    //   } else if (error.response?.data?.message) {
    //     showSnackbar(error.response.data.message, "error");
    //   } else {
    //     showSnackbar(
    //       "Failed to save product details. Please try again.",
    //       "error",
    //     );
    //   }
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col justify-center"
      onKeyDown={(e) => {
        // Prevent form submission on Enter key unless it's inside a button
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).tagName !== "BUTTON"
        ) {
          console.log("Preventing form submission from Enter key");
          e.preventDefault();
          return false;
        }
      }}
    >
      <FormInputField
        name="name"
        control={control}
        label="Name"
        type="text"
        required
      />
      <FormInputField
        name="slug"
        control={control}
        label="Slug"
        type="text"
        required
      />
      <FormCKEditor
        name="description"
        control={control}
        label="Description"
        defaultValue={formData.description || ""}
      />
      <FormSearchableSelectField
        name="category_id"
        control={control}
        label="Category"
        options={
          categories?.data?.categories?.map((category) => ({
            value: category.id,
            label: category.name,
          })) || []
        }
        required
        loading={!categories}
      />

      <FormSearchableSelectField
        name="brand_id"
        control={control}
        label="Brand"
        options={
          brands?.data?.brands?.map((brand) => ({
            value: brand.id,
            label: brand.name,
          })) || []
        }
        required
        loading={!brands}
      />
      <AppButton
        label={isEditMode ? "Update" : "Next"}
        loading={isLoading}
        type="submit"
        fullWidth
        size="large"
        disabled={!isValid || isLoading}
        className="mt-4"
      />
    </form>
  );
}

export default BasicInfoTab;
