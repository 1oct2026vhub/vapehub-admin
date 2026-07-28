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
import {
  brandDetails,
  updateBrand,
} from "@/services/apiProductBrand";

type TypeCardsFormValues = {
  type_cards_html: string;
};

type EntityType = "category" | "brand";

/**
 * Type cards (CKEditor HTML) — stored as `type_cards_html`.
 * Separate from related_links / Related Categories|Brands.
 */
export default function RelatedCollectionsTab({
  entityType = "category",
  categoryId,
  brandId,
  initialHtml,
  onSaved,
}: {
  entityType?: EntityType;
  categoryId?: number;
  brandId?: number;
  /** Prefer from GET /api/admin/{entity}/:id */
  initialHtml?: string | null;
  onSaved?: (html: string) => void;
}) {
  const entityId = entityType === "brand" ? brandId : categoryId;
  const relatedLinksLabel =
    entityType === "brand" ? "Related Brands" : "Related Categories";
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entityMeta, setEntityMeta] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  const { control, handleSubmit, reset } = useForm<TypeCardsFormValues>({
    defaultValues: { type_cards_html: initialHtml ?? "" },
  });

  useEffect(() => {
    const fetchContent = async () => {
      if (!entityId) return;
      setLoading(true);
      setLoadError(null);
      try {
        const res =
          entityType === "brand"
            ? await brandDetails(entityId)
            : await categoryDetails(entityId);
        const data = res?.data ?? res;
        const html = data?.type_cards_html ?? "";
        setEntityMeta({
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

    fetchContent();
  }, [entityId, entityType, initialHtml, reset]);

  const onSave = async (values: TypeCardsFormValues) => {
    if (!entityId) {
      showSnackbar(
        `${entityType === "brand" ? "Brand" : "Category"} ID missing. Cannot save type cards.`,
        "error"
      );
      return;
    }
    if (!entityMeta?.name || !entityMeta?.slug) {
      showSnackbar(
        `${entityType === "brand" ? "Brand" : "Category"} name/slug missing. Cannot save type cards.`,
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      const html = values.type_cards_html ?? "";
      const formDataObj = new FormData();
      formDataObj.append("name", entityMeta.name);
      formDataObj.append("slug", entityMeta.slug);
      // Always send (including "") so clear works
      formDataObj.append("type_cards_html", html);

      const res =
        entityType === "brand"
          ? await updateBrand(entityId, formDataObj)
          : await updateCategory(entityId, formDataObj);
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
        Type cards HTML for the storefront grid (separate from {relatedLinksLabel}{" "}
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
