"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  createBlogPost,
  getBlogCategories,
  getBlogTags,
  BlogCategory,
  BlogTag,
} from "@/services/apiBlog";
import AddCategoryModal from "@/components/Shared/AddCategoryModal";
import debounce from "lodash/debounce";
import PageBreadcrumb from "@/components/PageBreadcrumb";
// import BlogPostTemplateBanner from "../components/BlogPostTemplateBanner";
import BlogPostEeatSections from "../components/BlogPostEeatSections";
import RelatedGuidesPicker from "../components/RelatedGuidesPicker";
import BlogPostPullQuoteFields from "../components/BlogPostPullQuoteFields";
import BlogPostDetailsFields from "../components/BlogPostDetailsFields";
import {
  buildBlogPostFormData,
  blogPostBaseSchema,
  blogPostDefaultValues,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  type BlogPostFormType,
} from "../components/blogPostFormShared";

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
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    document.title = "Create New Post | VapeHub";
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<BlogPostFormType>({
    mode: "all",
    defaultValues: blogPostDefaultValues,
    resolver: zodResolver(blogPostBaseSchema),
  });

  const currentStatus = watch("status");
  const imageValue = watch("image");

  const fetchCategories = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogCategories({
        search: searchTerm,
        limit: 50,
      });
      if (response?.data?.categories) {
        const activeCategories = response.data.categories.filter(
          (category) => category.status === "active",
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
          setImageError(
            `Image dimensions must be at least ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT} pixels.`,
          );
          resolve(false);
        } else if (img.width > MAX_IMAGE_WIDTH || img.height > MAX_IMAGE_HEIGHT) {
          setImageError(
            `Image dimensions must not exceed ${MAX_IMAGE_WIDTH}×${MAX_IMAGE_HEIGHT} pixels.`,
          );
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
    setCategories((prev) =>
      [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const onSubmit = async (data: BlogPostFormType) => {
    if (selectedFile && !(await validateImageDimensions(selectedFile))) {
      return;
    }

    try {
      setSubmitting(true);

      const formData = buildBlogPostFormData(data, { image: selectedFile });

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
        showSnackbar("An unexpected error occurred", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageBreadcrumb />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ width: "100%", maxWidth: 900, mx: "auto" }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Create New Blog Post
            </Typography>
            {/* <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Configure post content and E-E-A-T blocks to match the Geek Zone
              blog detail template.
            </Typography> */}
          </Box>

          {/* <BlogPostTemplateBanner /> */}

          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              aria-label="blog create tabs"
            >
              <Tab label="Post Details" />
              <Tab label="E-E-A-T Blocks" />
              <Tab label="Related Guides" />
              <Tab label="Pull Quote" />
            </Tabs>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div role="tabpanel" hidden={activeTab !== 0}>
              {activeTab === 0 && (
                <Paper sx={{ p: 4 }}>
                  <BlogPostDetailsFields
                    control={control}
                    setValue={setValue}
                    currentStatus={currentStatus}
                    categories={categories}
                    tags={tags}
                    onCategorySearchChange={setCategorySearch}
                    onTagSearchChange={setTagSearch}
                    onTitleChange={handleTitleChange}
                    onFileChange={handleFileChange}
                    onAddCategoryClick={() => setIsCategoryModalOpen(true)}
                    imageError={imageError}
                    showAltText={!!(selectedFile || imageValue instanceof File)}
                  />
                </Paper>
              )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 1}>
              {activeTab === 1 && (
                <Paper sx={{ p: 4 }}>
                  <BlogPostEeatSections control={control} setValue={setValue} />
                </Paper>
              )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 2}>
              {activeTab === 2 && (
                <Paper sx={{ p: 4 }}>
                  <RelatedGuidesPicker control={control} />
                </Paper>
              )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 3}>
              {activeTab === 3 && (
                <Paper sx={{ p: 4 }}>
                  <BlogPostPullQuoteFields control={control} />
                </Paper>
              )}
            </div>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 3,
              }}
            >
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
          </form>
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
