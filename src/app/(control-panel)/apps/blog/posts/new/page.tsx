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
} from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
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
import { Button as MuiButton, Box as MuiBox } from "@mui/material";

import AddCategoryModal from "@/components/Shared/AddCategoryModal";
import debounce from "lodash/debounce";
import AddIcon from '@mui/icons-material/Add';

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
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must not exceed 100 characters")
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
});

type PostFormType = z.infer<typeof postSchema>;

const commonFieldStyles: SxProps<Theme> = {
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
} as const;

export default function CreateBlogPost() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Create New Post | VapeHub";
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { isValid, errors },
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

  const currentStatus = watch("status");

  const fetchCategories = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogCategories({
        search: searchTerm,
        limit: 50,
      });
      if (response?.data?.categories) {
        const activeCategories = response.data.categories.filter(
          category => category.status === "active"
        );
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
    
    // const currentSelectedCategories = getValues("categories") || [];
    // setValue("categories", [...currentSelectedCategories, newCategory], { shouldValidate: true });
  };

  const onSubmit = async (data: PostFormType) => {
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

      await createBlogPost(formData);
      showSnackbar("Post created successfully", "success");
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
                Create New Blog Post
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
                      onFileChange={handleFileChange}
                      accept="image/*"
                      helperText={`Upload a featured image for the blog post (${MIN_IMAGE_WIDTH}-${MAX_IMAGE_WIDTH} × ${MIN_IMAGE_HEIGHT}-${MAX_IMAGE_HEIGHT} px, Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP`}
                      sx={commonFieldStyles}
                      error={!!imageError}
                      errorMessage={imageError}
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
                      
                      
                      <MuiButton
              variant="text" 
              size="small" 
            onClick={() => setIsCategoryModalOpen(true)}
              sx={{ alignSelf: 'flex-start', mt: 2, textTransform: 'none', color: '#247c5c' }}
            >
              + Add New Category
            </MuiButton>
                  </Grid>

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
                      <Button variant="outlined" onClick={() => router.back()}>
                        Cancel
                      </Button>
                      <AppButton
                        label="Create Post"
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
      
      <AddCategoryModal 
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />

    </Container>
  );
} 