"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { createBlogCategory, getBlogCategories, type BlogCategory } from "@/services/apiBlog";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";

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
  parent_id: z.number().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  image: z.any().optional(),
});

type CategoryFormType = z.infer<typeof categorySchema>;

export default function CreateBlogCategory() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getBlogCategories({ limit: 100 });
        if (response?.data?.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isValid },
  } = useForm<CategoryFormType>({
    mode: "all",
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      status: "active",
    },
    resolver: zodResolver(categorySchema),
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setValue("name", name);
    if (getValues("slug") === "") {
      setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = async (data: CategoryFormType) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      if (data.description) {
        formData.append("description", data.description);
      }
      if (data.parent_id) {
        formData.append("parent_id", String(data.parent_id));
      }
      formData.append("status", data.status);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }
      
      await createBlogCategory(formData);
      showSnackbar("Category created successfully", "success");
      router.push("/apps/blog/categories");
    } catch (error: any) {
      console.error("Failed to create category:", error);
      showSnackbar(error?.message || "Failed to create category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <div>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                  <Link
                    color="inherit"
                    href="/apps/blog/categories"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/apps/blog/categories");
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    Categories
                  </Link>
                  <Typography color="text.primary">New Category</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">
                  Create New Category
                </Typography>
              </div>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper className="p-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormInputField
                  name="name"
                  control={control}
                  label="Name"
                  required
                  autoFocus
                  onChange={handleNameChange}
                />

                <FormInputField
                  name="slug"
                  control={control}
                  label="Slug"
                  required
                  helperText="URL-friendly identifier (e.g., my-category)"
                />

                <FormCKEditor
                  name="description"
                  control={control}
                  label="Description"
                />

                <Controller
                  name="parent_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Parent Category (Optional)</InputLabel>
                      <Select
                        {...field}
                        value={field.value || ""}
                        label="Parent Category (Optional)"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <FormFileUploadField
                  name="image"
                  control={control}
                  label="Category Image"
                  onFileChange={setSelectedFile}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  helperText="Supported formats: PNG, JPG, JPEG, WebP"
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                    mt: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => router.push("/apps/blog/categories")}
                  >
                    Cancel
                  </Button>
                  <AppButton
                    label="Create"
                    type="submit"
                    disabled={!isValid || submitting}
                    loading={submitting}
                  />
                </Box>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
} 
