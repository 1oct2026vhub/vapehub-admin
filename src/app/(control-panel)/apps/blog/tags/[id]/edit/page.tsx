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
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { BlogTag, createBlogTag, getBlogTagById, updateBlogTag } from "@/services/apiBlog";

// Define validation schema using Zod
const tagSchema = z.object({
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
});

type TagFormType = z.infer<typeof tagSchema>;

export default function EditBlogTag() {
  const params = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Edit Blog Tag | VapeHub";
  }, []);

  const methods = useForm<TagFormType>({
    mode: "all",
    resolver: zodResolver(tagSchema),
  });

  const { isValid, errors } = methods.formState;

  // Fetch tag details
  const fetchTagDetails = async () => {
    try {
      setLoading(true);
      const response = await getBlogTagById(Number(params.id));
      if (response?.data) {
        methods.reset({
          name: response.data.name,
          slug: response.data.slug,
        });
      }
    } catch (error) {
      console.error("Failed to fetch tag details:", error);
      showSnackbar("Failed to load tag details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id !== "new") {
      fetchTagDetails();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Remove consecutive hyphens
  };

  // Auto-generate slug when name changes
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    methods.setValue("name", event.target.value);
  };

  const onSubmit = async (data: TagFormType) => {
    try {
      setSubmitting(true);

      const tagData = {
        name: data.name,
        slug: data.slug
      } as const;

      if (params.id === "new") {
        // Create new tag
        await createBlogTag(tagData);
        showSnackbar("Tag created successfully", "success");
      } else {
        // Update existing tag
        await updateBlogTag(Number(params.id), tagData);
        showSnackbar("Tag updated successfully", "success");
      }

      router.push("/apps/blog/tags");
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
                    href="/apps/blog/tags"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/apps/blog/tags");
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    Tags
                  </Link>
                  <Typography color="text.primary">
                    {params.id === "new" ? "New Tag" : "Edit Tag"}
                  </Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">
                  {params.id === "new" ? "New Tag" : "Edit Tag"}
                </Typography>
              </div>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper className="p-6">
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <FormInputField
                  name="name"
                  control={methods.control}
                  label="Name"
                  required
                  autoFocus
                  onChange={handleNameChange}
                />

                <FormInputField
                  name="slug"
                  control={methods.control}
                  label="Slug"
                  required
                  helperText="URL-friendly identifier (e.g., my-tag)"
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
                    onClick={() => router.push("/apps/blog/tags")}
                  >
                    Cancel
                  </Button>
                  <AppButton
                    label={params.id === "new" ? "Create" : "Update"}
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