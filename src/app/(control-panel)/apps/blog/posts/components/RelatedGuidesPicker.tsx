"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { Control, Controller, useWatch } from "react-hook-form";
import debounce from "lodash/debounce";
import { getBlogPosts, type BlogPost } from "@/services/apiBlog";
import { commonFieldStyles, type BlogPostFormType } from "./blogPostFormShared";

interface RelatedGuidesPickerProps {
  control: Control<BlogPostFormType>;
  currentPostId?: number;
}

export default function RelatedGuidesPicker({
  control,
  currentPostId,
}: RelatedGuidesPickerProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const selectedPosts = useWatch({ control, name: "related_posts" }) || [];

  const mergedOptions = useMemo(() => {
    const byId = new Map<number, BlogPost>();
    posts.forEach((post) => byId.set(post.id, post));
    selectedPosts.forEach((selected) => {
      if (!byId.has(selected.id)) {
        byId.set(selected.id, {
          id: selected.id,
          title: selected.title,
          content: "",
          slug: "",
          is_active: true,
        });
      }
    });
    return Array.from(byId.values());
  }, [posts, selectedPosts]);

  const fetchPosts = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        try {
          const response = await getBlogPosts({
            search: searchTerm,
            limit: 50,
            is_active: true,
          });
          const blogs = response?.data?.blogs || [];
          setPosts(
            currentPostId
              ? blogs.filter((post) => post.id !== currentPostId)
              : blogs,
          );
        } catch (error) {
          console.error("Failed to fetch related posts:", error);
        }
      }, 300),
    [currentPostId],
  );

  useEffect(() => {
    fetchPosts(search);
  }, [search, fetchPosts]);

  useEffect(() => {
    fetchPosts("");
  }, [fetchPosts]);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        Related guides
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Pick up to 3 related Geek Zone articles. Sent as related_blog_ids in
        display order (comma-separated). Leave empty to auto-pick from the same
        category.
      </Typography>

      <Controller
        name="related_posts"
        control={control}
        render={({ field: { value, onChange } }) => (
          <Autocomplete
            multiple
            options={mergedOptions}
            getOptionLabel={(option) => option.title}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            value={value}
            onChange={(_, newValue) => {
              if (newValue.length > 3) return;
              onChange(
                newValue.map((post) => ({ id: post.id, title: post.title })),
              );
            }}
            onInputChange={(_, newInputValue) => setSearch(newInputValue)}
            filterSelectedOptions
            limitTags={3}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Related guides (max 3)"
                variant="outlined"
                sx={commonFieldStyles}
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  label={option.title}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        )}
      />
    </Box>
  );
}
