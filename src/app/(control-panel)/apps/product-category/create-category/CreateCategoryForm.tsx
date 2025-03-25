"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { createCategory } from "@/services/apiProductCategory";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormFileUpload from "@/components/Shared/FormFileUpload";
import { useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

// const schema = z.object({
//   name: z.string().min(1, "Brand Name is required"),
//   slug: z.string().min(1, "Slug is required"),
//   description: z.string().optional(),
//   logo: z.instanceof(File).optional(),
//   parent_id: z.string().optional().nullable(), // ✅ Added Parent ID
// });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const schema = z.object({
  name: z.string()
    .min(1, "Category Name is required")
    .max(50, "Category Name must not exceed 50 characters"),

  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),

  description: z.string().optional(),

  logo: z
    .instanceof(File, { message: "Logo is required" })
    .refine((file) => file instanceof File, "Logo is required")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 5MB"
    )
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, and .webp formats are supported"
    ),
  parent_id: z.string().optional().nullable(),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  logo: null,
  parent_id: null, // ✅ Ensure default is null
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File;
  parent_id?: string | null;
};

function CreateCategoryForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setValue } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerCreateCategory, isMutating } = usePost(
    "createCategory",
    createCategory,
  );

  async function onSubmit(formData: FormType) {
    setIsLoading(true);

    try {
      const formDataObj = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (!value) return; // Skip falsy values like `null` or `undefined`

        if (key === "slug" && typeof value === "string") {
          value = value.toLowerCase(); // ✅ Safe conversion
        }

        if (key === "logo" && value instanceof File) {
          formDataObj.append("logo", value, value.name); // ✅ Ensure file is sent as binary
        } else if (typeof value === "string") {
          formDataObj.append(key, value); // ✅ Append only valid string values
        }
      });

      // ✅ Debugging: Check FormData values
      for (const pair of formDataObj.entries()) {
        console.log(pair[0], pair[1]);
      }

      await triggerCreateCategory(formDataObj);
      showSnackbar("Category created successfully!", "success");
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
  }

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          New Category
        </Typography>
      </div>
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
        <FormInputField
          name="description"
          control={control}
          label="Description"
          type="text"
        />
        <FormFileUpload
          name="logo"
          control={control}
          label="Logo"
          setValue={setValue}
        />
        <div className="mt-6">
          <FormInputField
            name="parent_id"
            control={control}
            label="Parent ID"
            type="text"
          />
        </div>

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          disabled={!isValid || isMutating}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default CreateCategoryForm;
