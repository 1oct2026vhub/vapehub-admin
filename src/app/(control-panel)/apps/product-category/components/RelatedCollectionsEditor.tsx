"use client";

import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import FormCKEditor from "@/components/Shared/FormCKEditor";

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
    defaultValues: { type_cards_html: content || "" },
  });

  useEffect(() => {
    const subscription = watch((values) => {
      onContentChange(values.type_cards_html ?? "");
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
        then replace images, text, and shop links. Separate from Related Categories
        links.
      </Typography>
      <FormCKEditor
        name="type_cards_html"
        control={control}
        label="Type Cards Content"
        defaultValue={content || ""}
        includeCategoryCardsTemplate
      />
    </Box>
  );
}
