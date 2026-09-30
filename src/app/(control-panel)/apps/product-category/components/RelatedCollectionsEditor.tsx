"use client";

import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import { ensureTypeCardsStorefrontStyles } from "@/components/Shared/ckEditorCategoryCardsTemplate";

type TypeCardsFormValues = {
  type_cards_html: string;
};

/**
 * Create-flow editor for `type_cards_html` (type cards grid).
 * Value is sent on category POST as type_cards_html.
 */
export default function RelatedCollectionsEditor({
  content,
  onContentChange,
}: {
  content: string;
  onContentChange: (html: string) => void;
}) {
  const { control, watch } = useForm<TypeCardsFormValues>({
    defaultValues: {
      type_cards_html: ensureTypeCardsStorefrontStyles(content || ""),
    },
  });

  useEffect(() => {
    const subscription = watch((values) => {
      onContentChange(
        ensureTypeCardsStorefrontStyles(values.type_cards_html ?? "")
      );
    });
    return () => subscription.unsubscribe();
  }, [watch, onContentChange]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Type Cards
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Optional type-card grid HTML (stored as <code>type_cards_html</code>).
        Open <strong>Templates</strong> → <strong>Category Cards (4-col)</strong>,
        then replace images, text, and shop links. Card images must be exactly{" "}
        <strong>891 × 540 px</strong>, max 5MB (PNG, JPG, JPEG, WebP).
        Separate from related text+URL links.
      </Typography>
      <FormCKEditor
        name="type_cards_html"
        control={control}
        label="Type Cards Content"
        defaultValue={ensureTypeCardsStorefrontStyles(content || "")}
        includeCategoryCardsTemplate
      />
    </Box>
  );
}
