"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Control, Controller, useFieldArray, useFormState } from "react-hook-form";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import FormInputField from "@/components/Shared/FormInputField";
import {
  commonFieldStyles,
  DEFAULT_FIRST_PERSON_CALLOUT_LABEL,
  defaultFirstPersonCalloutItem,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface BlogPostFirstPersonCalloutFieldsProps {
  control: Control<BlogPostFormType>;
}

export default function BlogPostFirstPersonCalloutFields({
  control,
}: BlogPostFirstPersonCalloutFieldsProps) {
  const { errors } = useFormState({ control });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "first_person_callouts",
  });

  const calloutErrors = errors.first_person_callouts;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          First-person callout
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Optional. Renders inline in the article body — use when the piece benefits
          from a &quot;from the warehouse / team&quot; anecdote that adds first-hand
          experience. Maximum 2 callouts per article.
        </Typography>
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

              <Grid item xs={12} md={6}>
                <Controller
                  name={`first_person_callouts.${index}.insert_after_paragraph`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      label={
                        <>
                          Insert after paragraph <span style={{ color: "red" }}>*</span>
                        </>
                      }
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        field.onChange(
                          nextValue === "" ? 0 : Number.parseInt(nextValue, 10),
                        );
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      error={!!error}
                      helperText={
                        error?.message ||
                        "1-based paragraph index in the article body. Must be unique per callout."
                      }
                      inputProps={{ min: 1, step: 1 }}
                      sx={commonFieldStyles}
                    />
                  )}
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
                />
                {calloutErrors?.[index]?.body && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                    {calloutErrors[index]?.body?.message}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Rich-text HTML body for the anecdote (max 2,000 characters).
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
