"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import {
  FooterBadge,
  createFooterBadge,
  updateFooterBadge,
} from "@/services/apiFooter";
import { validateImageDimensions } from "@/utils/imageUtils";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ICON_WIDTH = 36;
const ICON_HEIGHT = 36;
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

const urlPattern =
  /^(https:\/\/.+|[a-z0-9]+(?:[/_-][a-z0-9]+)*)$/i;

const badgeSchema = z
  .object({
    heading: z
      .string()
      .min(1, "Heading is required")
      .max(100, "Heading must not exceed 100 characters"),
    subtitle: z
      .string()
      .min(1, "Subtitle is required")
      .max(100, "Subtitle must not exceed 100 characters"),
    url: z
      .string()
      .max(300, "URL must not exceed 300 characters")
      .refine(
        (value) => !value || urlPattern.test(value),
        "Use a full https:// URL or a slug"
      )
      .optional()
      .or(z.literal("")),
    order: z.coerce
      .number()
      .int("Order must be an integer")
      .min(0, "Order must be 0 or greater")
      .optional(),
    is_active: z.boolean().default(true),
    icon: z
      .instanceof(File)
      .refine((file) => file.size <= MAX_FILE_SIZE, "Max file size is 2MB")
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
        "Only PNG, JPG, JPEG, WebP, or SVG is accepted"
      )
      .superRefine(async (file, ctx) => {
        if (file.type === "image/svg+xml") return;

        const validation = await validateImageDimensions(file, ICON_WIDTH, ICON_HEIGHT);
        if (!validation.valid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              validation.message ||
              `Icon must be exactly ${ICON_WIDTH}×${ICON_HEIGHT}px.`,
          });
        }
      })
      .optional(),
  });

type BadgeFormType = z.infer<typeof badgeSchema>;

interface AccreditationCardDialogProps {
  open: boolean;
  card: FooterBadge | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AccreditationCardDialog({
  open,
  card,
  nextOrder,
  onClose,
  onSaved,
  onSuccess,
  onError,
}: AccreditationCardDialogProps) {
  const isEdit = Boolean(card?.id);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const methods = useForm<BadgeFormType>({
    mode: "all",
    defaultValues: {
      heading: "",
      subtitle: "",
      url: "",
      order: nextOrder,
      is_active: true,
      icon: undefined,
    },
    resolver: zodResolver(badgeSchema),
  });

  const { isValid } = methods.formState;
  const iconFile = methods.watch("icon");

  useEffect(() => {
    if (!open) return;

    methods.reset({
      heading: card?.heading || "",
      subtitle: card?.subtitle || "",
      url: card?.url || "",
      order: card?.order ?? nextOrder,
      is_active: card?.is_active ?? true,
      icon: undefined,
    });
    setPreviewUrl(card?.icon_url || null);
  }, [open, card, nextOrder, methods]);

  useEffect(() => {
    if (!iconFile) return;
    const objectUrl = URL.createObjectURL(iconFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [iconFile]);

  const handleSubmit = async (data: BadgeFormType) => {
    if (!isEdit && !data.icon) {
      onError("Icon is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        heading: data.heading.trim(),
        subtitle: data.subtitle.trim(),
        url: data.url?.trim() || undefined,
        order: data.order,
        is_active: data.is_active,
        icon: data.icon,
      };

      if (card?.id) {
        await updateFooterBadge(card.id, payload);
        onSuccess("Trust badge updated successfully");
      } else {
        await createFooterBadge(payload);
        onSuccess("Trust badge created successfully");
      }

      onSaved();
      onClose();
    } catch (error: any) {
      const message =
        error?.errors?.[0]?.msg ||
        error?.message ||
        "Failed to save trust badge";
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Trust Badge" : "Add Trust Badge"}</DialogTitle>
      <DialogContent>
        <Box py={1}>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <Box display="grid" gridTemplateColumns="1fr" gap={2}>
                <FormInputField
                  name="heading"
                  control={methods.control}
                  label="Heading"
                  required
                />
                <FormInputField
                  name="subtitle"
                  control={methods.control}
                  label="Subtitle"
                  required
                />
                <FormInputField
                  name="url"
                  control={methods.control}
                  label="Link URL or slug (optional)"
                />
                <FormInputField
                  name="order"
                  control={methods.control}
                  label="Display order"
                  type="number"
                />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Icon{!isEdit ? " *" : ""}
                  </Typography>
                  <Button variant="outlined" component="label">
                    {isEdit ? "Replace icon" : "Upload icon"}
                    <input
                      hidden
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        methods.setValue("icon", file, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Button>
                  {methods.formState.errors.icon?.message && (
                    <Typography color="error" variant="caption" display="block" mt={0.5}>
                      {String(methods.formState.errors.icon.message)}
                    </Typography>
                  )}
                  {previewUrl && (
                    <Box
                      mt={2}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 2,
                        bgcolor: "#163c32",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="Badge icon preview"
                        sx={{ maxWidth: 36, maxHeight: 36, objectFit: "contain" }}
                      />
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Required size: {ICON_WIDTH}×{ICON_HEIGHT}px. PNG, JPG, JPEG, WebP, or SVG
                    (SVG is exempt from pixel size). Max 2MB. Omit on edit to keep the current icon.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={methods.watch("is_active")}
                      onChange={(event) =>
                        methods.setValue("is_active", event.target.checked, {
                          shouldDirty: true,
                        })
                      }
                    />
                  }
                  label="Active"
                />
              </Box>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                <Button onClick={onClose}>Cancel</Button>
                <AppButton
                  type="submit"
                  loading={submitting}
                  disabled={!isValid || submitting || (!isEdit && !iconFile)}
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
