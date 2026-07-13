"use client";

import { Box, Button, Divider, Grid, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Control,
  UseFormSetValue,
  useFieldArray,
} from "react-hook-form";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import AuthorBioBlock from "./AuthorBioBlock";
import AuthorNameField from "./AuthorNameField";
import {
  commonFieldStyles,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface BlogPostEeatSectionsProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
  defaultAvatarUrl?: string;
  /** Edit flow: author fields already resolved from author / author_override. */
  skipAuthorProfileLoad?: boolean;
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

export default function BlogPostEeatSections({
  control,
  setValue,
  defaultAvatarUrl,
  skipAuthorProfileLoad = false,
}: BlogPostEeatSectionsProps) {
  const {
    fields: sourceFields,
    append: appendSource,
    remove: removeSource,
  } = useFieldArray({ control, name: "sources" });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <SectionHeading
          title="Author byline"
          description="Powers the author line below the post title. Defaults to the logged-in admin; you can edit the name freely."
        />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <AuthorNameField
              control={control}
              setValue={setValue}
              disableDefaults={skipAuthorProfileLoad}
            />
          </Grid>
          <Grid item xs={12}>
            <FormInputField
              name="author_override.role"
              control={control}
              label="Author role"
              helperText='Shown under the name in the byline, e.g. "VapeHub product team"'
              sx={commonFieldStyles}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      <Box>
        <SectionHeading
          title="Sources & citations"
          description='Sent as the "sources" field — each entry has label, href, and optional description.'
        />
        {sourceFields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              border: "1px solid #e0e0e0",
              p: 2,
              mb: 2,
              position: "relative",
            }}
          >
            <IconButton
              size="small"
              onClick={() => removeSource(index)}
              sx={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Remove source"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormInputField
                  name={`sources.${index}.label`}
                  control={control}
                  label="Label"
                  helperText="e.g. Medicines and Healthcare products Regulatory Agency (MHRA)"
                  sx={commonFieldStyles}
                />
              </Grid>
              <Grid item xs={12}>
                <FormInputField
                  name={`sources.${index}.href`}
                  control={control}
                  label="URL (href)"
                  sx={commonFieldStyles}
                />
              </Grid>
              <Grid item xs={12}>
                <FormTextareaField
                  name={`sources.${index}.description`}
                  control={control}
                  label="Description (optional)"
                  rows={2}
                  placeholder="e-cigarette product notification scheme & manufacturer guidance"
                />
              </Grid>
            </Grid>
          </Box>
        ))}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => appendSource({ label: "", href: "", description: "" })}
          sx={{ textTransform: "none", borderColor: "#2E9970", color: "#247c5c" }}
        >
          Add source
        </Button>
      </Box>

      <Divider />

      <AuthorBioBlock
        control={control}
        setValue={setValue}
        defaultAvatarUrl={defaultAvatarUrl}
        skipAuthorProfileLoad={skipAuthorProfileLoad}
      />
    </Box>
  );
}
