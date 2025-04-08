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
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import FormDateTimeField from "@/components/Shared/FormDateTimeField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { 
  createBlogPost, 
  getBlogCategories, 
  getBlogTags, 
  BlogCategory, 
  BlogTag 
} from "@/services/apiBlog";
import debounce from "lodash/debounce";

// Define validation schema using Zod
const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title must not exceed 150 characters"),
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

export default function CreateBlogPost() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isValid },
  } = useForm<PostFormType>({
    mode: "all",
    defaultValues: {
      title: "",
      content: "",
      slug: "",
      status: "draft",
      published_at: null,
      categories: [],
      tags: [],
      is_active: true,
    },
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
        setCategories(response.data.categories);
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

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove consecutive hyphens
  };

  // Auto-generate slug when title changes
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const title = event.target.value;
    setValue("title", title);

    // Only auto-generate slug if it hasn't been manually edited
    if (getValues("slug") === "") {
      setValue("slug", generateSlug(title));
    }
  };

  const onSubmit = async (data: PostFormType) => {
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

      // Add categories and tags as arrays
      formData.append("categories", data.categories.map(cat => cat.id).join(","));
      formData.append("tags", data.tags.map(tag => tag.id).join(","));

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await createBlogPost(formData);
      showSnackbar("Post created successfully", "success");
      router.push("/apps/blog/posts");
    } catch (error: any) {
      console.error("Failed to create post:", error);
      if (error?.errors) {
        showSnackbar(error.errors[0]?.msg || "Failed to create post", "error");
      } else {
        showSnackbar(error?.message || "Failed to create post", "error");
      }
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
                    href="/apps/blog/posts"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/apps/blog/posts");
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    Posts
                  </Link>
                  <Typography color="text.primary">New Post</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">
                  Create New Post
                </Typography>
              </div>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper className="p-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormInputField
                  name="title"
                  control={control}
                  label="Title"
                  required
                  autoFocus
                  onChange={handleTitleChange}
                />

                <FormInputField
                  name="slug"
                  control={control}
                  label="Slug"
                  required
                  helperText="URL-friendly identifier (e.g., my-post)"
                />

                <FormCKEditor
                  name="content"
                  control={control}
                  label="Content"
                />

                <FormFileUploadField
                  name="image"
                  control={control}
                  label="Featured Image"
                  onFileChange={setSelectedFile}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        labelId="status-label"
                        id="status"
                        value={field.value}
                        onChange={field.onChange}
                        label="Status"
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="published">Published</MenuItem>
                        <MenuItem value="archived">Archived</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <FormDateTimeField
                  name="published_at"
                  control={control}
                  label="Publish Date"
                />

                <Controller
                  name="categories"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      multiple
                      options={categories}
                      getOptionLabel={(option) => option.name}
                      value={value}
                      onChange={(_, newValue) => onChange(newValue)}
                      onInputChange={(_, value) => setCategorySearch(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Categories"
                          variant="outlined"
                          margin="normal"
                          fullWidth
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            key={option.id}
                            label={option.name}
                            {...getTagProps({ index })}
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      }
                    />
                  )}
                />

                <Controller
                  name="tags"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      multiple
                      options={tags}
                      getOptionLabel={(option) => option.name}
                      value={value}
                      onChange={(_, newValue) => onChange(newValue)}
                      onInputChange={(_, value) => setTagSearch(value)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Tags"
                          variant="outlined"
                          margin="normal"
                          fullWidth
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            key={option.id}
                            label={option.name}
                            {...getTagProps({ index })}
                            color="secondary"
                            variant="outlined"
                          />
                        ))
                      }
                    />
                  )}
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
                    onClick={() => router.push("/apps/blog/posts")}
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