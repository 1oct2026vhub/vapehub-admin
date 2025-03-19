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
} from "@/services/apiProduct";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormSelectField from "@/components/Shared/SelectField";
import { useProductForm } from "../ProductFormContext";
import { getAuthToken } from "@/utils/auth";
import FormSearchableSelectField from "@/components/Shared/FormSearchableSelectField";
// import FormCKEditor from '@/components/Shared/FormCKEditor';

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  category_id: z.number().min(1, "Category is required"),
  brand_id: z.number().min(1, "Brand is required"),
  is_new: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function BasicInfoTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  const { data: categories } = useFetch(
    ["productCategoryList", {}],
    listProductCategory,
    {},
  );
  const { data: brands } = useFetch(
    ["productBrandList", {}],
    listProductBrand,
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const { formData, updateFormData, nextStep, markStepAsCompleted } =
    useProductForm();
  const [productId, setProductId] = useState<number | null>(null);

  const {
    control,
    setValue,
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
      is_new: true,
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      console.log("Starting product creation process...");

      // Validate required fields
      if (!data.name || !data.slug || !data.category_id || !data.brand_id) {
        throw new Error("Please fill in all required fields");
      }

      // Format the data according to the API requirements
      const productData: CreateProductData = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || "",
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

      console.log("Making API call to create product...");
      const response = await createProduct(productData);
      console.log("Product creation response:", response);
      const newProductId = response.data.id; // ✅ Get the newly created product ID
      setProductId(newProductId);

      if (!response?.data?.id) {
        throw new Error("Failed to create product: No ID returned");
      }

      console.log("Product created successfully with ID:", response.data.id);

      updateFormData({
        ...data,
        productId: newProductId,
        hasErrors: false,
      });

      showSnackbar("Product details saved successfully", "success");
      router.push(`/apps/product/new?productId=${newProductId}`);
      nextStep();
    } catch (error: any) {
      console.error("Detailed error in BasicInfoTab:", {
        error,
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config,
        stack: error.stack,
      });

      updateFormData({ hasErrors: true });

      // Show more specific error messages
      if (error.message === "Authentication required. Please login again.") {
        showSnackbar(error.message, "error");
        window.location.href = "/sign-in";
      } else if (error.message) {
        showSnackbar(error.message, "error");
      } else if (error.response?.data?.message) {
        showSnackbar(error.response.data.message, "error");
      } else {
        showSnackbar(
          "Failed to save product details. Please try again.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ On component mount, handle localStorage clearing logic
  useEffect(() => {
    const urlProductId = searchParams.get("productId");

    // If no productId in URL => clear the localStorage
    if (!urlProductId) {
      localStorage.removeItem("productId");
      setProductId(null);
    } else {
      // ✅ Use the productId from URL or localStorage
      const localStorageProductId = localStorage.getItem("productId");
      const finalProductId = urlProductId || localStorageProductId;

      if (finalProductId) {
        setProductId(Number(finalProductId));

        // ✅ Fetch product data
        const fetchProduct = async () => {
          try {
            const product = await getProduct(Number(finalProductId));

            // ✅ Populate form fields with product data
            setValue("name", product?.data?.name || "");
            setValue("slug", product?.data?.slug || "");
            setValue("description", product?.data?.description || "");
            setValue("category_id", product?.data?.category_id || 0);
            setValue("brand_id", product?.data?.brand_id || 0);
          } catch (error) {
            console.error("Error fetching product:", error);
            showSnackbar("Failed to load product details", "error");
          }
        };

        fetchProduct();
      }
    }
  }, [searchParams, setValue, showSnackbar]);

  console.log("ppprodddujdud", productId);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col justify-center"
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
      {/* ✅ Use CKEditor for Description */}
      {/* <FormCKEditor name="description" control={control} label="Description" /> */}
      <FormInputField
        name="description"
        control={control}
        label="Description"
        type="text"
      />
      {/* <FormSelectField
				name='category_id'
				control={control}
				label='Category'
				options={categories?.data?.categories?.map((category) => ({
					value: category.id,
					label: category.name
				})) || []}
						required
			/>
			<FormSelectField
				name='brand_id'
				control={control}
				label='Brand'
				options={brands?.data?.brands?.map((brand) => ({
					value: brand.id,
					label: brand.name
				})) || []}
						required
			/> */}
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
        loading={!categories} // Show loading indicator while data is loading
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
        loading={!brands} // Show loading indicator while data is loading
      />
      <AppButton
        label="Next"
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
