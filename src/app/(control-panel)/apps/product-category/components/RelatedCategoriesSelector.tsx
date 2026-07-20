"use client";

import { useMemo } from "react";
import {
  Alert,
  Box,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AppButton from "@/components/Shared/AppButton";
import type { RelatedLink } from "@/services/apiProductCategory";
import {
  EMPTY_RELATED_LINK,
  getLiveRelatedLinkUrlError,
  getRelatedLinkRowErrors,
} from "./relatedLinks.utils";

export default function RelatedCategoriesSelector({
  links,
  onLinksChange,
  validationErrors = [],
  showRowErrors = false,
  label = "Related Links",
}: {
  links: RelatedLink[];
  onLinksChange: (links: RelatedLink[]) => void;
  validationErrors?: string[];
  /** When true, also show missing text/URL errors (after save attempt). */
  showRowErrors?: boolean;
  label?: string;
}) {
  const displayLinks = useMemo(() => {
    return links.length > 0 ? links : [{ ...EMPTY_RELATED_LINK }];
  }, [links]);

  const updateLink = (
    index: number,
    field: keyof RelatedLink,
    value: string
  ) => {
    const next = displayLinks.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    onLinksChange(next);
  };

  const addLink = () => {
    onLinksChange([...displayLinks, { ...EMPTY_RELATED_LINK }]);
  };

  const removeLink = (index: number) => {
    onLinksChange(displayLinks.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add related links. Each row needs a label (text) and a URL (absolute
        URL, path like /disposable-vapes, or slug like disposable-vapes).
      </Typography>

      {validationErrors.length > 0 ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationErrors.map((message) => (
            <Typography key={message} variant="body2">
              {message}
            </Typography>
          ))}
        </Alert>
      ) : null}

      {displayLinks.map((link, index) => {
        const rowErrors = showRowErrors ? getRelatedLinkRowErrors(link) : {};
        const liveUrlError = getLiveRelatedLinkUrlError(link.url);
        const urlError = rowErrors.url || liveUrlError;
        const textError = rowErrors.text;

        return (
          <Paper
            key={`related-link-${index}`}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "#ffffff",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <TextField
                  label={`Link ${index + 1} text`}
                  value={link.text}
                  onChange={(event) =>
                    updateLink(index, "text", event.target.value)
                  }
                  placeholder="e.g. Disposable Vapes"
                  fullWidth
                  size="small"
                  error={Boolean(textError)}
                  helperText={textError}
                />
                <TextField
                  label={`Link ${index + 1} URL`}
                  value={link.url}
                  onChange={(event) =>
                    updateLink(index, "url", event.target.value)
                  }
                  placeholder="e.g. /disposable-vapes or https://example.com/page"
                  fullWidth
                  size="small"
                  error={Boolean(urlError)}
                  helperText={
                    urlError ||
                    "Accepted: https://..., /path, or slug (disposable-vapes)"
                  }
                />
              </Box>
              {displayLinks.length > 1 ? (
                <IconButton
                  onClick={() => removeLink(index)}
                  color="error"
                  aria-label={`Remove link ${index + 1}`}
                  sx={{ mt: 0.5 }}
                >
                  <DeleteIcon />
                </IconButton>
              ) : null}
            </Box>
          </Paper>
        );
      })}

      <AppButton
        label="Add link"
        type="button"
        onClick={addLink}
        startIcon={<AddIcon />}
        disableGradient
        size="medium"
      />
    </Box>
  );
}
