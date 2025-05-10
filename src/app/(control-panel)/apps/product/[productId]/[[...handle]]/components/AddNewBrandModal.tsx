"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { createBrand } from "@/services/apiProductBrand";
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
const MAX_IMAGE_WIDTH = 150;
const MAX_IMAGE_HEIGHT = 150;

const validateImageDimensions = (
  file: File
): Promise<{ valid: boolean; dimensions?: { width: number; height: number } }> => {
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
          dimensions: { width: img.width, height: img.height },
        });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: true });
    };
    img.src = URL.createObjectURL(file);
  });
};

const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Brand Name is required")
    .max(50, "Brand Name must not exceed 50 characters"),
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
        .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
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
});

type BrandFormData = z.infer<typeof brandSchema>;

const defaultValues: BrandFormData = {
  name: "",
  slug: "",
  description: "",
  logo: null,
};

interface AddNewBrandModalProps {
  open: boolean;
  onClose: () => void;
  onBrandCreated: (newBrand: { id: number; name: string }) => void;
}

function AddNewBrandModal({
  open,
  onClose,
  onBrandCreated,
}: AddNewBrandModalProps) {
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
  } = useForm<BrandFormData>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(brandSchema),
  });

  const logoError = watch("logo") ? errors.logo?.message as string | undefined : undefined;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setSelectedFile(null);
    }
  }, [open, reset]);

  const handleModalClose = () => {
    if (isLoading) return;
    reset(defaultValues);
    setSelectedFile(null);
    onClose();
  };

  async function onSubmit(formData: BrandFormData) {
    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name.trim());
      formDataObj.append("slug", formData.slug.toLowerCase());
      if (formData.description) {
        formDataObj.append("description", formData.description);
      }
      if (selectedFile instanceof File) {
        formDataObj.append("logo", selectedFile, selectedFile.name);
      }

      console.log("Submitting FormData for new brand:");
      for (const pair of formDataObj.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await createBrand(formDataObj);
      console.log("Create Brand API Response:", response);

      if (response && response.data && 
          typeof response.data.id === 'number' && 
          typeof response.data.name === 'string') {
        showSnackbar("Brand created successfully!", "success");
        onBrandCreated({ id: response.data.id, name: response.data.name });
        handleModalClose();
      } else {
        console.error("Brand creation failed due to unexpected response structure:", response);
        const apiMessage = response?.message || (response?.data && response?.data?.message);
        throw new Error(apiMessage || "Failed to create brand or invalid response structure from API.");
      }
    } catch (error: any) {
      console.error("Error during brand creation:", error);
      const serverErrorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.errors && error.errors[0]?.msg);
      const displayMessage =
        serverErrorMessage || error?.message || "An unexpected error occurred while creating the brand.";
      showSnackbar(displayMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Brand</DialogTitle>
      <DialogContent>
        <form
          id="add-brand-modal-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {errors?.root?.message && (
              <Grid item xs={12}>
                <Alert severity="error">{errors.root.message}</Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormInputField
                name="name"
                control={control}
                label="Brand Name"
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
                label="Brand Logo"
                onFileChange={(file) => {
                  setSelectedFile(file);
                  setValue("logo", file, { shouldValidate: true });
                }}
                helperText={`Upload a brand logo (${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
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
          label="Create Brand"
          loading={isLoading}
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
        />
      </DialogActions>
    </Dialog>
  );
}

export default AddNewBrandModal; 