"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { Control, useFieldArray, useFormState, type UseFormTrigger } from "react-hook-form";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import FormInputField from "@/components/Shared/FormInputField";
import {
  commonFieldStyles,
  DEFAULT_FIRST_PERSON_CALLOUT_LABEL,
  defaultFirstPersonCalloutItem,
  type BlogPostFormType,
} from "./blogPostFormShared";
import BlogPlaceholderInsertButton from "./BlogPlaceholderInsertButton";
import { BLOG_PLACEHOLDER_TOKENS } from "./blogPlaceholders";

interface BlogPostFirstPersonCalloutFieldsProps {
  control: Control<BlogPostFormType>;
  trigger?: UseFormTrigger<BlogPostFormType>;
}

export default function BlogPostFirstPersonCalloutFields({
  control,
  trigger,
}: BlogPostFirstPersonCalloutFieldsProps) {
  const { errors } = useFormState({ control });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "first_person_callouts",
  });

  const calloutErrors = errors.first_person_callouts;
  const contentError =
    typeof errors.content?.message === "string" ? errors.content.message : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {contentError ? (
        <Alert severity="warning">
          Article content: {contentError}
        </Alert>
      ) : null}
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          First-person callout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Optional. Configure each callout here. Add{" "}
          {BLOG_PLACEHOLDER_TOKENS.firstPersonCallout(1)} in the article content to choose
          placement, or leave it out and the callout will be appended when you save.
          Maximum 2 callouts per article.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <BlogPlaceholderInsertButton
          token={BLOG_PLACEHOLDER_TOKENS.firstPersonCallout(1)}
          label="First callout placeholder"
          description="Copy and paste into the Content editor where callout 1 should appear."
        />
        <BlogPlaceholderInsertButton
          token={BLOG_PLACEHOLDER_TOKENS.firstPersonCallout(2)}
          label="Second callout placeholder"
          description="Copy and paste into the Content editor where callout 2 should appear."
        />
      </Box>

      {fields.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No callouts added. Use the button below to add one.
        </Typography>
      ) : (
        fields.map((field, index) => (
          <Box key={field.id}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                Callout {index + 1}
              </Typography>
              <IconButton
                aria-label={`Remove callout ${index + 1}`}
                onClick={() => remove(index)}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormInputField
                  name={`first_person_callouts.${index}.label`}
                  control={control}
                  label="Label"
                  helperText={`Optional. Defaults to "${DEFAULT_FIRST_PERSON_CALLOUT_LABEL}" on the storefront.`}
                  sx={commonFieldStyles}
                />
              </Grid>

              <Grid item xs={12}>
                <FormInputField
                  name={`first_person_callouts.${index}.heading`}
                  control={control}
                  label="Heading"
                  required
                  helperText='Dynamic heading shown in the callout (e.g. "We rotate stock by batch code — here&apos;s what ages fastest.").'
                  sx={commonFieldStyles}
                />
                {calloutErrors?.[index]?.heading && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                    {calloutErrors[index]?.heading?.message}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <FormCKEditor
                  name={`first_person_callouts.${index}.body`}
                  control={control}
                  label="Body copy"
                  required
                  trigger={trigger}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Rich-text body for the anecdote (max 2,000 characters of visible text).
                </Typography>
              </Grid>
            </Grid>

            {index < fields.length - 1 && <Divider sx={{ mt: 3 }} />}
          </Box>
        ))
      )}

      {typeof calloutErrors?.message === "string" && (
        <Typography variant="caption" color="error">
          {calloutErrors.message}
        </Typography>
      )}

      <Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => append({ ...defaultFirstPersonCalloutItem })}
          disabled={fields.length >= 2}
        >
          Add callout
        </Button>
      </Box>
    </Box>
  );
}
