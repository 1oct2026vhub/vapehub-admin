"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { useSnackbar } from "@/contexts/SnackbarContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const bannerSchema = z.object({
  image: z.union([
    z.undefined(),
    z.null(),
    z.string(), // For existing banner image URLs
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
  alt: z.string().optional(),
  url: z.union([
    z.string().url("Banner URL must be a valid URL"),
    z.literal(""),
  ]).optional(),
  order: z.number().int().min(0, "Order must be a non-negative integer").optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: BannerFormData & { imageFile?: File | null }) => Promise<void>;
  initialData?: {
    id?: number;
    image?: string;
    alt?: string;
    url?: string;
    order?: number;
  } | null;
  isEdit?: boolean;
}

export default function BannerModal({
  open,
  onClose,
  onSave,
  initialData,
  isEdit = false,
}: BannerModalProps) {
  const { showSnackbar } = useSnackbar();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    mode: "all",
    defaultValues: {
      image: undefined,
      alt: "",
      url: "",
      order: 0,
    },
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          image: initialData.image || undefined,
          alt: initialData.alt || "",
          url: initialData.url || "",
          order: initialData.order || 0,
        });
        setImagePreview(initialData.image || null);
        setSelectedFile(null);
      } else {
        reset({
          image: undefined,
          alt: "",
          url: "",
          order: 0,
        });
        setImagePreview(null);
        setSelectedFile(null);
      }
    }
  }, [open, initialData, reset]);

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setImagePreview(null);
    onClose();
  };

  const onSubmit = async (data: BannerFormData) => {
    setIsSaving(true);
    try {
      await onSave({
        ...data,
        imageFile: selectedFile,
      });
      handleClose();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      const errorMessage = error?.message || "An unexpected error occurred";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Banner" : "Create Banner"}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <FormFileUploadField
              name="image"
              control={control}
              label="Banner Image"
              onFileChange={(file) => {
                setSelectedFile(file);
                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                } else {
                  setImagePreview(initialData?.image || null);
                }
              }}
              helperText="Upload a banner image (Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP"
              defaultImage={typeof watch("image") === 'string' ? watch("image") as string : undefined}
              hidePreview
            />
            
            {imagePreview && (
              <Box sx={{ border: '1px solid #ddd', p: 1, display: 'inline-block' }}>
                <img
                  src={imagePreview}
                  alt="Banner preview"
                  style={{ maxWidth: 300, maxHeight: 200, objectFit: 'contain' }}
                />
              </Box>
            )}

            <FormInputField
              name="alt"
              control={control}
              label="Banner Alt Text"
              type="text"
            />

            <FormInputField
              name="url"
              control={control}
              label="Banner URL"
              type="url"
              helperText="URL to redirect when banner is clicked"
            />

            <FormInputField
              name="order"
              control={control}
              label="Banner Order"
              type="number"
              helperText="Display order (0 = first)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <AppButton
            type="submit"
            label={isEdit ? "Update" : "Create"}
            loading={isSaving}
            disabled={!isValid || isSaving}
          />
        </DialogActions>
      </form>
    </Dialog>
  );
}


