"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography, Box } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { usePost } from "@/hooks/useFetch";
import { createCategory, createEntityBanner } from "@/services/apiProductCategory";
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

  // Banner fields
  bannerImage: z.union([
    z.undefined(),
    z.null(),
    z.instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "Banner file size must be less than 5MB"
      )
      .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file.type),
        "Only .jpg, .jpeg, .png, and .webp formats are supported"
      )
  ]).optional().nullable(),
  bannerAlt: z.string().optional(),
  bannerUrl: z.union([
    z.string().url("Banner URL must be a valid URL"),
    z.literal(""),
  ]).optional(),
  bannerOrder: z.number().int().min(0, "Order must be a non-negative integer").optional(),
});

// Infer the type from the Zod schema
type InferredSchemaType = z.infer<typeof schema>;

const defaultValues: InferredSchemaType = {
  name: "",
  slug: "",
  description: "",
  logo: null,
  parent_id: null,
  bannerImage: undefined,
  bannerAlt: "",
  bannerUrl: "",
  bannerOrder: 0,
};

// Align FormType with Zod schema or use InferredSchemaType directly
export type FormType = InferredSchemaType; // Simplest way to keep them in sync

function CreateCategoryForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [createdCategoryId, setCreatedCategoryId] = useState<number | null>(null);

  const { control, formState, handleSubmit, setValue, watch } = useForm<InferredSchemaType>({
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

  async function onSubmit(formData: InferredSchemaType) {
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

      const categoryResponse = await triggerCreateCategory(formDataObj);
      const categoryId = categoryResponse?.data?.id || categoryResponse?.id;
      setCreatedCategoryId(categoryId);

      showSnackbar("Category created successfully!", "success");
      // Don't redirect immediately, allow user to save banner if needed
      // router.push("/apps/product-category");
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

  async function onSaveBanner() {
    if (!createdCategoryId) {
      showSnackbar("Please create the category first before saving the banner", "error");
      return;
    }

    setIsSavingBanner(true);
    try {
      const formData = watch();
      
      if (!selectedBannerFile && !formData.bannerAlt && !formData.bannerUrl) {
        showSnackbar("Please provide at least banner image, alt text, or URL", "error");
        setIsSavingBanner(false);
        return;
      }

      await createEntityBanner({
        type: "category",
        category_id: createdCategoryId,
        image: selectedBannerFile instanceof File ? selectedBannerFile : undefined,
        alt: formData.bannerAlt || "",
        url: formData.bannerUrl || "",
        order: formData.bannerOrder || 0,
      });

      showSnackbar("Banner saved successfully!", "success");
      router.push("/apps/product-category");
    } catch (error: any) {
      console.error("Error saving banner:", error);
      const errorResponse = error?.response?.data || error;
      
      // Handle validation errors from the API
      if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
        errorResponse.errors.forEach((validationError: any) => {
          if (validationError.path && validationError.msg) {
            showSnackbar(validationError.msg, "error");
          }
        });
      } else if (errorResponse?.error && Array.isArray(errorResponse.error)) {
        errorResponse.error.forEach((validationError: any) => {
          if (validationError.path && validationError.message) {
            showSnackbar(validationError.message, "error");
          }
        });
      } else if (errorResponse?.errors && !Array.isArray(errorResponse.errors)) {
        showSnackbar(errorResponse.errors[0]?.msg || errorResponse.errors, "error");
      } else {
        const errorMessage = errorResponse?.message || error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setIsSavingBanner(false);
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
        <FormCKEditor
          name="description"
          control={control}
          label="Description"
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

      {/* Banner Section - Outside the main form */}
      <Box sx={{ mt: 4, mb: 2, p: 3, border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Category Banner (Optional)
        </Typography>
        
        <Box sx={{ mt: 2, mb: 2 }}>
          <FormFileUploadField
            name="bannerImage"
            control={control}
            label="Banner Image"
            onFileChange={(file) => {
              setSelectedBannerFile(file);
              setValue("bannerImage", file, { shouldValidate: true });
            }}
            helperText="Upload a banner image (Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP"
          />
        </Box>

        <FormInputField
          name="bannerAlt"
          control={control}
          label="Banner Alt Text"
          type="text"
        />

        <FormInputField
          name="bannerUrl"
          control={control}
          label="Banner URL"
          type="url"
          helperText="URL to redirect when banner is clicked"
        />

        <FormInputField
          name="bannerOrder"
          control={control}
          label="Banner Order"
          type="number"
          helperText="Display order (0 = first)"
        />

        <AppButton
          label="Save Banner"
          loading={isSavingBanner}
          type="button"
          onClick={onSaveBanner}
          fullWidth
          size="large"
          disabled={isSavingBanner || !createdCategoryId}
          className="mt-4 w-full"
          disableGradient
          sx={{ 
            backgroundColor: "#2E9970", 
            "&:hover": { backgroundColor: "#1E7A56" },
            color: "#fff"
          }}
        />
      </Box>
    </div>
  );
}

export default CreateCategoryForm;
