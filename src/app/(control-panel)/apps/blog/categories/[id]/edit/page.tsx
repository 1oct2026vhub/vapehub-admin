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
  parent_id: z.number().nullable(),
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
      console.log("Submitting form with data:", data); // Debug
      
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
      
      // Handle image upload - if there's a new file, use it
      if (selectedFile) {
        console.log("Using new uploaded image");
        formData.append("image", selectedFile);
      } else if (category.image_url) {
        // If keeping existing image, don't need to send anything
        console.log("Keeping existing image", category.image_url);
      }
      
      console.log("Sending form data to API");
      await updateBlogCategory(category.id, formData);
      showSnackbar("Category updated successfully", "success");
      router.push("/apps/blog/categories");
    } catch (error: any) {
      console.error("Failed to update category:", error);
      showSnackbar(error?.message || "Failed to update category", "error");
    } finally {
      setSubmitting(false);
    }
  };
            console.log("categoryData", category);


  if (loading) {
    return <FuseLoading />;
  }

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
                  <Typography color="text.primary">Edit Category</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">
                  Edit Category
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
                />

                <FormInputField
                  name="slug"
                  control={control}
                  label="Slug"
                  required
                  helperText="URL-friendly identifier (e.g., my-category)"
                />

                <FormTextareaField
                  name="description"
                  control={control}
                  label="Description"
                  rows={4}
                />

                <Controller
                  name="parent_id"
                  control={control}
                  render={({ field }) => {
                    // Ensure field.value is treated correctly
                    const value = field.value === null ? "" : field.value;
                    console.log("Parent ID field value:", value);
                    
                    return (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Parent Category</InputLabel>
                        <Select
                          {...field}
                          value={value}
                          label="Parent Category"
                          onChange={(e) => {
                            // Handle empty string as null
                            const newValue = e.target.value === "" ? null : e.target.value;
                            field.onChange(newValue);
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  }}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => {
                    console.log("Status field value:", field.value);
                    return (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select {...field} label="Status">
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    );
                  }}
                />

                <FormFileUploadField
                  name="image"
                  control={control}
                  label="Category Image"
                  onFileChange={setSelectedFile}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  helperText="Supported formats: PNG, JPG, JPEG, WebP"
                />

                {/* Display existing image */}
                {category && category.image_url && !selectedFile && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Image:
                    </Typography>
                    <Box
                      component="img"
                      src={category.image_url}
                      alt={category.name}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                      }}
                    />
                  </Box>
                )}

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
                    label="Update"
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