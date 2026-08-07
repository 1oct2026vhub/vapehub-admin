"use client";

import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { ensureAdditionalTextCardsStorefrontStyles } from "@/components/Shared/ckEditorAdditionalTextCardsTemplate";

type AdditionalTextBoxFormValues = {
  additional_text_box: string;
};

/**
 * Create-flow editor for `additional_text_box`.
 * Value is sent on category/brand POST as additional_text_box.
 */
export default function AdditionalTextBoxEditor({
  content,
  onContentChange,
}: {
  content: string;
  onContentChange: (html: string) => void;
}) {
  const { control, watch } = useForm<AdditionalTextBoxFormValues>({
    defaultValues: {
      additional_text_box: ensureAdditionalTextCardsStorefrontStyles(
        content || ""
      ),
    },
  });

  useEffect(() => {
    const subscription = watch((values) => {
      onContentChange(
        ensureAdditionalTextCardsStorefrontStyles(
          values.additional_text_box ?? ""
        )
      );
    });
    return () => subscription.unsubscribe();
  }, [watch, onContentChange]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Additional Text Box
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Optional rich HTML (stored as <code>additional_text_box</code>). Open{" "}
        <strong>Templates</strong> →{" "}
        <strong>Nicotine Strength Cards (4-col)</strong> or{" "}
        <strong>Flavour Category Cards (6-col)</strong> to insert storefront
        card blocks (same pattern as Related Collections). Select the{" "}
        <strong>No image</strong> placeholder → toolbar{" "}
        <strong>Edit image</strong>. Card images must be exactly{" "}
        <strong>250 × 250 px</strong>, max 5MB. Edit text and shop links as
        needed.
      </Typography>
      <FormCKEditor
        name="additional_text_box"
        control={control}
        label="Additional text box"
        defaultValue={ensureAdditionalTextCardsStorefrontStyles(content || "")}
        includeAdditionalTextCardsTemplates
      />
    </Box>
  );
}
