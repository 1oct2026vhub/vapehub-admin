"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import RelatedCategoriesSelector from "./RelatedCategoriesSelector";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getCategoryRelatedCategories,
  saveCategoryRelatedCategories,
} from "@/services/apiProductCategory";

export default function RelatedCategoriesTab({
  categoryId,
  maxCount = 3,
}: {
  categoryId: number;
  maxCount?: number;
}) {
  const { showSnackbar } = useSnackbar();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanedSelectedIds = useMemo(() => {
    return Array.from(new Set(selectedIds))
      .filter((id) => id !== categoryId)
      .slice(0, maxCount);
  }, [selectedIds, categoryId, maxCount]);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCategoryRelatedCategories(categoryId);
        const ids = res?.data?.related_category_ids ?? [];
        setSelectedIds(ids);
      } catch (e: any) {
        console.error("Failed to load related categories:", e);
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load related categories";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchRelated();
  }, [categoryId]);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await saveCategoryRelatedCategories(
        categoryId,
        cleanedSelectedIds
      );
      showSnackbar(res?.message || "Related categories saved", "success");
    } catch (e: any) {
      console.error("Failed to save related categories:", e);
      const msg =
        e?.response?.data?.errors?.[0]?.msg ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to save related categories";
      showSnackbar(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FuseLoading />;

  return (
    <Box>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <RelatedCategoriesSelector
        currentCategoryId={categoryId}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        maxCount={maxCount}
      />

      <Box sx={{ mt: 3 }}>
        <AppButton
          label="Save Related Categories"
          type="button"
          loading={saving}
          onClick={onSave}
          fullWidth
          size="large"
        />
      </Box>
    </Box>
  );
}

