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
    .max(255, "Name must not exceed 255 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must not exceed 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be in valid format (lowercase letters, numbers, and hyphens)"
    ),
  description: z.string().optional(),
  parent_id: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") return null;
      const parsed = Number(val);
      return isNaN(parsed) ? null : parsed;
    },
    z.number().nullable()
  ),
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
    // if (getValues("slug") === "") {
    //   setValue("slug", generateSlug(name));
    // }
  };

  const onSubmit = async (data: CategoryFormType) => {
    try {
      setSubmitting(true);
      
      // Convert parent_id to number if it exists
      const parentId = data.parent_id !== null && data.parent_id !== undefined 
        ? Number(data.parent_id) 
        : undefined;
      
      if (selectedFile) {
        // With file, use FormData
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("slug", data.slug);
        formData.append("status", data.status);
        
        if (data.description) {
          formData.append("description", data.description);
        }
        
        // Handle parent_id as integer
        if (parentId !== undefined) {
          formData.append("parent_id", String(parentId));
        }
        
        // Add the file
        formData.append("image", selectedFile);
        
        // Convert FormData to JSON for API call
        const jsonData = {
          name: data.name,
          slug: data.slug,
          status: data.status,
          ...(data.description && { description: data.description }),
          ...(parentId !== undefined && { parent_id: parentId }),
          image: selectedFile
        };
        
        await createBlogCategory(jsonData);
      } else {
        // Without file, use direct JSON
        const jsonData = {
          name: data.name,
          slug: data.slug,
          status: data.status,
          ...(data.description && { description: data.description }),
          ...(parentId !== undefined && { parent_id: parentId })
        };
        
        await createBlogCategory(jsonData);
      }
      
      showSnackbar("Category created successfully", "success");
      router.push("/apps/blog/categories");
    } catch (error: any) {
  if (error?.errors && error?.errors.length > 0) {
    showSnackbar(error.errors[0]?.msg, "error");
  } else if (
    error?.error &&
    Array.isArray(error?.error) &&
    error.error.length > 0
  ) {
    showSnackbar(error.error[0]?.message, "error");
  } else if (error?.error?.message) {
    showSnackbar(error.error.message, "error");
  } else if (error?.message) {
    showSnackbar(error.message, "error");
  } else {
    const errorMessage = "An unexpected error occurred";
    showSnackbar(errorMessage, "error");
  }
}
 finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 800, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Create New Category
              </Typography>
            </Box>

            <Paper sx={{ p: 4 }}>
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

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="parent_id"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
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
                      name="image"
                      control={control}
                      label="Category Image"
                      onFileChange={setSelectedFile}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      helperText="Supported formats: PNG, JPG, JPEG, WebP"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                        mt: 2,
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
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
} 
