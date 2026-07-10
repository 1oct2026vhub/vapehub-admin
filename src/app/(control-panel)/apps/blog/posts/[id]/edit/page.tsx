"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AppButton from "@/components/Shared/AppButton";
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
import SeoForm from "@/app/(control-panel)/apps/seo/components/SeoForm";
import PageBreadcrumb from "@/components/PageBreadcrumb";
// import BlogPostTemplateBanner from "../../components/BlogPostTemplateBanner";
import BlogPostEeatSections from "../../components/BlogPostEeatSections";
import RelatedGuidesPicker from "../../components/RelatedGuidesPicker";
import BlogPostPullQuoteFields from "../../components/BlogPostPullQuoteFields";
import BlogPostInlineProductCardFields from "../../components/BlogPostInlineProductCardFields";
import BlogPostFirstPersonCalloutFields from "../../components/BlogPostFirstPersonCalloutFields";
import BlogPostDetailsFields from "../../components/BlogPostDetailsFields";
import {
  buildBlogPostFormData,
  blogPostBaseSchema,
  blogPostDefaultValues,
  mapBlogPostToFormValues,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  type BlogPostFormType,
} from "../../components/blogPostFormShared";

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
    document.title = "Edit Blog Post | VapeHub";
  }, []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isValid },
  } = useForm<BlogPostFormType>({
    mode: "all",
    resolver: zodResolver(blogPostBaseSchema),
    defaultValues: blogPostDefaultValues,
  });

  const titleValue = watch("title");
  const slugValue = watch("slug");
  const currentStatus = watch("status");
  const imageValue = watch("image");

  const initialAuthor = useMemo(() => {
    if (!post?.author?.id) return null;
    const name = [post.author.first_name, post.author.last_name]
      .filter(Boolean)
      .join(" ");
    return {
      id: post.author.id,
      label: name || post.author.email || `User #${post.author.id}`,
    };
  }, [post]);

  const defaultAvatarUrl = useMemo(() => {
    return (
      post?.author_override?.avatar_url ||
      post?.author?.profile_pic_url ||
      undefined
    );
  }, [post]);

  const fetchCategories = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogCategories({ search: searchTerm, limit: 50 });
      if (response?.data?.categories) {
        const activeCategories = response.data.categories.filter(
          (cat) => cat.status === "active",
        );
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, 300);

  const fetchTags = debounce(async (searchTerm: string) => {
    try {
      const response = await getBlogTags({ search: searchTerm, limit: 50 });
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
          reset(mapBlogPostToFormValues(response.data));
          const initialCategories = response.data.categories || [];
          setCategories((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const uniqueNew = initialCategories.filter((c) => !existingIds.has(c.id));
            return [...prev, ...uniqueNew].sort((a, b) =>
              a.name.localeCompare(b.name),
            );
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
    if (!post?.id) return;

    if (selectedFile && !(await validateImageDimensions(selectedFile))) {
      return;
    }

    try {
      setSubmitting(true);

      const formData = buildBlogPostFormData(data, {
        image: selectedFile,
        redirectUrl: post?.deleted_at ? data.redirect_url : undefined,
        isEdit: true,
      });

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
        showSnackbar("An unexpected error occurred", "error");
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
      <div className="md:px-14 p-4">
        <Typography variant="h6" color="error">
          Post not found
        </Typography>
      </div>
    );
  }

  const showSaveBar = activeTab !== 6;

  return (
    <div className="md:px-14 p-4">
      <PageBreadcrumb />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Edit Blog Post
        </Typography>
        {/* <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure post content and E-E-A-T blocks to match the Geek Zone blog
          detail template.
        </Typography> */}
      </Box>

      {/* <BlogPostTemplateBanner /> */}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="blog edit tabs"
        >
          <Tab label="Post Details" />
          <Tab label="E-E-A-T Blocks" />
          <Tab label="Related Guides" />
          <Tab label="Pull Quote" />
          <Tab label="Inline Product Card" />
          <Tab label="First-person Callout" />
          <Tab label="SEO" />
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
                defaultImage={post.image_url}
                showAltText={!!(post?.image_url || imageValue instanceof File)}
                showRedirectUrl={!!post?.deleted_at}
              />
            </Paper>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== 1}>
          {activeTab === 1 && (
            <Paper sx={{ p: 4 }}>
              <BlogPostEeatSections
                control={control}
                setValue={setValue}
                initialAuthor={initialAuthor}
                defaultAvatarUrl={defaultAvatarUrl}
              />
            </Paper>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== 2}>
          {activeTab === 2 && (
            <Paper sx={{ p: 4 }}>
              <RelatedGuidesPicker control={control} currentPostId={post.id} />
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

        <div role="tabpanel" hidden={activeTab !== 4}>
          {activeTab === 4 && (
            <Paper sx={{ p: 4 }}>
              <BlogPostInlineProductCardFields control={control} setValue={setValue} />
            </Paper>
          )}
        </div>

        <div role="tabpanel" hidden={activeTab !== 5}>
          <Paper sx={{ p: 4, display: activeTab === 5 ? "block" : "none" }}>
            <BlogPostFirstPersonCalloutFields control={control} />
          </Paper>
        </div>

        {showSaveBar && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 3,
            }}
          >
            <Button onClick={() => router.back()}>Cancel</Button>
            <AppButton
              label="Update Post"
              type="submit"
              disabled={!isValid || submitting}
              loading={submitting}
            />
          </Box>
        )}
      </form>

      <div role="tabpanel" hidden={activeTab !== 6}>
        {activeTab === 6 && (
          <Paper sx={{ p: 4 }}>
            <SeoForm
              entityId={post.id}
              entityType="blog_post"
              entityName={titleValue}
              entitySlug={slugValue}
            />
          </Paper>
        )}
      </div>

      <AddCategoryModal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  );
}
