"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box } from "@mui/material";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import RelatedCategoriesSelector from "@/app/(control-panel)/apps/product-category/components/RelatedCategoriesSelector";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getBrandRelatedBrands,
  saveBrandRelatedBrands,
  type RelatedLink,
} from "@/services/apiProductBrand";
import {
  cleanRelatedLinks,
  extractRelatedLinksApiErrors,
  getRelatedLinksValidationErrors,
  hasRelatedLinksErrors,
} from "@/app/(control-panel)/apps/product-category/components/relatedLinks.utils";

export default function RelatedBrandsTab({ brandId }: { brandId: number }) {
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
        const res = await getBrandRelatedBrands(brandId);
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

    if (brandId) fetchRelated();
  }, [brandId]);

  const onSave = async () => {
    setAttemptedSave(true);

    const filledLinks = relatedLinks.filter(
      (l) => (l.text ?? "").trim() || (l.url ?? "").trim()
    );
    const rowErrors = getRelatedLinksValidationErrors(filledLinks);

    if (rowErrors.length > 0) {
      setValidationErrors(rowErrors);
      return;
    }

    const cleanedLinks = cleanRelatedLinks(relatedLinks);
    setValidationErrors([]);
    setSaving(true);
    try {
      const res = await saveBrandRelatedBrands(brandId, cleanedLinks);
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
        label="Related Brands"
        links={relatedLinks}
        onLinksChange={(nextLinks) => {
          setRelatedLinks(nextLinks);
          if (validationErrors.length > 0) {
            setValidationErrors([]);
          }
        }}
        validationErrors={validationErrors}
        showRowErrors={attemptedSave}
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
