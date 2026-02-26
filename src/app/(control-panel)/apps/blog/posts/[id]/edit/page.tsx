"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Autocomplete,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormDateTimeField from "@/components/Shared/FormDateTimeField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getBlogPost,
  updateBlogPost,
  getBlogCategories,
  getBlogTags,
  BlogPost,
  BlogCategory,
  BlogTag,
} from "@/services/apiBlog";
import FuseLoading from "@fuse/core/FuseLoading";
import debounce from "lodash/debounce";
import AddCategoryModal from "@/components/Shared/AddCategoryModal";
import { Button as MuiButton, Box as MuiBox } from "@mui/material";
import SeoForm from "@/app/(control-panel)/apps/seo/components/SeoForm";
import FaqAccordion from "@/app/(control-panel)/apps/faq/FaqAccordion";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MIN_IMAGE_WIDTH = 1091;
const MIN_IMAGE_HEIGHT = 320;
const MAX_IMAGE_WIDTH = 1300;
const MAX_IMAGE_HEIGHT = 360;

// Define validation schema using Zod
const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  content: z.string().min(1, "Content is required"),
  alt_text: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(150, "Slug must not exceed 150 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be in valid format (lowercase letters, numbers, and hyphens)"
    ),
  image: z.any()
    .refine(
      (file) => !file || !(file instanceof File) || file.size <= MAX_FILE_SIZE,
      `File size exceeds the maximum limit of 5MB.`
    )
    .optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().nullable().optional(),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string()
  })).default([]),
  tags: z.array(z.object({
    id: z.number(),
    name: z.string()
  })).default([]),
  is_active: z.boolean().default(true),
  // Optional redirect URL for deleted posts. Empty string allowed.
  redirect_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

type PostFormType = z.infer<typeof postSchema>;

const commonFieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "0",
    "& fieldset": {
      borderColor: "#2E9970",
      borderRadius: "0",
    },
    "&:hover fieldset": {
      borderColor: "#247C5C",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1E7A56",
      borderWidth: "2px",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#2E9970",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2E9970",
  },
};

export default function EditBlogPost() {
  const params = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    document.title = "Edit Post Category | VapeHub";
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { isValid, errors },
  } = useForm<PostFormType>({
    mode: "all",
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      slug: "",
      alt_text: "",
      status: "draft",
      published_at: null,
      categories: [],
      tags: [],
      is_active: true,
      redirect_url: "",
    }
  });

  const titleValue = watch("title");
  const slugValue = watch("slug");
  const currentStatus = watch("status");
  const imageValue = watch("image");

  const fetchCategories = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogCategories({ search: searchTerm, limit: 50 });
      if (response?.data?.categories) {
        const activeCategories = response.data.categories.filter(cat => cat.status === "active");
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, 300);

  const fetchTags = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogTags({
        search: searchTerm,
        limit: 50,
      });
      if (response?.data?.tags) {
        setTags(response.data.tags);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }, 300);

  useEffect(() => {
    fetchCategories(categorySearch);
  }, [categorySearch]);

  useEffect(() => {
    fetchTags(tagSearch);
  }, [tagSearch]);

  useEffect(() => {
    fetchCategories("");
    fetchTags("");
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await getBlogPost(Number(params.id));
        if (response?.data) {
          setPost(response.data);
          reset({
            title: response.data.title,
            content: response.data.content,
            slug: response.data.slug,
            alt_text: (response.data as any).alt_text || "",
            status: response.data.status || "draft",
            published_at: response.data.published_at || null,
            categories: response.data.categories || [],
            tags: response.data.tags || [],
            is_active: response.data.is_active,
            redirect_url:
              (response.data as any).redirect_url ||
              (response.data as any).redirect?.redirect_url ||
              "",
          });
          const initialCategories = response.data.categories || [];
          setCategories(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const uniqueNew = initialCategories.filter(c => !existingIds.has(c.id));
            return [...prev, ...uniqueNew].sort((a, b) => a.name.localeCompare(b.name));
          });
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
        showSnackbar("Failed to load post data", "error");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchPost();
  }, [params.id, reset, showSnackbar]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("title", event.target.value);
  };

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file) {
        setImageError(null);
        resolve(true);
        return;
      }

      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        if (img.width < MIN_IMAGE_WIDTH || img.height < MIN_IMAGE_HEIGHT) {
          setImageError(`Image dimensions must be at least ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT} pixels.`);
          resolve(false);
        } else if (img.width > MAX_IMAGE_WIDTH || img.height > MAX_IMAGE_HEIGHT) {
          setImageError(`Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels.`);
          resolve(false);
        } else {
          setImageError(null);
          resolve(true);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        setImageError("Failed to load image for validation");
        resolve(false);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    setValue("image", file, { shouldValidate: true });
    
    if (file) {
      await validateImageDimensions(file);
    } else {
      setImageError(null);
    }
  };

  const handleCategoryCreated = (newCategory: BlogCategory) => {
    setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const onSubmit = async (data: PostFormType) => {
    if (!post?.id) return;

    if (selectedFile && !(await validateImageDimensions(selectedFile))) {
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("slug", data.slug);
      formData.append("status", data.status);
      formData.append("is_active", data.is_active.toString());

      if (data.alt_text) {
        formData.append("alt_text", data.alt_text);
      }

      if (data.published_at) {
        formData.append("published_at", data.published_at);
      }

      const categoryIds = data.categories.map(cat => cat.id).join(',');
      formData.append("categories", categoryIds);
      
      const tagIds = data.tags.map(tag => tag.id).join(',');
      formData.append("tags", tagIds);

      if (selectedFile) {
        formData.append("image", selectedFile);
      }
      
      // If editing a deleted post, allow saving a redirect URL
      if (post?.deleted_at) {
        const redirect = (data as any).redirect_url?.toString()?.trim();
        if (redirect) {
          formData.append("redirect_url", redirect);
        }
      }

      await updateBlogPost(post.id, formData);
      showSnackbar("Post updated successfully", "success");
      router.push("/apps/blog/posts");
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

  if (loading) {
    return <FuseLoading />;
  }

  if (!post) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Typography variant="h6" color="error">
          Post not found
        </Typography>
      </Container>
    );
  }

  return (
      <div className="md:px-14 p-4">
        <PageBreadcrumb />
   {/* <Container maxWidth="lg" sx={{ py: 4 }}> */}
      {/* <motion.div
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
        > */}
        
          <Box >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Edit Blog Post
              </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="blog edit tabs">
                  <Tab label="Post Details" id="blog-post-details-tab" aria-controls="blog-post-details-panel" />
                  <Tab label="FAQ" id="blog-post-faq-tab" aria-controls="blog-post-faq-panel" />
                  <Tab label="SEO" id="blog-post-seo-tab" aria-controls="blog-post-seo-panel" />
                </Tabs>
            </Box>

            <div role="tabpanel" hidden={activeTab !== 0}>
              {activeTab === 0 && (
                <Paper sx={{ p: 4 }}>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <FormInputField
                          name="title"
                          control={control}
                          label="Title"
                          required
                          onChange={handleTitleChange}
                          sx={commonFieldStyles}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormInputField
                          name="slug"
                          control={control}
                          label="Slug"
                          required
                          helperText="URL-friendly identifier (e.g., my-blog-post)"
                          sx={commonFieldStyles}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormCKEditor
                          name="content"
                          control={control}
                          label="Content"
                          required
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormFileUploadField
                          name="image"
                          control={control}
                          label="Featured Image"
                          onFileChange={handleFileChange}
                          accept="image/*"
                          helperText={`Upload a featured image for the blog post (${MIN_IMAGE_WIDTH}-${MAX_IMAGE_WIDTH} × ${MIN_IMAGE_HEIGHT}-${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
                          sx={commonFieldStyles}
                          defaultImage={post.image_url}
                          error={!!imageError}
                          errorMessage={imageError}
                        />
                      </Grid>

                      {(post?.image_url || (imageValue instanceof File)) && (
                        <Grid item xs={12}>
                          <FormInputField
                            name="alt_text"
                            control={control}
                            label="Alt Text (Optional)"
                            sx={commonFieldStyles}
                          />
                        </Grid>
                      )}

                      {/* Redirect URL field - only for deleted posts */}
                      {post?.deleted_at && (
                        <Grid item xs={12}>
                          <FormInputField
                            name="redirect_url"
                            control={control}
                            label="Redirect URL (optional)"
                            helperText="Leave empty to skip. Enter a valid URL (e.g. https://example.com)."
                          />
                        </Grid>
                      )}

                      <Grid item xs={12} md={currentStatus === "published" ? 6 : 12}>
                        <FormControl fullWidth>
                          <InputLabel id="status-label" sx={{ color: "#2E9970" }}>Status</InputLabel>
                          <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                labelId="status-label"
                                label="Status"
                                sx={commonFieldStyles}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value !== "published") {
                                    setValue("published_at", null);
                                  }
                                }}
                              >
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="published">Published</MenuItem>
                                <MenuItem value="archived">Archived</MenuItem>
                              </Select>
                            )}
                          />
                        </FormControl>
                      </Grid>

                      {currentStatus === "published" && (
                        <Grid item xs={12} md={6}>
                          <FormDateTimeField
                            name="published_at"
                            control={control}
                            label="Published Date"
                            required
                            sx={commonFieldStyles}
                          />
                        </Grid>
                      )}

                      <Grid item xs={12}>
                          <Controller
                            name="categories"
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <Autocomplete
                                multiple
                                options={categories}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, val) => option.id === val.id}
                                value={value}
                                onChange={(_, newValue) => onChange(newValue)}
                                onInputChange={(_, newInputValue) => setCategorySearch(newInputValue)}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Categories"
                                    variant="outlined"
                                    sx={{...commonFieldStyles, flexGrow: 1}}
                                  />
                                )}
                                renderTags={(value, getTagProps) =>
                                  value.map((option, index) => (
                                    <Chip
                                      label={option.name}
                                      {...getTagProps({ index })}
                                      key={option.id}
                                    />
                                  ))
                                }
                              />
                            )}
                          />
                          <MuiButton
                    variant="text" 
                    size="small" 
                  onClick={() => setIsCategoryModalOpen(true)}
                    sx={{ alignSelf: 'flex-start', mt: 2, textTransform: 'none', color: '#247c5c' }}
                  >
                    + Add New Category
                  </MuiButton>
                      </Grid>

                      <Grid item xs={12}>
                        <Controller
                          name="tags"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <Autocomplete
                              multiple
                              options={tags}
                              getOptionLabel={(option) => option.name}
                              value={value}
                              onChange={(_, newValue) => onChange(newValue)}
                              onInputChange={(_, newInputValue) => setTagSearch(newInputValue)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Tags"
                                  variant="outlined"
                                  sx={commonFieldStyles}
                                />
                              )}
                              renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                  <Chip
                                    label={option.name}
                                    {...getTagProps({ index })}
                                    key={option.id}
                                  />
                                ))
                              }
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                          <Button onClick={() => router.back()}>Cancel</Button>
                          <AppButton
                            label="Update Post"
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

            <div role="tabpanel" hidden={activeTab !== 1} id="blog-post-faq-panel" aria-labelledby="blog-post-faq-tab">
              {activeTab === 1 && post?.id && (
                <Box sx={{ pt: 2 }}>
                  <FaqAccordion entityId={post.id} entityType="blog" />
                </Box>
              )}
              {activeTab === 1 && !post?.id && (
                <Typography color="error">Post ID is missing. Cannot load FAQs.</Typography>
              )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 2} id="blog-post-seo-panel" aria-labelledby="blog-post-seo-tab">
              {activeTab === 2 && post && (
                <SeoForm
                  entityId={post.id}
                  entityType="blog_post"
                  entityName={titleValue}
                  entitySlug={slugValue}
                  // fullWidth
                />
              )}
            </div>
          </Box>
        {/* </Box>
      </motion.div> */}
      
      <AddCategoryModal 
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
} 