"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUpload from "@/components/Shared/FormFileUpload";
import { usePost, useFetch } from "@/hooks/useFetch";
import { updateCategory, categoryDetails } from "@/services/apiProductCategory";
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
  name: z.string().min(1, "Category Name is required").max(50, "Name must be less than 50 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),
  description: z.string().optional(),
  logo: z.union([
    z.undefined(),
    z.null(),
    z.string(),  // For existing logo URLs
    z.instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File size must be less than 5MB"
      )
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      )
  ]).optional().nullable(),
  parent_id: z.union([
    z.number(),
    z.string().transform((val) => (val === "" ? null : Number(val))),
    z.null(),
    z.undefined()
  ]).optional().nullable(),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  logo: undefined,
  parent_id: undefined,
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File | string | null | undefined;
  logo_url?: string;
  parent_id?: number | null;
};

const EditCategoryForm = ({ category }: { category: FormType }) => {
  const router = useRouter();
  const { id } = useParams();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setValue, watch } = useForm({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch the name field to display character count
  const nameValue = watch("name") || "";
  const nameLength = nameValue.length;
  const nameRemaining = 50 - nameLength;

  const { isValid, errors, dirtyFields } = formState;
  const { trigger: triggerUpdateCategory, isMutating } = usePost(
    "updateCategory",
    updateCategory,
  );

  // Check if required fields are filled
  const areRequiredFieldsFilled = () => {
    return (
      nameValue.trim() !== "" &&
      watch("slug")?.trim() !== "" &&
      !errors.name &&
      !errors.slug
    );
  };

  // Prefill form when category data is available
  useEffect(() => {
    if (category) {
      setValue("name", category.name);
      setValue("slug", category.slug);
      setValue("description", category.description || "");
      // Handle parent_id properly
      if (category.parent_id !== undefined && category.parent_id !== null) {
        setValue("parent_id", Number(category.parent_id));
      } else {
        setValue("parent_id", null);
      }
      // Set the logo field with the existing logo URL
      if (category.logo_url) {
        setValue("logo", category.logo_url);
      }
    }
  }, [category, setValue]);

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
        formData.slug.toLowerCase().replace(/\s+/g, "-"),
      );

      if (formData.description) {
        formDataObj.append("description", formData.description);
      }

      // Handle parent_id properly
      if (formData.parent_id !== undefined && formData.parent_id !== null) {
        formDataObj.append("parent_id", formData.parent_id.toString());
      } else if (formData.parent_id === null) {
        formDataObj.append("parent_id", "");
      }

      // Only append logo if it's a File instance
      if (formData.logo instanceof File) {
        formDataObj.append("logo", formData.logo);
      } else if (formData.logo === null) {
        // If logo is explicitly set to null, it means we want to remove it
        formDataObj.append("logo", "");
      }

      // Debugging: Log form data
      for (let [key, value] of formDataObj.entries()) {
        console.log(`${key}:`, value);
      }

      // Get the category ID from the URL params
      // const params = new URLSearchParams(window.location.search);
      // const categoryId = params.get('id');

      // if (!categoryId) {
      //   throw new Error("Category ID is required");
      // }

      // Call the updateCategory API with the correct ID format
      await updateCategory(id, formDataObj);

      showSnackbar("Category updated successfully!", "success");
      router.push("/apps/product-category");
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

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Edit Category
        </Typography>
      </div>

      {isLoading && <p>Loading category data...</p>}

      {!isLoading && (
        <form
          name="categoryForm"
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
            label="Category Name"
            type="text"
            required
          />
          <div className="text-xs text-gray-500 -mt-3 mb-4">
            {nameLength} / 50 characters used {nameRemaining < 0 ? "(exceeded maximum)" : ""}
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
          <FormInputField
            name="parent_id"
            control={control}
            label="Parent Category ID"
            type="number"
          />
          <FormFileUpload
            name="logo"
            control={control}
            label="Category Logo"
            setValue={setValue}
            existingImage={category?.logo_url}
            onDelete={() => setValue("logo", null, { shouldValidate: true })}
          />

          <AppButton
            label="Update"
            loading={isLoading}
            type="submit"
            fullWidth
            size="large"
            disabled={!areRequiredFieldsFilled() || isMutating}
            className="mt-4 w-full"
          />
        </form>
      )}
    </div>
  );
};

export default EditCategoryForm;
