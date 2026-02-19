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
  Tabs,
  Tab,
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
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getBlogCategory, updateBlogCategory, getBlogCategories, type BlogCategory } from "@/services/apiBlog";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import SeoForm from "@/app/(control-panel)/apps/seo/components/SeoForm";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGE_WIDTH = 450;
const MAX_IMAGE_HEIGHT = 440;

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
        resolve({ 
          valid: false, 
          dimensions: { 
            width: img.width, 
            height: img.height 
          } 
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
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
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
  status: z.enum(["active", "inactive"]).default("active"),
  show_home_page: z.boolean().default(false),
  image: z.any()
    .refine(
      (file) => !file || !(file instanceof File) || file.size <= MAX_FILE_SIZE,
      `File size exceeds the maximum limit of 5MB.`
    )
    .refine(
      async (file) => {
        if (!file || !(file instanceof File)) return true;
        const result = await validateImageDimensions(file);
        return result.valid;
      },
      (file) => ({ 
        message: `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels.` 
      })
    )
    .optional(),
  // Optional redirect URL for deleted categories. Empty string allowed.
  redirect_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
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
  const [activeTab, setActiveTab] = useState(0);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
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
      show_home_page: false,
      redirect_url: "",
    },
    resolver: zodResolver(categorySchema),
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");
  const imageValue = watch("image");

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
          setValue("alt_text", (categoryData as any).alt_text || "");
          setValue("parent_id", categoryData.parent_id || null);
          setValue("status", categoryData.status || "active");
          setValue("show_home_page", categoryData?.show_home_page || false);
          // Prefill redirect URL if present (used when category is deleted)
          setValue("redirect_url", (categoryData as any).redirect_url || "");
          
          // Also do a reset to make sure form state is updated
          reset({
            name: categoryData.name || "",
            slug: categoryData.slug || "",
            description: categoryData.description || "",
            alt_text: (categoryData as any).alt_text || "",
            parent_id: categoryData.parent_id || null,
            status: categoryData.status || "active",
            show_home_page: categoryData?.show_home_page || false,
            image: categoryData.image_url || "",
            redirect_url: (categoryData as any).redirect_url || "",
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
      
      // Create FormData for submission
      const formData = new FormData();
      
      // Add basic text fields
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      formData.append("status", data.status);
      formData.append("show_home_page", data.show_home_page ? "true" : "false");
      
      // Add description if present
      if (data.description) {
        formData.append("description", data.description);
      }
      
      // Add alt_text if present
      if (data.alt_text) {
        formData.append("alt_text", data.alt_text);
      }
      
      // Handle parent_id - send empty string when None is selected (backend should parse as null)
      if (data.parent_id !== null && data.parent_id !== undefined) {
        formData.append("parent_id", data.parent_id.toString());
        console.log("Parent ID added:", data.parent_id, "as string:", data.parent_id.toString());
      } else {
        // When "None" is selected, send empty string - backend should parse empty string as null
        formData.append("parent_id", "");
        console.log("Parent ID set to empty string (should be parsed as null by backend)");
      }
      
      // Add image if selected
      if (selectedFile) {
        formData.append("image", selectedFile);
      }
      
      // Log all FormData entries for debugging
      console.log("FormData entries:");
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1], typeof pair[1]);
      }
      
      // Send FormData to API
      // If editing a deleted category, allow saving a redirect URL
      if (category?.deletedAt) {
        const redirect = (data as any).redirect_url?.toString()?.trim();
        if (redirect) {
          formData.append("redirect_url", redirect);
        }
      }
      await updateBlogCategory(category.id, formData);
      
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
      } else if (error?.error?.message) {
        showSnackbar(error.error.message, "error");
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("name", event.target.value);
  };

  if (loading) {
    return <FuseLoading />;
  }

  return (
    <div className="md:px-14 p-4">
      <PageBreadcrumb customLastLabel={category?.name || undefined} />
    {/* // <Container maxWidth="lg" sx={{ py: 4 }}>
    //   <motion.div
    //     initial={{ opacity: 0, y: 20 }}
    //     animate={{ opacity: 1, y: 0 }}
    //     transition={{ duration: 0.3 }}
    //   >
    //     <Box
    //       sx={{
    //         display: "flex",
    //         flexDirection: "column",
    //         alignItems: "center",
    //         width: "100%",
    //       }}
    //     > */}
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Edit Category
              </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="blog category edit tabs">
                <Tab label="Category Details" />
                <Tab label="SEO" />
              </Tabs>
            </Box>

            <div role="tabpanel" hidden={activeTab !== 0}>
              {activeTab === 0 && (
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
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? null : Number(value));
                                }}
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

                      <Grid item xs={12} md={6}>
                        <FormCheckboxField
                          name="show_home_page"
                          control={control}
                          label="Show on Home Page"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormFileUploadField
                          name="image"
                          control={control}
                          label="Category Image"
                          onFileChange={(file) => {
                            setSelectedFile(file);
                            setValue("image", file, { shouldValidate: true });
                          }}
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          helperText="Recommended size: 450 × 450 px. Supported formats: PNG, JPG, JPEG, WebP"
                          defaultImage={category?.image_url}
                        />
                      </Grid>

                      {(category?.image_url || (imageValue instanceof File)) && (
                        <Grid item xs={12}>
                          <FormInputField
                            name="alt_text"
                            control={control}
                            label="Alt Text (Optional)"
                          />
                        </Grid>
                      )}
                      
                      {/* Redirect URL field - only for deleted categories */}
                      {category?.deletedAt && (
                        <Grid item xs={12}>
                          <FormInputField
                            name="redirect_url"
                            control={control}
                            label="Redirect URL (optional)"
                            helperText="Leave empty to skip. Enter a valid URL (e.g. https://example.com)."
                          />
                        </Grid>
                      )}

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
              )}
            </div>
            
            <div role="tabpanel" hidden={activeTab !== 1}>
              {activeTab === 1 && category && (
                <SeoForm
                  entityId={category.id}
                  entityType="blog_category"
                  entityName={nameValue}
                  entitySlug={slugValue}
                  // fullWidth
                />
              )}
            </div>
           </Box>
        {/* </Box>
      </motion.div>  */}
  </div>
  );
} 