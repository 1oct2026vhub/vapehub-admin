"use client";

import { useState } from "react";
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
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { createBlogTag } from "@/services/apiBlog";

// Define validation schema using Zod
const tagSchema = z.object({
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
});

type TagFormType = {
  name: string;
  slug: string;
};

export default function CreateBlogTag() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isValid },
  } = useForm<TagFormType>({
    mode: "all",
    defaultValues: {
      name: "",
      slug: "",
    },
    resolver: zodResolver(tagSchema),
  });

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
    const name = event.target.value;
    setValue("name", name);

    // Only auto-generate slug if it hasn't been manually edited
    if (getValues("slug") === "") {
      setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = async (data: TagFormType) => {
    try {
      setSubmitting(true);
      await createBlogTag({
        name: data.name,
        slug: data.slug,
      });
      showSnackbar("Tag created successfully", "success");
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
                  <Typography color="text.primary">New Tag</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">
                  Create New Tag
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
                  onChange={handleNameChange}
                />

                <FormInputField
                  name="slug"
                  control={control}
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