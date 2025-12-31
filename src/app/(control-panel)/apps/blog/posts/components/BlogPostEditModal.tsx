"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormDateTimeField from "@/components/Shared/FormDateTimeField";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import FormMultiTextField from "@/components/Shared/FormMultiTextField";
import AppButton from "@/components/Shared/AppButton";
import { BlogPost, BlogCategory, BlogTag, updateBlogPost, createBlogPost } from "@/services/apiBlog";

// Post schema (same as in BlogPostsApp)
const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(150, "Title must not exceed 150 characters"),
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
  image: z.any().optional(),
  published_at: z.string().nullable().optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

type PostFormType = z.infer<typeof postSchema>;

interface BlogPostEditModalProps {
  open: boolean;
  onClose: () => void;
  post?: BlogPost | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  onSave: () => void;
}

export default function BlogPostEditModal({
  open,
  onClose,
  post,
  categories,
  tags,
  onSave,
}: BlogPostEditModalProps) {
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const methods = useForm<PostFormType>({
    mode: "all",
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      slug: post?.slug || "",
      alt_text: (post as any)?.alt_text || "",
      published_at: post?.published_at || null,
      categories: post?.categories?.map((cat) => cat.name) || [],
      tags: post?.tags?.map((tag) => tag.name) || [],
      is_active: post?.is_active ?? true,
    },
    resolver: zodResolver(postSchema),
  });

  const { isValid, errors } = methods.formState;

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      methods.reset({
        title: post.title,
        content: post.content,
        slug: post.slug,
        alt_text: (post as any).alt_text || "",
        published_at: post.published_at || null,
        categories: post.categories?.map((cat) => cat.name) || [],
        tags: post.tags?.map((tag) => tag.name) || [],
        is_active: post.is_active,
      });
    } else {
      methods.reset({
        title: "",
        content: "",
        slug: "",
        alt_text: "",
        published_at: null,
        categories: [],
        tags: [],
        is_active: true,
      });
    }
  }, [post]);

  const handleApiError = (error: any) => {
    if (error?.errors) {
      showSnackbar(error.errors[0]?.msg || "Failed to save blog post", "error");
    } else {
      const errorMessage = error?.message || "Failed to save blog post";
      showSnackbar(errorMessage, "error");
    }

    if (error?.error && typeof error.error === "object") {
      Object.entries(error.error).forEach(([field, message]) => {
        if (typeof message === "string") {
          showSnackbar(message, "error");
        }
      });
    }
  };

  const handleSubmit = async (data: PostFormType) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("slug", data.slug);
      formData.append("is_active", data.is_active.toString());

      if (data.alt_text) {
        formData.append("alt_text", data.alt_text);
      }

      if (data.published_at) {
        formData.append("published_at", data.published_at);
      }

      formData.append("categories", JSON.stringify(data.categories));
      formData.append("tags", JSON.stringify(data.tags));

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      if (post?.id) {
        await updateBlogPost(post.id, formData);
        showSnackbar("Blog post updated successfully", "success");
      } else {
        await createBlogPost(formData);
        showSnackbar("Blog post created successfully", "success");
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Failed to save blog post:", error);
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    methods.setValue("title", event.target.value);
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{post ? "Edit Blog Post" : "Add Blog Post"}</DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)}>
            <Box sx={{ mt: 2 }}>
              {errors?.root?.message && (
                <Alert className="mb-4" severity="error">
                  {errors?.root?.message}
                </Alert>
              )}

              <FormInputField
                name="title"
                control={methods.control}
                label="Title"
                required
                autoFocus
                onChange={handleTitleChange}
              />

              <FormInputField
                name="slug"
                control={methods.control}
                label="Slug"
                required
                helperText="URL-friendly identifier (e.g., my-blog-post)"
              />

              <FormTextareaField
                name="content"
                control={methods.control}
                label="Content (HTML)"
                required
                rows={8}
              />

              <FormFileUploadField
                name="image"
                control={methods.control}
                label="Featured Image"
                onFileChange={handleFileChange}
                accept="image/*"
                helperText="Upload a featured image for the blog post"
                defaultImage={post?.image_url}
              />

              {(selectedFile || post?.image_url) && (
                <FormInputField
                  name="alt_text"
                  control={methods.control}
                  label="Alt Text"
                />
              )}

              <FormDateTimeField
                name="published_at"
                control={methods.control}
                label="Published Date"
                helperText="Leave blank to save as draft"
              />

              <FormMultiTextField
                name="categories"
                control={methods.control}
                label="Categories"
                placeholder="Type and press enter to add categories"
                helperText="Type category names and press enter to add them"
                suggestions={categories.map((cat) => cat.name)}
                error={!!errors.categories}
                errorMessage={errors.categories?.message}
              />

              <FormMultiTextField
                name="tags"
                control={methods.control}
                label="Tags"
                placeholder="Type and press enter to add tags"
                helperText="Type tag names and press enter to add them"
                suggestions={tags.map((tag) => tag.name)}
                error={!!errors.tags}
                errorMessage={errors.tags?.message}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={methods.watch("is_active")}
                    onChange={(e) =>
                      methods.setValue("is_active", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 3,
                  gap: 2,
                }}
              >
                <Button onClick={onClose}>Cancel</Button>
                <AppButton
                  label={post ? "Update" : "Create"}
                  type="submit"
                  disabled={!isValid || submitting}
                  loading={submitting}
                />
              </Box>
            </Box>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
} 