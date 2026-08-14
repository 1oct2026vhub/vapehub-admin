"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { ensureAdditionalTextCardsStorefrontStyles } from "@/components/Shared/ckEditorAdditionalTextCardsTemplate";
import { prepareTypeCardsHtmlForSave } from "@/components/Shared/typeCardImageEncode";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  categoryDetails,
  updateCategory,
} from "@/services/apiProductCategory";
import {
  brandDetails,
  updateBrand,
} from "@/services/apiProductBrand";

type AdditionalTextBoxFormValues = {
  additional_text_box: string;
};

type EntityType = "category" | "brand";

/** Bust browser cache for http(s) images after S3 overwrite (same URL, new bytes). */
function bustImageCache(html: string): string {
  const v = Date.now();
  return html.replace(
    /(<img\b[^>]*?\bsrc=["'])(https?:\/\/[^"']+)(["'])/gi,
    (_m, pre: string, src: string, post: string) => {
      try {
        const url = new URL(src);
        url.searchParams.set("_atb", String(v));
        return `${pre}${url.toString()}${post}`;
      } catch {
        const sep = src.includes("?") ? "&" : "?";
        return `${pre}${src}${sep}_atb=${v}${post}`;
      }
    }
  );
}

/** Remove display-only cache busters before persisting. */
function stripImageCacheBusters(html: string): string {
  return html.replace(
    /(<img\b[^>]*?\bsrc=["'])([^"']+)(["'])/gi,
    (_m, pre: string, src: string, post: string) => {
      try {
        if (!/^https?:\/\//i.test(src)) return `${pre}${src}${post}`;
        const url = new URL(src);
        url.searchParams.delete("_atb");
        return `${pre}${url.toString()}${post}`;
      } catch {
        const cleaned = src
          .replace(/([?&])_atb=\d+/g, "")
          .replace(/\?$/, "")
          .replace(/&&+/g, "&");
        return `${pre}${cleaned}${post}`;
      }
    }
  );
}

/**
 * Additional text box (CKEditor HTML) — stored as `additional_text_box`.
 * Independent of description / type_cards_html. Supports tables and CSS grids.
 */
export default function AdditionalTextBoxTab({
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
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entityMeta, setEntityMeta] = useState<{
    name: string;
    slug: string;
  } | null>(null);
  const editorInstanceRef = useRef<{ getData: () => string } | null>(null);
  const [editorMountKey, setEditorMountKey] = useState(0);

  const { control, handleSubmit, reset } = useForm<AdditionalTextBoxFormValues>({
    defaultValues: {
      additional_text_box: ensureAdditionalTextCardsStorefrontStyles(
        initialHtml ?? ""
      ),
    },
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
        const html = data?.additional_text_box ?? "";
        setEntityMeta({
          name: data?.name ?? "",
          slug: data?.slug ?? "",
        });
        reset({
          additional_text_box: bustImageCache(
            ensureAdditionalTextCardsStorefrontStyles(html)
          ),
        });
        setEditorMountKey((k) => k + 1);
      } catch (e: unknown) {
        console.error("Failed to load additional text box:", e);
        const apiError = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        reset({
          additional_text_box: ensureAdditionalTextCardsStorefrontStyles(
            initialHtml ?? ""
          ),
        });
        const msg =
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Failed to load additional text box";
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [entityId, entityType, initialHtml, reset]);

  const onSave = async (values: AdditionalTextBoxFormValues) => {
    if (!entityId) {
      showSnackbar(
        `${entityType === "brand" ? "Brand" : "Category"} ID missing. Cannot save additional text box.`,
        "error"
      );
      return;
    }
    if (!entityMeta?.name || !entityMeta?.slug) {
      showSnackbar(
        `${entityType === "brand" ? "Brand" : "Category"} name/slug missing. Cannot save additional text box.`,
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      // Prefer live editor HTML — RHF can lag behind image uploads (debounced onChange)
      let html = values.additional_text_box ?? "";
      try {
        const live = editorInstanceRef.current?.getData?.();
        if (typeof live === "string") html = live;
      } catch {
        /* keep form value */
      }
      html = ensureAdditionalTextCardsStorefrontStyles(
        await prepareTypeCardsHtmlForSave(stripImageCacheBusters(html))
      );

      const formDataObj = new FormData();
      formDataObj.append("name", entityMeta.name);
      formDataObj.append("slug", entityMeta.slug);
      // Always send (including "") so clear works — backend treats "" as null
      formDataObj.append("additional_text_box", html);

      const res =
        entityType === "brand"
          ? await updateBrand(entityId, formDataObj)
          : await updateCategory(entityId, formDataObj);
      const savedHtml =
        res?.data?.additional_text_box ?? res?.additional_text_box ?? html;
      const displayHtml = bustImageCache(
        ensureAdditionalTextCardsStorefrontStyles(savedHtml ?? "")
      );
      reset({ additional_text_box: displayHtml });
      setEditorMountKey((k) => k + 1);
      onSaved?.(savedHtml ?? "");
      showSnackbar(res?.message || "Additional text box saved", "success");
    } catch (e: unknown) {
      console.error("Failed to save additional text box:", e);
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
        "Failed to save additional text box";
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
        Optional rich HTML for the storefront. Separate from Description and
        Related Collections. Open <strong>Templates</strong> →{" "}
        <strong>Nicotine Strength Cards (4-col)</strong> or{" "}
        <strong>Flavour Category Cards (6-col)</strong> to insert card blocks.
        Select the <strong>No image</strong> placeholder → toolbar{" "}
        <strong>Edit image</strong>. Card images must be exactly{" "}
        <strong>250 × 250 px</strong>, max 5MB. Edit copy and shop links as
        needed. Also supports <strong>Insert table</strong> /{" "}
        <strong>Insert table layout</strong>. Large pasted images upload to S3
        on save. Clear the editor and save to remove the section.
      </Typography>

      <form onSubmit={handleSubmit(onSave)} noValidate>
        <FormCKEditor
          key={editorMountKey}
          name="additional_text_box"
          control={control}
          label="Additional text box"
          includeAdditionalTextCardsTemplates
          onEditorReady={(editor) => {
            editorInstanceRef.current = editor as { getData: () => string };
          }}
        />
        <Box sx={{ mt: 3 }}>
          <AppButton
            label="Save Additional Text Box"
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
