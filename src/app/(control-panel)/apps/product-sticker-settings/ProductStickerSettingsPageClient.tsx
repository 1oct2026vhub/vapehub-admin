"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import StickerPreviewChip from "@/components/Shared/StickerPreviewChip";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getProductStickerSettings,
  getProductStickerSettingsSchema,
  updateProductStickerSettings,
} from "@/services/apiProductStickerSettings";
import {
  HEX_COLOR_REGEX,
  type ProductStickerSettings,
} from "@/types/productSticker";

const newSectionSchema = z
  .object({
    enabled: z.boolean(),
    sticker_name: z.string().max(64, "Max 64 characters"),
    background_color: z.string(),
    duration_days: z.coerce.number().int().min(1, "Must be at least 1"),
    respect_is_new_flag: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.enabled) {
      if (!data.sticker_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sticker text is required when enabled",
          path: ["sticker_name"],
        });
      }
      if (!HEX_COLOR_REGEX.test(data.background_color)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must be a valid hex colour (#RRGGBB)",
          path: ["background_color"],
        });
      }
    }
  });

const newFlavoursSectionSchema = z
  .object({
    enabled: z.boolean(),
    sticker_name: z.string().max(64, "Max 64 characters"),
    background_color: z.string(),
    min_product_age_days: z.coerce.number().int().min(0, "Must be 0 or more"),
    duration_days: z.coerce.number().int().min(1, "Must be at least 1"),
  })
  .superRefine((data, ctx) => {
    if (data.enabled) {
      if (!data.sticker_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Sticker text is required when enabled",
          path: ["sticker_name"],
        });
      }
      if (!HEX_COLOR_REGEX.test(data.background_color)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must be a valid hex colour (#RRGGBB)",
          path: ["background_color"],
        });
      }
    }
  });

const settingsSchema = z.object({
  new: newSectionSchema,
  new_flavours: newFlavoursSectionSchema,
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const DEFAULTS: ProductStickerSettings = {
  new: {
    enabled: true,
    sticker_name: "NEW",
    background_color: "#000000",
    duration_days: 30,
    respect_is_new_flag: true,
  },
  new_flavours: {
    enabled: true,
    sticker_name: "NEW FLAVOURS",
    background_color: "#00A651",
    min_product_age_days: 30,
    duration_days: 28,
  },
};

function extractApiErrors(error: unknown): string[] {
  const err = error as {
    message?: string;
    error?: { message?: string; errors?: string[] };
    response?: { data?: { message?: string; error?: { errors?: string[] } } };
  };

  const nested =
    err?.error?.errors ||
    err?.response?.data?.error?.errors ||
    (error as { errors?: string[] })?.errors;

  if (Array.isArray(nested) && nested.length > 0) {
    return nested.map(String);
  }

  const message =
    err?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    "Failed to save sticker settings";
  return [message];
}

export default function ProductStickerSettingsPageClient() {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldLabels, setFieldLabels] = useState<Record<string, Record<string, string>>>({});

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: "onChange",
    defaultValues: DEFAULTS,
  });

  const watched = watch();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, schemaRes] = await Promise.all([
        getProductStickerSettings(),
        getProductStickerSettingsSchema().catch(() => null),
      ]);

      const data = settingsRes?.data ?? DEFAULTS;
      reset({
        new: { ...DEFAULTS.new, ...data.new },
        new_flavours: { ...DEFAULTS.new_flavours, ...data.new_flavours },
      });

      if (schemaRes?.data?.fields) {
        const labels: Record<string, Record<string, string>> = { new: {}, new_flavours: {} };
        for (const field of schemaRes.data.fields.new || []) {
          labels.new[field.key] = field.label;
        }
        for (const field of schemaRes.data.fields.new_flavours || []) {
          labels.new_flavours[field.key] = field.label;
        }
        setFieldLabels(labels);
      }
    } catch (error: unknown) {
      const messages = extractApiErrors(error);
      showSnackbar(messages[0], "error");
      reset(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, [reset, showSnackbar]);

  useEffect(() => {
    load();
  }, [load]);

  const label = useMemo(
    () => ({
      new: {
        enabled: fieldLabels.new?.enabled || "Enable NEW sticker",
        sticker_name: fieldLabels.new?.sticker_name || "Sticker text",
        background_color: fieldLabels.new?.background_color || "Background colour",
        duration_days:
          fieldLabels.new?.duration_days || "Show for days after product created",
        respect_is_new_flag:
          fieldLabels.new?.respect_is_new_flag ||
          "Also show when is_new flag is true",
      },
      new_flavours: {
        enabled: fieldLabels.new_flavours?.enabled || "Enable NEW FLAVOURS sticker",
        sticker_name: fieldLabels.new_flavours?.sticker_name || "Sticker text",
        background_color:
          fieldLabels.new_flavours?.background_color || "Background colour",
        min_product_age_days:
          fieldLabels.new_flavours?.min_product_age_days ||
          "Product must be at least this many days old",
        duration_days:
          fieldLabels.new_flavours?.duration_days ||
          "Show for days after new flavour added",
      },
    }),
    [fieldLabels]
  );

  const onSubmit = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      const payload: ProductStickerSettings = {
        new: {
          enabled: values.new.enabled,
          sticker_name: values.new.sticker_name.trim() || "NEW",
          background_color: values.new.background_color,
          duration_days: values.new.duration_days,
          respect_is_new_flag: values.new.respect_is_new_flag,
        },
        new_flavours: {
          enabled: values.new_flavours.enabled,
          sticker_name: values.new_flavours.sticker_name.trim() || "NEW FLAVOURS",
          background_color: values.new_flavours.background_color,
          min_product_age_days: values.new_flavours.min_product_age_days,
          duration_days: values.new_flavours.duration_days,
        },
      };

      const res = await updateProductStickerSettings(payload);
      reset(res.data);
      showSnackbar(res.message || "Product sticker settings updated successfully", "success");
    } catch (error: unknown) {
      const messages = extractApiErrors(error);
      messages.forEach((msg) => showSnackbar(msg, "error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[320px]">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-full p-6">
      <PageBreadcrumb />
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-2 mt-4">
        Product Sticker Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" className="mb-6">
        Controls automatic NEW and NEW FLAVOURS stickers. Manual stickers on a
        product are never overwritten by these rules.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        These settings apply when a product is created without a manual sticker,
        or when a flavour term is added to an older product. They do not stamp
        every existing product immediately.
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="h6" fontWeight={700}>
                    NEW products
                  </Typography>
                  <StickerPreviewChip
                    name={watched.new?.sticker_name || "NEW"}
                    backgroundColor={watched.new?.background_color || "#000000"}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Controller
                  name="new.enabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={label.new.enabled}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="new.sticker_name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          label={label.new.sticker_name}
                          error={!!errors.new?.sticker_name}
                          helperText={errors.new?.sticker_name?.message}
                          inputProps={{ maxLength: 64 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="new.background_color"
                      control={control}
                      render={({ field }) => (
                        <Box className="flex gap-2 items-start">
                          <TextField
                            type="color"
                            value={
                              HEX_COLOR_REGEX.test(field.value)
                                ? field.value
                                : "#000000"
                            }
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                            size="small"
                            sx={{ width: 64 }}
                            inputProps={{ "aria-label": "Colour picker" }}
                          />
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label={label.new.background_color}
                            error={!!errors.new?.background_color}
                            helperText={
                              errors.new?.background_color?.message || "#RRGGBB"
                            }
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="new.duration_days"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          label={label.new.duration_days}
                          error={!!errors.new?.duration_days}
                          helperText={errors.new?.duration_days?.message}
                          inputProps={{ min: 1 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="new.respect_is_new_flag"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label={label.new.respect_is_new_flag}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="h6" fontWeight={700}>
                    NEW FLAVOURS
                  </Typography>
                  <StickerPreviewChip
                    name={watched.new_flavours?.sticker_name || "NEW FLAVOURS"}
                    backgroundColor={
                      watched.new_flavours?.background_color || "#00A651"
                    }
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Controller
                  name="new_flavours.enabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={label.new_flavours.enabled}
                      sx={{ mb: 2 }}
                    />
                  )}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="new_flavours.sticker_name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          label={label.new_flavours.sticker_name}
                          error={!!errors.new_flavours?.sticker_name}
                          helperText={errors.new_flavours?.sticker_name?.message}
                          inputProps={{ maxLength: 64 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="new_flavours.background_color"
                      control={control}
                      render={({ field }) => (
                        <Box className="flex gap-2 items-start">
                          <TextField
                            type="color"
                            value={
                              HEX_COLOR_REGEX.test(field.value)
                                ? field.value
                                : "#00A651"
                            }
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                            size="small"
                            sx={{ width: 64 }}
                            inputProps={{ "aria-label": "Colour picker" }}
                          />
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            label={label.new_flavours.background_color}
                            error={!!errors.new_flavours?.background_color}
                            helperText={
                              errors.new_flavours?.background_color?.message ||
                              "#RRGGBB"
                            }
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="new_flavours.min_product_age_days"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          label={label.new_flavours.min_product_age_days}
                          error={!!errors.new_flavours?.min_product_age_days}
                          helperText={
                            errors.new_flavours?.min_product_age_days?.message
                          }
                          inputProps={{ min: 0 }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="new_flavours.duration_days"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          size="small"
                          type="number"
                          label={label.new_flavours.duration_days}
                          error={!!errors.new_flavours?.duration_days}
                          helperText={errors.new_flavours?.duration_days?.message}
                          inputProps={{ min: 1 }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box className="flex justify-end gap-3 mt-6">
          <AppButton
            type="button"
            label="Reset"
            variant="outlined"
            onClick={() => load()}
            disabled={saving || loading}
          />
          <AppButton
            type="submit"
            label="Save settings"
            loading={saving}
            disabled={saving || !isDirty}
          />
        </Box>
      </form>
    </div>
  );
}
