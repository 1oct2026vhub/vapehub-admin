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
    .max(50, "Slug must not exceed 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be in valid format (lowercase letters, numbers, and hyphens)"
    ),
  description: z.string().optional(),
  parent_id: z.number().nullable().optional(),
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
        parent_id: category.parent_id || null,
        status: category.status || "active",
      });
    } else {
      methods.reset({
        name: "",
        slug: "",
        description: "",
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

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      if (data.description) {
        formData.append("description", data.description);
      }
      if (data.parent_id) {
        formData.append("parent_id", data.parent_id.toString());
      }
      formData.append("status", data.status);

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (category?.id) {
        await updateBlogCategory(category.id, formData);
        showSnackbar("Category updated successfully", "success");
      } else {
        await createBlogCategory(formData);
        showSnackbar("Category created successfully", "success");
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove consecutive hyphens
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    if (!category || methods.getValues("slug") === "") {
      methods.setValue("slug", generateSlug(name));
    }
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
                  value={methods.watch("parent_id") || ""}
                  onChange={(e) =>
                    methods.setValue(
                      "parent_id",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
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
              />

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