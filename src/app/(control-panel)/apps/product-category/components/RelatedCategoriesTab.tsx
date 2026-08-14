"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box } from "@mui/material";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import RelatedCategoriesSelector from "./RelatedCategoriesSelector";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getCategoryRelatedCategories,
  saveCategoryRelatedCategories,
  type RelatedLink,
} from "@/services/apiProductCategory";
import {
  cleanRelatedLinks,
  EMPTY_RELATED_LINK,
  extractRelatedLinksApiErrors,
  getRelatedLinksValidationErrors,
  hasRelatedLinksErrors,
} from "./relatedLinks.utils";

export default function RelatedCategoriesTab({
  categoryId,
}: {
  categoryId: number;
}) {
  const { showSnackbar } = useSnackbar();
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [attemptedSave, setAttemptedSave] = useState(false);

  const hasErrors = useMemo(
    () => hasRelatedLinksErrors(relatedLinks),
    [relatedLinks]
  );

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await getCategoryRelatedCategories(categoryId);
        setRelatedLinks(res?.data?.related_links ?? []);
      } catch (e: unknown) {
        console.error("Failed to load related links:", e);
        const apiError = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const msg =
          apiError?.response?.data?.message ||
          apiError?.message ||
          "Failed to load related links";
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) fetchRelated();
  }, [categoryId]);

  const onSave = async () => {
    setAttemptedSave(true);

    const linksToValidate =
      relatedLinks.length > 0 ? relatedLinks : [{ ...EMPTY_RELATED_LINK }];
    const rowErrors = getRelatedLinksValidationErrors(linksToValidate, {
      requireFields: true,
    });

    if (rowErrors.length > 0) {
      setValidationErrors([]);
      return;
    }

    const cleanedLinks = cleanRelatedLinks(relatedLinks);
    setValidationErrors([]);
    setSaving(true);
    try {
      const res = await saveCategoryRelatedCategories(categoryId, cleanedLinks);
      setRelatedLinks(res?.data?.related_links ?? cleanedLinks);
      setAttemptedSave(false);
      showSnackbar(res?.message || "Related links saved", "success");
    } catch (e: unknown) {
      console.error("Failed to save related links:", e);
      const messages = extractRelatedLinksApiErrors(e);
      setValidationErrors(messages);
      showSnackbar(messages[0], "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FuseLoading />;

  return (
    <Box>
      {loadError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}

      <RelatedCategoriesSelector
        links={relatedLinks}
        onLinksChange={(nextLinks) => {
          setRelatedLinks(nextLinks);
          if (validationErrors.length > 0) {
            setValidationErrors([]);
          }
        }}
        validationErrors={validationErrors}
        showRowErrors={attemptedSave}
        requireAllFields
      />

      <Box sx={{ mt: 3 }}>
        <AppButton
          label="Save Related Links"
          type="button"
          loading={saving}
          onClick={onSave}
          disabled={hasErrors}
          fullWidth
          size="large"
        />
      </Box>
    </Box>
  );
}
