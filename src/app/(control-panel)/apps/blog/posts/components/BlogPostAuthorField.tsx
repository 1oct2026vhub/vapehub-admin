"use client";

import { useEffect, useState } from "react";
import { Autocomplete, Box, Link, TextField, Typography } from "@mui/material";
import NextLink from "next/link";
import { Control, Controller } from "react-hook-form";
import {
  BlogAuthor,
  getBlogAuthorDisplayName,
  getBlogAuthors,
} from "@/services/apiBlog";
import { commonFieldStyles, type BlogPostFormType } from "./blogPostFormShared";

interface BlogPostAuthorFieldProps {
  control: Control<BlogPostFormType>;
}

export default function BlogPostAuthorField({ control }: BlogPostAuthorFieldProps) {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthors = async () => {
      try {
        const response = await getBlogAuthors({ limit: 200 });
        setAuthors(response);
      } catch (error) {
        console.error("Failed to load authors:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthors();
  }, []);

  return (
    <Box>
      <Controller
        name="author_id"
        control={control}
        render={({ field, fieldState }) => {
          const selected = authors.find((author) => author.id === field.value) || null;

          return (
            <Autocomplete
              options={authors}
              loading={loading}
              value={selected}
              onChange={(_, value) => field.onChange(value?.id ?? undefined)}
              getOptionLabel={(option) =>
                getBlogAuthorDisplayName(option) || `Author ${option.id}`
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">
                      {getBlogAuthorDisplayName(option) || `Author ${option.id}`}
                    </Typography>
                    {option.role && (
                      <Typography variant="caption" color="text.secondary">
                        {option.role}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Author"
                  required
                  error={Boolean(fieldState.error)}
                  helperText={
                    fieldState.error?.message ||
                    "Required. Bylines come from the Authors table, not per-post text."
                  }
                  sx={commonFieldStyles}
                />
              )}
            />
          );
        }}
      />
      <Link
        component={NextLink}
        href="/apps/blog/author"
        underline="hover"
        sx={{ display: "inline-block", mt: 1, color: "#247c5c" }}
      >
        Manage authors
      </Link>
    </Box>
  );
}
