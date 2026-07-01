"use client";

import { useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { Control, Controller } from "react-hook-form";
import debounce from "lodash/debounce";
import { useRoles } from "@/hooks/roleFetch";
import { fetchSuperAdminAuthorOptions } from "./blogAuthorUsers";
import {
  commonFieldStyles,
  type BlogAuthorOption,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface AuthorSelectFieldProps {
  control: Control<BlogPostFormType>;
  initialAuthor?: BlogAuthorOption | null;
}

export default function AuthorSelectField({
  control,
  initialAuthor,
}: AuthorSelectFieldProps) {
  const { roles } = useRoles();
  const superAdminRoleId = useMemo(
    () => roles?.find((role) => role.role === "super_admin")?.id,
    [roles],
  );

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

  const fetchAuthors = useMemo(
    () =>
      debounce(async (searchTerm: string, roleId?: number) => {
        try {
          const fetched = await fetchSuperAdminAuthorOptions(searchTerm, roleId);
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
    fetchAuthors(authorSearch, superAdminRoleId);
  }, [authorSearch, superAdminRoleId, fetchAuthors]);

  useEffect(() => {
    if (superAdminRoleId) {
      fetchAuthors("", superAdminRoleId);
    }
  }, [superAdminRoleId, fetchAuthors]);

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
          onInputChange={(_, newInputValue) => setAuthorSearch(newInputValue)}
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
