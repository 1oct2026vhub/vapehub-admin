"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getBlogCategory, updateBlogCategory, getBlogCategories, type BlogCategory } from "@/services/apiBlog";
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

export default function EditBlogCategory() {
  const params = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [category, setCategory] = useState<BlogCategory | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
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

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getBlogCategories({ limit: 100 });
        if (response?.data?.categories) {
          setCategories(response.data.categories.filter(cat => cat.id !== Number(params.id)));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, [params.id]);

  // Fetch category details
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await getBlogCategory(Number(params.id));
        console.log("Category API response:", response);

        if (response) {
          const categoryData = response;
          setCategory(categoryData);
          
          // Explicitly set each field value individually
          setValue("name", categoryData.name || "");
          setValue("slug", categoryData.slug || "");
          setValue("description", categoryData.description || "");
          setValue("parent_id", categoryData.parent_id || null);
          setValue("status", categoryData.status || "active");
          
          // Also do a reset to make sure form state is updated
          reset({
            name: categoryData.name || "",
            slug: categoryData.slug || "",
            description: categoryData.description || "",
            parent_id: categoryData.parent_id || null,
            status: categoryData.status || "active",
            image: categoryData.image_url || "",
          }, {
            keepDefaultValues: false
          });

          console.log("Set category data:", categoryData);
          console.log("Form values after reset:", getValues());
        }
      } catch (error) {
        console.error("Failed to fetch category:", error);
        showSnackbar("Failed to load category details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCategory();
    }
  }, [params.id, reset, setValue, showSnackbar]);

  // Add this useEffect to log form values whenever they change (for debugging)
  useEffect(() => {
    console.log("Current form values:", getValues());
  }, [getValues]);

  const onSubmit = async (data: CategoryFormType) => {
    if (!category?.id) return;
    
    try {
      setSubmitting(true);
      console.log("Submitting form with data:", data);
      
      // Solution: For normal data send JSON, and for file send FormData
      if (selectedFile) {
        // With file, use FormData
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("slug", data.slug);
        formData.append("status", data.status);
        
        if (data.description) {
          formData.append("description", data.description);
        }
        
        // Special handling for parent_id - convert to JSON string
        if (data.parent_id !== null && data.parent_id !== undefined) {
          formData.append("parent_id", JSON.stringify(Number(data.parent_id)));
        }
        
        // Add the file
        formData.append("image", selectedFile);
        
        console.log("Form data entries with file:");
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1], typeof pair[1]);
        }
        
        await updateBlogCategory(category.id, formData);
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
        
        // Properly handle parent_id as a number
        if (data.parent_id !== null && data.parent_id !== undefined) {
          jsonData.parent_id = Number(data.parent_id);
          console.log("Parent ID as number:", jsonData.parent_id, "Type:", typeof jsonData.parent_id);
        }
        
        console.log("Sending JSON data:", jsonData);
        await updateBlogCategory(category.id, jsonData);
      }
      
      showSnackbar("Category updated successfully", "success");
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
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FuseLoading />;
  }

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
                Edit Category
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
                        label="Update"
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