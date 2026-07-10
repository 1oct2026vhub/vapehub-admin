"use client";

import { Alert, AlertTitle, Box, List, ListItem, ListItemText } from "@mui/material";
import { Control, FieldErrors, useFormState } from "react-hook-form";
import type { BlogPostFormType } from "./blogPostFormShared";

function collectErrorMessages(
  errors: FieldErrors<BlogPostFormType>,
): string[] {
  const messages: string[] = [];

  for (const value of Object.values(errors)) {
    if (!value) continue;

    if (typeof value === "object" && "message" in value && value.message) {
      messages.push(String(value.message));
      continue;
    }

    if (typeof value === "object") {
      messages.push(...collectErrorMessages(value as FieldErrors<BlogPostFormType>));
    }
  }

  return [...new Set(messages)];
}

interface BlogPostFormValidationAlertProps {
  control: Control<BlogPostFormType>;
}

export default function BlogPostFormValidationAlert({
  control,
}: BlogPostFormValidationAlertProps) {
  const { errors, isValid } = useFormState({ control });
  const messages = collectErrorMessages(errors);

  if (isValid || messages.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity="error" variant="outlined">
        <AlertTitle>Complete the following before saving</AlertTitle>
        <List dense disablePadding sx={{ listStyleType: "disc", pl: 2 }}>
          {messages.map((message) => (
            <ListItem key={message} disablePadding sx={{ display: "list-item", py: 0.25 }}>
              <ListItemText primary={message} primaryTypographyProps={{ variant: "body2" }} />
            </ListItem>
          ))}
        </List>
      </Alert>
    </Box>
  );
}
