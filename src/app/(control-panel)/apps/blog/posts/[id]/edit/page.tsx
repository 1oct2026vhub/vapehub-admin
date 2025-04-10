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
  Link,
  Button,
  Autocomplete,
  TextField,
  Chip,
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

// Define validation schema using Zod
const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  content: z.string().min(1, "Content is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(150, "Slug must not exceed 150 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be in valid format (lowercase letters, numbers, and hyphens)"
    ),
  image: z.any().optional(),
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

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { isValid },
  } = useForm<PostFormType>({
    mode: "all",
    resolver: zodResolver(postSchema),
  });

  // Fetch categories with debounced search
  const fetchCategories = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogCategories({
        search: searchTerm,
        limit: 50,
      });
      if (response?.data?.categories) {
        // Filter to only show active categories
        const activeCategories = response.data.categories.filter(
          category => category.status === "active"
        );
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, 300);

  // Fetch tags with debounced search
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

  // Handle category search
  useEffect(() => {
    fetchCategories(categorySearch);
  }, [categorySearch]);

  // Handle tag search
  useEffect(() => {
    fetchTags(tagSearch);
  }, [tagSearch]);

  // Initial load of categories and tags
  useEffect(() => {
    fetchCategories("");
    fetchTags("");
  }, []);

  // Fetch post details
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
            status: response.data.status || "draft",
            published_at: response.data.published_at || null,
            categories: response.data.categories || [],
            tags: response.data.tags || [],
            is_active: response.data.is_active,
          });
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
        showSnackbar("Failed to load post data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  // Auto-generate slug when title changes
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("title", event.target.value);
  };

  const onSubmit = async (data: PostFormType) => {
    if (!post?.id) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("slug", data.slug);
      formData.append("status", data.status);
      formData.append("is_active", data.is_active.toString());

      if (data.published_at) {
        formData.append("published_at", data.published_at);
      }

      // Convert category IDs to comma-separated string
      const categoryIds = data.categories.map(cat => cat.id).join(',');
      formData.append("categories", categoryIds);
      
      // Convert tag IDs to comma-separated string
      const tagIds = data.tags.map(tag => tag.id).join(',');
      formData.append("tags", tagIds);

      if (selectedFile) {
        formData.append("image", selectedFile);
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
          <Box sx={{ width: "100%", maxWidth: 900, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Edit Blog Post
              </Typography>
            </Box>

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
                      onFileChange={setSelectedFile}
                      accept="image/*"
                      helperText="Upload a featured image for the blog post"
                      sx={commonFieldStyles}
                      defaultImage={post.image_url}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
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
                          >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="published">Published</MenuItem>
                            <MenuItem value="archived">Archived</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormDateTimeField
                      name="published_at"
                      control={control}
                      label="Published Date"
                      // helperText="Leave blank to save as draft"
                      sx={commonFieldStyles}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="categories"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <Autocomplete
                          multiple
                          options={categories}
                          getOptionLabel={(option) => option.name}
                          value={value}
                          onChange={(_, newValue) => onChange(newValue)}
                          onInputChange={(_, newInputValue) => setCategorySearch(newInputValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Categories"
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
          </Box>
        </Box>
      </motion.div>
    </Container>
  );
} 