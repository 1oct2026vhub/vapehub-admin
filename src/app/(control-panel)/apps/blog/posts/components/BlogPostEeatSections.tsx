"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Control, Controller, UseFormSetValue, useFieldArray } from "react-hook-form";
import debounce from "lodash/debounce";
import { listUser } from "@/services/apiService";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import AuthorBioBlock from "./AuthorBioBlock";
import {
  commonFieldStyles,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface BlogAuthorOption {
  id: number;
  label: string;
}

interface BlogPostEeatSectionsProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
  initialAuthor?: BlogAuthorOption | null;
  defaultAvatarUrl?: string;
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

function AuthorAutocomplete({
  control,
  authors,
  onSearch,
}: {
  control: Control<BlogPostFormType>;
  authors: BlogAuthorOption[];
  onSearch: (value: string) => void;
}) {
  return (
    <Controller
      name="author_id"
      control={control}
      render={({ field: { value, onChange } }) => (
        <Autocomplete
          options={authors}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          value={authors.find((author) => author.id === value) || null}
          onChange={(_, newValue) => onChange(newValue?.id ?? null)}
          onInputChange={(_, newInputValue) => onSearch(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Author"
              variant="outlined"
              sx={commonFieldStyles}
            />
          )}
        />
      )}
    />
  );
}

export default function BlogPostEeatSections({
  control,
  setValue,
  initialAuthor,
  defaultAvatarUrl,
}: BlogPostEeatSectionsProps) {
  const [authors, setAuthors] = useState<BlogAuthorOption[]>(
    initialAuthor ? [initialAuthor] : [],
  );
  const [authorSearch, setAuthorSearch] = useState("");

  useEffect(() => {
    if (initialAuthor) {
      setAuthors((prev) => {
        if (prev.some((author) => author.id === initialAuthor.id)) {
          return prev;
        }
        return [initialAuthor, ...prev];
      });
    }
  }, [initialAuthor]);

  const {
    fields: sourceFields,
    append: appendSource,
    remove: removeSource,
  } = useFieldArray({ control, name: "sources" });

  const fetchAuthors = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        try {
          const response = await listUser({
            search: searchTerm,
            limit: 50,
          });
          const users = response?.data?.users || response?.users || [];
          const fetched = users.map(
            (user: {
              id: number;
              first_name?: string;
              last_name?: string;
              email?: string;
            }) => ({
              id: user.id,
              label:
                [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                user.email ||
                `User #${user.id}`,
            }),
          );
          setAuthors((prev) => {
            const merged = [...prev];
            fetched.forEach((author) => {
              if (!merged.some((item) => item.id === author.id)) {
                merged.push(author);
              }
            });
            return merged;
          });
        } catch (error) {
          console.error("Failed to fetch authors:", error);
        }
      }, 300),
    [],
  );

  useEffect(() => {
    fetchAuthors(authorSearch);
  }, [authorSearch, fetchAuthors]);

  useEffect(() => {
    fetchAuthors("");
  }, [fetchAuthors]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <SectionHeading
          title="Author byline"
          description="Powers the author line below the post title. Defaults to the authenticated admin when omitted."
        />
        <AuthorAutocomplete
          control={control}
          authors={authors}
          onSearch={setAuthorSearch}
        />
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
      />
    </Box>
  );
}
