"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  categoryDetails,
  updateCategory,
} from "@/services/apiProductCategory";

type TypeCardsFormValues = {
  type_cards_html: string;
};

/**
 * Type cards (CKEditor HTML) for category — stored as `type_cards_html`.
 * Separate from related_links / Related Categories.
 */
export default function RelatedCollectionsTab({
  categoryId,
  initialHtml,
  onSaved,
}: {
  categoryId: number;
  /** Prefer from GET /api/admin/category/:id */
  initialHtml?: string | null;
  onSaved?: (html: string) => void;
}) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryMeta, setCategoryMeta] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  const { control, handleSubmit, reset } = useForm<TypeCardsFormValues>({
    defaultValues: { type_cards_html: initialHtml ?? "" },
  });

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await categoryDetails(categoryId);
        const data = res?.data ?? res;
        const html = data?.type_cards_html ?? "";
        setCategoryMeta({
          name: data?.name ?? "",
          slug: data?.slug ?? "",
        });
        reset({ type_cards_html: html });
      } catch (e: unknown) {
        console.error("Failed to load type cards:", e);
        const apiError = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        // Fall back to prop if category fetch fails
        reset({ type_cards_html: initialHtml ?? "" });
        const msg =
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Failed to load type cards";
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchContent();
  }, [categoryId, initialHtml, reset]);

  const onSave = async (values: TypeCardsFormValues) => {
    if (!categoryMeta?.name || !categoryMeta?.slug) {
      showSnackbar("Category name/slug missing. Cannot save type cards.", "error");
      return;
    }

    setSaving(true);
    try {
      const html = values.type_cards_html ?? "";
      const formDataObj = new FormData();
      formDataObj.append("name", categoryMeta.name);
      formDataObj.append("slug", categoryMeta.slug);
      // Always send (including "") so clear works
      formDataObj.append("type_cards_html", html);

      const res = await updateCategory(categoryId, formDataObj);
      const savedHtml =
        res?.data?.type_cards_html ?? res?.type_cards_html ?? html;
      reset({ type_cards_html: savedHtml });
      onSaved?.(savedHtml);
      showSnackbar(res?.message || "Type cards saved", "success");
    } catch (e: unknown) {
      console.error("Failed to save type cards:", e);
      const apiError = e as {
        response?: { data?: { message?: string; errors?: { msg?: string }[] } };
        message?: string;
        errors?: { msg?: string }[];
      };
      const msg =
        apiError?.response?.data?.errors?.[0]?.msg ||
        apiError?.errors?.[0]?.msg ||
        apiError?.response?.data?.message ||
        apiError?.message ||
        "Failed to save type cards";
      showSnackbar(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FuseLoading />;

  return (
    <Box>
      {loadError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Type cards HTML for the storefront grid (separate from Related Categories
        links). Use <strong>Templates → Category Cards (4-col)</strong>, then
        replace images, text, and shop links. Clear the editor and save to remove
        the section.
      </Typography>

      <form onSubmit={handleSubmit(onSave)} noValidate>
        <FormCKEditor
          name="type_cards_html"
          control={control}
          label="Type Cards Content"
          includeCategoryCardsTemplate
        />
        <Box sx={{ mt: 3 }}>
          <AppButton
            label="Save Type Cards"
            type="submit"
            loading={saving}
            fullWidth
            size="large"
          />
        </Box>
      </form>
    </Box>
  );
}
