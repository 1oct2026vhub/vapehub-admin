"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography, Box } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { createCategory } from "@/services/apiProductCategory";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { useState, useEffect } from "react";
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
const MAX_IMAGE_WIDTH = 236;
const MAX_IMAGE_HEIGHT = 204;

// Helper function to validate image dimensions
const validateImageDimensions = (file: File): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true });
      return;
    }

    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width > MAX_IMAGE_WIDTH || img.height > MAX_IMAGE_HEIGHT) {
        resolve({ 
          valid: false, 
          dimensions: { 
            width: img.width, 
            height: img.height 
          } 
        });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: true }); // Assume valid on error to avoid blocking submission
    };
    img.src = URL.createObjectURL(file);
  });
};

const schema = z.object({
  name: z.string()
    .min(1, "Category Name is required")
    .max(50, "Category Name must not exceed 50 characters"),

  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),

  description: z.string().optional(),

  logo: z.union([
    z.undefined(),
    z.null(),
    z.instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File size must be less than 5MB"
      )
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      )
      .refine(
        async (file) => {
          const result = await validateImageDimensions(file);
          return result.valid;
        },
        `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels`
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
  logo: null,
  parent_id: null,
};

export type FormType = {
  name: string;
  slug: string;
  description?: string;
  logo?: File;
  parent_id?: number | null;
};

function CreateCategoryForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { control, formState, handleSubmit, setValue, watch } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  // Watch for logo errors
  const logoValue = watch("logo");
  const logoError = formState.errors.logo?.message as string | undefined;

  // Set hasImageError when logo validation fails
  useEffect(() => {
    if (logoError) {
      setHasImageError(true);
    } else {
      setHasImageError(false);
    }
  }, [logoError]);

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

        if (key === "logo" && selectedFile instanceof File) {
          formDataObj.append("logo", selectedFile, selectedFile.name); // ✅ Ensure file is sent as binary
        } else if (typeof value === "string") {
          formDataObj.append(key, value); // ✅ Append only valid string values
        }
      });

      // Handle parent_id separately
      if (formData.parent_id !== undefined && formData.parent_id !== null) {
        formDataObj.append("parent_id", formData.parent_id.toString());
      }

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
        
        <Box sx={{ mt: 2, mb: 2 }}>
          <FormFileUploadField
            name="logo"
            control={control}
            label="Category Logo"
            onFileChange={(file) => {
              setSelectedFile(file);
              setValue("logo", file, { shouldValidate: true });
            }}
            helperText={`Upload a category slider image (${MAX_IMAGE_WIDTH} × ${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
          />
        </Box>

        <div className="mt-6">
          <FormInputField
            name="parent_id"
            control={control}
            label="Parent ID"
            type="number"
          />
        </div>

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          disabled={!isValid || isMutating || hasImageError}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default CreateCategoryForm;
