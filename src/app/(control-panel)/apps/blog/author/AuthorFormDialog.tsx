"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
} from "@mui/material";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormAvatarUploadField from "@/components/Shared/FormAvatarUploadField";
import {
  BlogAuthor,
  createBlogAuthor,
  updateBlogAuthor,
} from "@/services/apiBlog";
import { commonFieldStyles } from "../posts/components/blogPostFormShared";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const optionalUrl = z
  .string()
  .refine(
    (value) =>
      !value ||
      /^https?:\/\/.+/i.test(value) ||
      /^\/[a-z0-9\-/?=&_]*$/i.test(value),
    "Enter a valid URL or site path",
  )
  .optional()
  .or(z.literal(""));

const authorSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters"),
  last_name: z
    .string()
    .max(100, "Last name must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  role: z.string().max(100, "Role must not exceed 100 characters").optional(),
  bio: z.string().max(2000, "Bio must not exceed 2000 characters").optional(),
  slug: z
    .string()
    .max(150, "Slug must not exceed 150 characters")
    .refine(
      (value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Slug must be lowercase letters, numbers, and hyphens",
    )
    .optional()
    .or(z.literal("")),
  archive_url: optionalUrl,
  team_url: optionalUrl,
  avatar: z
    .any()
    .refine(
      (file) => !file || !(file instanceof File) || file.size <= MAX_FILE_SIZE,
      "File size exceeds the maximum limit of 5MB.",
    )
    .optional(),
});

type AuthorFormType = z.infer<typeof authorSchema>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface AuthorFormDialogProps {
  open: boolean;
  author: BlogAuthor | null;
  onClose: () => void;
  onSaved: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AuthorFormDialog({
  open,
  author,
  onClose,
  onSaved,
  onSuccess,
  onError,
}: AuthorFormDialogProps) {
  const isEdit = Boolean(author?.id);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<AuthorFormType>({
    mode: "all",
    resolver: zodResolver(authorSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      role: "",
      bio: "",
      slug: "",
      archive_url: "",
      team_url: "",
      avatar: undefined,
    },
  });

  const firstName = useWatch({ control: methods.control, name: "first_name" });
  const lastName = useWatch({ control: methods.control, name: "last_name" });

  useEffect(() => {
    if (!open) return;

    methods.reset({
      first_name: author?.first_name || "",
      last_name: author?.last_name || "",
      role: author?.role || "",
      bio: author?.bio || "",
      slug: author?.slug || "",
      archive_url: author?.archive_url || "",
      team_url: author?.team_url || "",
      avatar: undefined,
    });
  }, [open, author, methods]);

  useEffect(() => {
    if (isEdit || methods.formState.dirtyFields.slug) return;
    methods.setValue(
      "slug",
      slugify([firstName, lastName].filter(Boolean).join(" ")),
      { shouldDirty: false },
    );
  }, [isEdit, firstName, lastName, methods]);

  const handleSubmit = async (data: AuthorFormType) => {
    try {
      setSubmitting(true);
      const payload = {
        first_name: data.first_name.trim(),
        last_name: data.last_name?.trim() || "",
        role: data.role?.trim() || "",
        bio: data.bio?.trim() || "",
        slug:
          data.slug?.trim() ||
          slugify([data.first_name, data.last_name].filter(Boolean).join(" ")),
        archive_url: data.archive_url?.trim() || "",
        team_url: data.team_url?.trim() || "",
        avatar: data.avatar instanceof File ? data.avatar : undefined,
      };

      if (author?.id) {
        await updateBlogAuthor(author.id, payload);
        onSuccess("Author updated successfully");
      } else {
        await createBlogAuthor(payload);
        onSuccess("Author created successfully");
      }

      onSaved();
      onClose();
    } catch (error: any) {
      onError(
        error?.errors?.[0]?.msg || error?.message || "Failed to save author",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit author" : "Add author"}</DialogTitle>
      <DialogContent>
        <Box py={1}>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormInputField
                    name="first_name"
                    control={methods.control}
                    label="First name"
                    required
                    sx={commonFieldStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormInputField
                    name="last_name"
                    control={methods.control}
                    label="Last name"
                    sx={commonFieldStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormInputField
                    name="role"
                    control={methods.control}
                    label="Role"
                    helperText='Shown under the name, e.g. "VapeHub product team"'
                    sx={commonFieldStyles}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormInputField
                    name="slug"
                    control={methods.control}
                    label="Slug"
                    helperText="Used in storefront author filters"
                    sx={commonFieldStyles}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormAvatarUploadField
                    name="avatar"
                    control={methods.control}
                    label="Avatar"
                    helperText="Optional. PNG, JPG, JPEG, or WebP (max 5MB). Crop to a square."
                    defaultImage={author?.avatar_url || undefined}
                    sx={commonFieldStyles}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormTextareaField
                    name="bio"
                    control={methods.control}
                    label="Bio"
                    rows={4}
                    placeholder="Part of the VapeHub product team..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormInputField
                    name="archive_url"
                    control={methods.control}
                    label="Archive URL (optional)"
                    sx={commonFieldStyles}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormInputField
                    name="team_url"
                    control={methods.control}
                    label="Team URL (optional)"
                    sx={commonFieldStyles}
                  />
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                <Button onClick={onClose}>Cancel</Button>
                <AppButton
                  type="submit"
                  loading={submitting}
                  disabled={!methods.formState.isValid || submitting}
                  label={isEdit ? "Update" : "Create"}
                />
              </Box>
            </form>
          </FormProvider>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
