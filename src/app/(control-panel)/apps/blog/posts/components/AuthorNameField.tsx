"use client";

import { useEffect, useRef } from "react";
import { TextField } from "@mui/material";
import {
  Control,
  Controller,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { getUser } from "@/utils/auth";
import {
  commonFieldStyles,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface AuthorNameFieldProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
  /** Edit flow: name already resolved from author / author_override. */
  disableDefaults?: boolean;
}

function formatAuthorDisplayName(
  override: BlogPostFormType["author_override"] | undefined,
): string {
  return [override?.first_name, override?.last_name]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
}

function getLoggedInAdminDefaults(): {
  id: number | null;
  firstName: string;
  lastName: string;
  displayName: string;
} {
  const user = getUser();
  if (!user) {
    return { id: null, firstName: "", lastName: "", displayName: "" };
  }

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    user.displayName ||
    user.email ||
    "";

  const rawId = user.id ?? user.user_id;
  const id =
    rawId !== undefined && rawId !== null && rawId !== ""
      ? Number(rawId)
      : null;

  return {
    id: Number.isFinite(id) ? id : null,
    firstName,
    lastName,
    displayName,
  };
}

export default function AuthorNameField({
  control,
  setValue,
  disableDefaults = false,
}: AuthorNameFieldProps) {
  const authorOverride = useWatch({ control, name: "author_override" });
  const authorId = useWatch({ control, name: "author_id" });
  const defaultsApplied = useRef(false);

  useEffect(() => {
    if (disableDefaults || defaultsApplied.current) {
      return;
    }

    const hasName = Boolean(
      authorOverride?.first_name?.trim() || authorOverride?.last_name?.trim(),
    );
    if (hasName && authorId) {
      defaultsApplied.current = true;
      return;
    }

    const { id, firstName, lastName, displayName } = getLoggedInAdminDefaults();
    if (!displayName && !id) {
      return;
    }

    defaultsApplied.current = true;

    if (!hasName && displayName) {
      if (firstName || lastName) {
        setValue("author_override.first_name", firstName, {
          shouldDirty: false,
        });
        setValue("author_override.last_name", lastName, { shouldDirty: false });
      } else {
        setValue("author_override.first_name", displayName, {
          shouldDirty: false,
        });
        setValue("author_override.last_name", "", { shouldDirty: false });
      }
    }

    if (!authorId && id) {
      setValue("author_id", id, { shouldDirty: false });
    }
  }, [authorId, authorOverride, setValue, disableDefaults]);

  return (
    <Controller
      name="author_override"
      control={control}
      render={({ field: { value, onChange } }) => (
        <TextField
          label="Author"
          variant="outlined"
          fullWidth
          value={formatAuthorDisplayName(value)}
          onChange={(event) => {
            // Keep the full free-text name editable as a single string.
            onChange({
              ...(value || {}),
              first_name: event.target.value,
              last_name: "",
            });
          }}
          helperText="Shown in the author byline. Defaults to the logged-in admin; edit freely to use any name."
          sx={commonFieldStyles}
        />
      )}
    />
  );
}
