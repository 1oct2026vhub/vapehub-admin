"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import AppButton from "@/components/Shared/AppButton";
import { BlogCategory, createBlogCategory, updateBlogCategory } from "@/services/apiBlog";

// Category schema
const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must not exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be in valid format (lowercase letters, numbers, and hyphens)"
    ),
  description: z.string().optional(),
  alt_text: z.string().optional(),
  parent_id: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = Number(val);
      return isNaN(parsed) ? null : parsed;
    },
    z.number().nullable()
  ),
  status: z.string().default("active"),
  image: z.any().optional(),
});

type CategoryFormType = z.infer<typeof categorySchema>;

interface BlogCategoryEditModalProps {
  open: boolean;
  onClose: () => void;
  category?: BlogCategory | null;
  categories: BlogCategory[];
  onSave: () => void;
}

export default function BlogCategoryEditModal({
  open,
  onClose,
  category,
  categories,
  onSave,
}: BlogCategoryEditModalProps) {
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const methods = useForm<CategoryFormType>({
    mode: "all",
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      alt_text: (category as any)?.alt_text || "",
      parent_id: category?.parent_id || null,
      status: category?.status || "active",
    },
    resolver: zodResolver(categorySchema),
  });

  const { isValid, errors } = methods.formState;

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      methods.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        alt_text: (category as any).alt_text || "",
        parent_id: category.parent_id || null,
        status: category.status || "active",
      });
    } else {
      methods.reset({
        name: "",
        slug: "",
        description: "",
        alt_text: "",
        parent_id: null,
        status: "active",
      });
    }
  }, [category]);

  const handleApiError = (error: any) => {
    if (error?.errors) {
      showSnackbar(error.errors[0]?.msg || "Failed to save category", "error");
    } else {
      const errorMessage = error?.message || "Failed to save category";
      showSnackbar(errorMessage, "error");
    }

    if (error?.error && typeof error.error === "object") {
      Object.entries(error.error).forEach(([field, message]) => {
        if (typeof message === "string") {
          showSnackbar(message, "error");
        }
      });
    }
  };

  const handleSubmit = async (data: CategoryFormType) => {
    try {
      setSubmitting(true);
      console.log("Submitting form with data:", data);

      // Solution: For normal data send JSON, and for file send FormData
      if (selectedFile) {
        // If we have a file, we need to use FormData
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("slug", data.slug);
        formData.append("status", data.status);
        
        if (data.description) {
          formData.append("description", data.description);
        }

        if (data.alt_text) {
          formData.append("alt_text", data.alt_text);
        }

        // Convert parent_id to a JSON string and set special header
        if (data.parent_id !== null && data.parent_id !== undefined) {
          formData.append("parent_id", Number(data.parent_id).toString());
        }
        
        formData.append("image", selectedFile);
        
        console.log("Form data entries with file:");
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1], typeof pair[1]);
        }
        
        if (category?.id) {
          await updateBlogCategory(category.id, formData);
        } else {
          await createBlogCategory(formData);
        }
      } else {
        // Without file, use direct JSON - this will ensure parent_id is sent as an integer
        const jsonData: Record<string, any> = {
          name: data.name,
          slug: data.slug,
          status: data.status
        };
        
        if (data.description) {
          jsonData.description = data.description;
        }
        
        if (data.alt_text) {
          jsonData.alt_text = data.alt_text;
        }
        
        if (data.parent_id !== null && data.parent_id !== undefined) {
          jsonData.parent_id = Number(data.parent_id);
        }
        
        console.log("Sending JSON data:", jsonData);
        
        if (category?.id) {
          await updateBlogCategory(category.id, jsonData);
        } else {
          await createBlogCategory(jsonData);
        }
      }

      showSnackbar(category ? "Category updated successfully" : "Category created successfully", "success");
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    methods.setValue("name", event.target.value);
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? "Edit Category" : "Add Category"}
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <Box sx={{ mt: 2 }}>
              {errors?.root?.message && (
                <Alert className="mb-4" severity="error">
                  {errors?.root?.message}
                </Alert>
              )}

              <FormInputField
                name="name"
                control={methods.control}
                label="Name"
                required
                autoFocus
                onChange={handleNameChange}
              />

              <FormInputField
                name="slug"
                control={methods.control}
                label="Slug"
                required
                helperText="URL-friendly identifier (e.g., my-category)"
              />

              <FormTextareaField
                name="description"
                control={methods.control}
                label="Description"
                rows={3}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="parent-category-label">
                  Parent Category
                </InputLabel>
                <Select
                  labelId="parent-category-label"
                  value={methods.watch("parent_id") === null ? "" : methods.watch("parent_id")}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Convert empty string to null, otherwise convert to number
                    const parentId = value === "" ? null : Number(value);
                    methods.setValue("parent_id", parentId);
                  }}
                  label="Parent Category"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories
                    .filter((cat) => cat.id !== category?.id)
                    .map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormFileUploadField
                name="image"
                control={methods.control}
                label="Category Image"
                onFileChange={handleFileChange}
                accept="image/*"
                helperText="Upload a category image (PNG, JPG, JPEG, WebP)"
                defaultImage={category?.image_url}
              />

              {(selectedFile || category?.image_url) && (
                <FormInputField
                  name="alt_text"
                  control={methods.control}
                  label="Alt Text"
                />
              )}

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={methods.watch("status")}
                  onChange={(e) =>
                    methods.setValue(
                      "status",
                      e.target.value as "active" | "inactive"
                    )
                  }
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 3,
                  gap: 2,
                }}
              >
                <Button onClick={onClose}>Cancel</Button>
                <AppButton
                  label={category ? "Update" : "Create"}
                  type="submit"
                  disabled={!isValid || submitting}
                  loading={submitting}
                />
              </Box>
            </Box>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
} 