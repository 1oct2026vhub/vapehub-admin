"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { createCategory } from "@/services/apiProductCategory";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { useState, useEffect } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const MAX_IMAGE_WIDTH = 236;
const MAX_IMAGE_HEIGHT = 204;

const validateImageDimensions = (
  file: File
): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: true }); // No file or not a file, considered valid for schema
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
            height: img.height,
          },
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

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category Name is required")
    .max(50, "Category Name must not exceed 50 characters"),
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
      z
        .instanceof(File)
        .refine(
          (file) => file.size <= MAX_FILE_SIZE,
          "File size must be less than 5MB"
        )
        .refine(
          (file) => ACCEPTED_FILE_TYPES.includes(file.type),
          "Only .jpg, .jpeg, .png, and .webp formats are supported"
        )
        .refine(async (file) => {
          const result = await validateImageDimensions(file);
          return result.valid;
        }, `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels`),
    ])
    .optional()
    .nullable(),
  parent_id: z
    .union([
      z.number(),
      z.string().transform((val) => (val === "" ? null : Number(val))),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const defaultValues: CategoryFormData = {
  name: "",
  slug: "",
  description: "",
  logo: null,
  parent_id: null,
};

interface AddNewCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCategoryCreated: (newCategory: { id: number; name: string }) => void;
}

function AddNewCategoryModal({
  open,
  onClose,
  onCategoryCreated,
}: AddNewCategoryModalProps) {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(categorySchema),
  });

  const logoError = watch("logo") ? errors.logo?.message as string | undefined : undefined;

  useEffect(() => {
    if (open) {
      reset(defaultValues); // Reset form when modal opens
      setSelectedFile(null);
    }
  }, [open, reset]);

  const handleModalClose = () => {
    if (isLoading) return; // Prevent closing while submitting
    reset(defaultValues);
    setSelectedFile(null);
    onClose();
  };

  async function onSubmit(formData: CategoryFormData) {
    setIsLoading(true);
    try {
      const formDataObj = new FormData();

      // Append fields to FormData
      formDataObj.append("name", formData.name);
      formDataObj.append("slug", formData.slug.toLowerCase());
      if (formData.description) {
        formDataObj.append("description", formData.description);
      }
      if (selectedFile instanceof File) {
        formDataObj.append("logo", selectedFile, selectedFile.name);
      }
      if (formData.parent_id !== undefined && formData.parent_id !== null) {
        formDataObj.append("parent_id", formData.parent_id.toString());
      }

      console.log("Submitting FormData for new category:");
      for (const pair of formDataObj.entries()) {
        console.log(pair[0]+ ': ' + pair[1]); 
      }
      
      const response = await createCategory(formDataObj);
      console.log("Create Category API Response:", response); // Log the raw response

      // Ensure response, response.data, and necessary fields (id, name) exist and are of correct type
      if (response && response.data && 
          typeof response.data.id === 'number' && 
          typeof response.data.name === 'string') {
        showSnackbar("Category created successfully!", "success");
        onCategoryCreated({ id: response.data.id, name: response.data.name });
        handleModalClose();
      } else {
        console.error("Category creation failed due to unexpected response structure:", response);
        const apiMessage = response?.message || (response?.data && response?.data?.message);
        throw new Error(apiMessage || "Failed to create category or invalid response structure from API.");
      }
    } catch (error: any) {
      console.error("Error during category creation:", error);
      // Attempt to get a more specific error message
      const serverErrorMessage = error?.response?.data?.message || 
                               error?.response?.data?.error || 
                               (error?.errors && error.errors[0]?.msg);
      const displayMessage = serverErrorMessage || error?.message || "An unexpected error occurred while creating the category.";
      showSnackbar(displayMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Category</DialogTitle>
      <DialogContent>
        <form
          id="add-category-modal-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Grid container spacing={2} sx={{ mt: 1}}>
            {errors?.root?.message && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.root.message}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormInputField
                name="name"
                control={control}
                label="Name"
                type="text"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormInputField
                name="slug"
                control={control}
                label="Slug"
                type="text"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormInputField
                name="description"
                control={control}
                label="Description"
                type="text"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
                <FormFileUploadField
                    name="logo"
                    control={control}
                    label="Category Logo"
                    onFileChange={(file) => {
                    setSelectedFile(file);
                    setValue("logo", file, { shouldValidate: true });
                    }}
                    helperText={`Upload a category image (${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
                />
            </Grid>
            <Grid item xs={12}>
              <FormInputField
                name="parent_id"
                control={control}
                label="Parent ID (Optional)"
                type="number"
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleModalClose} color="inherit" disabled={isLoading}>
          Cancel
        </Button>
        <AppButton
          label="Create Category"
          loading={isLoading}
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
        />
      </DialogActions>
    </Dialog>
  );
}

export default AddNewCategoryModal; 