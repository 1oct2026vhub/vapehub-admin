"use client";

import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Grid,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  Control,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { getUserDetail } from "@/services/apiService";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import FormAvatarUploadField from "@/components/Shared/FormAvatarUploadField";
import {
  commonFieldStyles,
  defaultAuthorOverride,
  getAuthorDisplayName,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface AuthorBioBlockProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
  defaultAvatarUrl?: string;
}

type AuthorUserFields = {
  first_name?: string;
  last_name?: string;
  profile_pic_url?: string;
  blog_author_role?: string;
  blog_author_bio?: string;
  blog_author_archive_url?: string;
  blog_author_team_url?: string;
};

function parseUserDetailResponse(response: unknown): AuthorUserFields | null {
  const dataObj =
    (response as { data?: AuthorUserFields & { user?: AuthorUserFields } })
      ?.data ?? response;
  const user =
    (dataObj as { user?: AuthorUserFields })?.user ??
    (dataObj as AuthorUserFields);
  if (!user || typeof user !== "object") {
    return null;
  }
  return user;
}

function mapUserToAuthorOverride(
  user: AuthorUserFields,
): BlogPostFormType["author_override"] {
  return {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    avatar_url: user.profile_pic_url || "",
    role: user.blog_author_role || "",
    bio: user.blog_author_bio || "",
    archive_url: user.blog_author_archive_url || "",
    team_url: user.blog_author_team_url || "",
  };
}

function hasAuthorOverrideData(
  override: BlogPostFormType["author_override"] | undefined,
): boolean {
  if (!override) {
    return false;
  }

  return Boolean(
    override.first_name?.trim() ||
      override.last_name?.trim() ||
      override.role?.trim() ||
      override.bio?.trim() ||
      override.avatar_url?.trim() ||
      override.archive_url?.trim() ||
      override.team_url?.trim(),
  );
}

export default function AuthorBioBlock({
  control,
  setValue,
  defaultAvatarUrl,
}: AuthorBioBlockProps) {
  const authorId = useWatch({ control, name: "author_id" });
  const authorOverride = useWatch({ control, name: "author_override" });
  const authorRole = useWatch({
    control,
    name: "author_override.role",
  });
  const authorBio = useWatch({
    control,
    name: "author_override.bio",
  });
  const avatarUrl = useWatch({
    control,
    name: "author_override.avatar_url",
  });
  const authorAvatarFile = useWatch({ control, name: "author_avatar" });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const lastLoadedAuthorId = useRef<number | null>(null);

  useEffect(() => {
    if (authorAvatarFile instanceof File) {
      const url = URL.createObjectURL(authorAvatarFile);
      setAvatarPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAvatarPreviewUrl(null);
  }, [authorAvatarFile]);

  useEffect(() => {
    if (!authorId) {
      lastLoadedAuthorId.current = null;
      setValue("author_avatar", undefined);
      return;
    }

    if (lastLoadedAuthorId.current === authorId) {
      return;
    }

    // Edit flow: blog detail API already hydrated author_override — don't overwrite.
    if (
      lastLoadedAuthorId.current === null &&
      hasAuthorOverrideData(authorOverride)
    ) {
      lastLoadedAuthorId.current = authorId;
      return;
    }

    let cancelled = false;

    const loadAuthor = async () => {
      try {
        const response = await getUserDetail(authorId);
        const user = parseUserDetailResponse(response);
        if (!cancelled && user) {
          setValue("author_override", mapUserToAuthorOverride(user));
          lastLoadedAuthorId.current = authorId;
        }
      } catch (error) {
        console.error("Failed to load author profile:", error);
      }
    };

    loadAuthor();

    return () => {
      cancelled = true;
    };
  }, [authorId, authorOverride, setValue]);

  const override = authorOverride || defaultAuthorOverride;
  const displayName = getAuthorDisplayName(override);
  const hasAuthor = Boolean(authorId);
  const rolePreview = authorRole?.trim() || "";
  const bioPreview = authorBio?.trim() || "";
  const displayAvatarUrl =
    avatarPreviewUrl || avatarUrl || defaultAvatarUrl || undefined;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
        Author bio block
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rendered after the Sources block on the live post. Select an admin author
        in the byline above to load profile defaults; photo is optional (neutral
        silhouette when empty).
      </Typography>

      {!hasAuthor ? (
        <Box
          sx={{
            border: "1px dashed #ccc",
            borderRadius: 1,
            p: 3,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Select an author in the byline section above to configure the bio block.
        </Box>
      ) : (
        <>
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              p: 3,
              mb: 3,
              bgcolor: "#fafafa",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "text.secondary",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              Live preview
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Avatar
                src={displayAvatarUrl}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#e5e7eb",
                  color: "#9ca3af",
                }}
              >
                {!displayAvatarUrl && (
                  <PersonOutlineIcon sx={{ fontSize: 40 }} />
                )}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Written by
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {displayName}
                </Typography>
                <Typography
                  variant="body2"
                  color={rolePreview ? "text.secondary" : "text.disabled"}
                  sx={{ mb: 1.5, fontStyle: rolePreview ? "normal" : "italic" }}
                >
                  {rolePreview || "Author role will appear here"}
                </Typography>
                <Typography
                  variant="body2"
                  color={bioPreview ? "text.secondary" : "text.disabled"}
                  sx={{ fontStyle: bioPreview ? "normal" : "italic" }}
                >
                  {bioPreview || "Author bio will appear here."}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormAvatarUploadField
                name="author_avatar"
                control={control}
                label="Author profile photo"
                helperText="Optional. PNG, JPG, JPEG, or WebP (max 5MB). Crop to a square — shown as a circle in the author bio block."
                defaultImage={defaultAvatarUrl || avatarUrl || undefined}
                sx={commonFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextareaField
                name="author_override.bio"
                control={control}
                label="Author bio"
                rows={4}
                placeholder="Part of the VapeHub product team. Writes the Geek Zone's hands-on guides..."
              />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
