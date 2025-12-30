"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppButton from "./AppButton"; // Assuming AppButton is in the same directory
import FormInputField from "./FormInputField"; // Assuming FormInputField is in the same directory
import FormCKEditor from "./FormCKEditor"; // Assuming FormCKEditor is in the same directory
import FormFileUploadField from "./FormFileUploadField"; // Assuming FormFileUploadField is in the same directory
import { useSnackbar } from "@/contexts/SnackbarContext";
import { createBlogCategory, getBlogCategories, type BlogCategory } from "@/services/apiBlog";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGE_WIDTH = 322;
const MAX_IMAGE_HEIGHT = 512;

// Helper function to validate image dimensions (used by the Zod schema)
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
        resolve({ valid: false, dimensions: { width: img.width, height: img.height } });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: true }); // Assume valid on error
    };
    img.src = URL.createObjectURL(file);
  });
};

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().optional(),
  alt_text: z.string().optional(),
  parent_id: z.preprocess(
    (val) => (val === null || val === undefined || val === "" ? null : Number(val)),
    z.number().nullable()
  ),
  status: z.enum(["active", "inactive"]).default("active"),
  category_modal_image_upload: z.any()
    .refine((file) => !file || !(file instanceof File) || file.size <= MAX_FILE_SIZE, `Max size: 5MB.`)
    .refine(async (file) => (!file || !(file instanceof File) || (await validateImageDimensions(file)).valid), `Dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT}px.`)
    .optional(),
});

type CategoryFormType = z.infer<typeof categorySchema>;

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCategoryCreated: (newCategory: BlogCategory) => void;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%', // Responsive width
  maxWidth: 700, // Max width
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh', // Max height
  overflowY: 'auto', // Enable scroll if content exceeds height
};

export default function AddCategoryModal({ open, onClose, onCategoryCreated }: AddCategoryModalProps) {
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryImagePreviewUrl, setCategoryImagePreviewUrl] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { isValid, errors },
  } = useForm<CategoryFormType>({
    mode: "all",
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      alt_text: "",
      parent_id: null,
      status: "active",
      category_modal_image_upload: null,
    },
    resolver: zodResolver(categorySchema),
  });

  // Fetch categories for parent selection when modal opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
          const response = await getBlogCategories({ limit: 100 }); // Fetch active categories only? API needs update or filter here
          if (response?.data?.categories) {
              // Filter for active categories if API doesn't support it directly
             const activeCategories = response.data.categories.filter(c => c.status === 'active');
             setCategories(activeCategories);
          }
        } catch (error) {
          console.error("Failed to fetch categories:", error);
          showSnackbar("Could not load parent categories", "error");
        } finally {
          setLoadingCategories(false);
        }
      };
      fetchCategories();
    }
  }, [open, showSnackbar]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setValue("name", name);
    // Auto-generate slug (optional, can keep manual)
    // setValue("slug", generateSlug(name));
  };

  const onSubmit = async (data: CategoryFormType) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      formData.append("status", data.status);
      if (data.description) formData.append("description", data.description);
      if (data.alt_text) formData.append("alt_text", data.alt_text);
      if (data.parent_id !== null) formData.append("parent_id", data.parent_id.toString());
      
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await createBlogCategory(formData);

      if (response?.data) {
        showSnackbar("Category created successfully", "success");
        onCategoryCreated(response.data);
        handleClose();
      } else {
        //  showSnackbar("Category created, but could not retrieve details.", "warning");
         onCategoryCreated({ id: 0, name: data.name } as any);
         handleClose();
      }
    } catch (error: any) {
        // Standard error handling from previous forms
        if (error?.errors && error?.errors.length > 0) {
            showSnackbar(error.errors[0]?.msg, "error");
        } else if (error?.error && Array.isArray(error?.error) && error.error.length > 0) {
            showSnackbar(error.error[0]?.message, "error");
        } else if (error?.error?.message) {
            showSnackbar(error.error.message, "error");
        } else if (error?.message) {
            showSnackbar(error.message, "error");
        } else {
            showSnackbar("An unexpected error occurred", "error");
        }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    if (categoryImagePreviewUrl) {
      URL.revokeObjectURL(categoryImagePreviewUrl);
    }
    setCategoryImagePreviewUrl(null);
    onClose();
  };

  // Effect to clear preview when modal is closed externally or form is reset
  useEffect(() => {
    if (!open) {
      if (categoryImagePreviewUrl) {
        URL.revokeObjectURL(categoryImagePreviewUrl);
      }
      setCategoryImagePreviewUrl(null);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="create-category-modal-title"
      aria-describedby="create-category-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="create-category-modal-title" variant="h6" component="h2" mb={3}>
          Create New Blog Category
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormInputField
                name="name"
                control={control}
                label="Name"
                required
                autoFocus
                onChange={handleNameChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormInputField
                name="slug"
                control={control}
                label="Slug"
                required
                helperText="URL-friendly identifier (e.g., my-category)"
              />
            </Grid>

            <Grid item xs={12}>
              <FormCKEditor
                name="description"
                control={control}
                label="Description"
              />
            </Grid>

            <Grid item xs={12}>
              <FormInputField
                name="alt_text"
                control={control}
                label="Alt Text"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Parent Category (Optional)</InputLabel>
                    <Select
                      {...field}
                      value={field.value === null ? '' : field.value} // Handle null value for Select
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      label="Parent Category (Optional)"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {loadingCategories ? (
                          <MenuItem value="" disabled>Loading...</MenuItem>
                      ) : (
                          categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))
                      )}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <FormFileUploadField
                name="category_modal_image_upload"
                control={control}
                label="Category Image"
                onFileChange={(file) => {
                  setSelectedFile(file);
                  setValue("category_modal_image_upload", file, { shouldValidate: true });
                  
                  if (categoryImagePreviewUrl) {
                    URL.revokeObjectURL(categoryImagePreviewUrl);
                  }
                  if (file) {
                    setCategoryImagePreviewUrl(URL.createObjectURL(file));
                  } else {
                    setCategoryImagePreviewUrl(null);
                  }
                }}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                helperText={`Optional. Recommended: ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT}px. Max 5MB.`}
              />
              {/* {categoryImagePreviewUrl && (
                <Box mt={2} sx={{ border: '1px dashed grey', padding: 1, display: 'inline-block' }}>
                  <Typography variant="caption" display="block" gutterBottom>New Image Preview:</Typography>
                  <img 
                    src={categoryImagePreviewUrl} 
                    alt="New category preview" 
                    style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }} 
                  />
                </Box>
              )} */}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button variant="outlined" onClick={handleClose} disabled={submitting}>
                  Cancel
                </Button>
                <AppButton
                  label="Create Category"
                  type="submit"
                  disabled={!isValid || submitting || loadingCategories}
                  loading={submitting}
                />
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>
  );
} 