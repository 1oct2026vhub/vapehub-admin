"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUpload from "@/components/Shared/FormFileUpload";
import { usePost, useFetch } from "@/hooks/useFetch";
import {
  updateBrand,
  brandDetails,
  removeBrandImage,
} from "@/services/apiProductBrand";
import { useSnackbar } from "@/contexts/SnackbarContext";
import axiosInstance from "@/utils/axiosApi";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const schema = z.object({
  name: z
    .string()
    .min(1, "Brand Name is required")
    .max(50, "Name must be less than 50 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  description: z.string().optional(),
  logo: z
    .union([
      z.undefined(),
      z.null(),
      z.string(), // For existing logo URLs
      z
        .instanceof(File)
        .refine(
          (file) => file.size <= MAX_FILE_SIZE,
          "File size must be less than 5MB"
        )
        .refine(
          (file) => ACCEPTED_FILE_TYPES.includes(file.type),
          "Only .jpg, .jpeg, .png, and .webp formats are supported"
        ),
    ])
    .optional()
    .nullable(),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  logo: undefined,
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File | string | null | undefined;
  logo_url?: string;
};

const EditBrandForm = ({ brand: initialBrand }: { brand: FormType }) => {
  const router = useRouter();
  const { id } = useParams();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isImageDeleting, setIsImageDeleting] = useState(false);

  // Use ref to maintain a mutable reference to the brand data
  const brandRef = useRef<FormType>(initialBrand);

  const { control, formState, handleSubmit, setValue, watch } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  const { isValid, errors } = formState;
  const { trigger: triggerUpdateBrand, isMutating } = usePost(
    "updateBrand",
    updateBrand
  );

  // Prefill form when brand data is available
  useEffect(() => {
    if (initialBrand) {
      brandRef.current = initialBrand;
      setValue("name", initialBrand.name);
      setValue("slug", initialBrand.slug);
      setValue("description", initialBrand.description || "");
      // Set the logo field with the existing logo URL
      if (initialBrand.logo_url) {
        setValue("logo", initialBrand.logo_url);
      }
    }
  }, [initialBrand, setValue]);

  const onSubmit = async (formData: FormType) => {
    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      // Ensure required fields are present and properly formatted
      if (!formData.name || !formData.slug) {
        throw new Error("Name and slug are required fields");
      }

      // Append each field to FormData
      formDataObj.append("name", formData.name.trim());
      formDataObj.append(
        "slug",
        formData.slug.toLowerCase().replace(/\s+/g, "-")
      );

      if (formData.description) {
        formDataObj.append("description", formData.description);
      }

      // Only append logo if it's a File instance
      if (formData.logo instanceof File) {
        formDataObj.append("logo", formData.logo);
      } else if (formData.logo === null) {
        // If logo is explicitly set to null, it means we want to remove it
        formDataObj.append("logo", "");
      }

      // ✅ Use the API service function instead of direct API call
      const response = await updateBrand(id, formDataObj);

      showSnackbar("Brand updated successfully!", "success");
      router.push("/apps/product-brand");
    } catch (error) {
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
  };

  // Add handler to delete brand image
  const handleImageDelete = async () => {
    try {
      setIsImageDeleting(true);

      // Call the API first
      await removeBrandImage(id);

      // Only update the UI after successful API call
      setValue("logo", null, { shouldValidate: true });

      // Update the brand object to reflect the removal of the image
      if (brandRef.current) {
        brandRef.current.logo_url = null;
        brandRef.current.logo = null;
      }

      showSnackbar("Brand image removed successfully", "success");
    } catch (error) {
      console.error("Error removing brand image:", error);
      showSnackbar("Failed to remove brand image", "error");

      // No need to restore anything since we didn't change the form state yet
    } finally {
      setIsImageDeleting(false);
    }
  };

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Brand
        </Typography>
      </div>

      {isLoading && <p>Loading brand data...</p>}

      {!isLoading && (
        <form
          name="brandForm"
          noValidate
          className="flex w-full flex-col justify-center"
          onSubmit={handleSubmit(onSubmit)}
        >
          {errors?.root?.message && (
            <Alert className="mb-8" severity="error">
              {errors?.root?.message}
            </Alert>
          )}

          <FormInputField
            name="name"
            control={control}
            label="Brand Name"
            type="text"
            required
          />
          <div className="text-xs text-gray-500 -mt-3 mb-4">
            {nameLength} / 50 characters used{" "}
            {nameRemaining < 0 ? "(exceeded maximum)" : ""}
          </div>
          <FormInputField
            name="slug"
            control={control}
            label="Slug"
            type="text"
            required
          />
          <FormInputField
            name="description"
            control={control}
            label="Description"
            type="text"
          />
          <FormFileUpload
            name="logo"
            control={control}
            label="Brand Logo"
            setValue={setValue}
            existingImage={brandRef.current?.logo_url}
            onDelete={handleImageDelete}
            isDeleting={isImageDeleting}
          />

          <AppButton
            label="Update"
            loading={isLoading}
            type="submit"
            fullWidth
            size="large"
            // disabled={!isValid || isMutating}
            className="mt-4 w-full"
          />
        </form>
      )}
    </div>
  );
};

export default EditBrandForm;
