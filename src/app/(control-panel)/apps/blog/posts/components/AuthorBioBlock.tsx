"use client";

import { useEffect, useRef } from "react";
import {
  Avatar,
  Box,
  Grid,
  Link,
  Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  Control,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { getUserDetail } from "@/services/apiService";
import FormInputField from "@/components/Shared/FormInputField";
import FormTextareaField from "@/components/Shared/FormTextareaField";
import {
  commonFieldStyles,
  defaultAuthorProfile,
  getAuthorDisplayName,
  type BlogPostFormType,
} from "./blogPostFormShared";

interface AuthorBioBlockProps {
  control: Control<BlogPostFormType>;
  setValue: UseFormSetValue<BlogPostFormType>;
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

function mapUserToAuthorProfile(
  user: AuthorUserFields,
): BlogPostFormType["author_profile"] {
  return {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    profile_pic_url: user.profile_pic_url || "",
    blog_author_role: user.blog_author_role || "",
    blog_author_bio: user.blog_author_bio || "",
    blog_author_archive_url: user.blog_author_archive_url || "",
    blog_author_team_url: user.blog_author_team_url || "",
  };
}

function hasAuthorProfileData(
  profile: BlogPostFormType["author_profile"] | undefined,
): boolean {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.first_name?.trim() ||
      profile.last_name?.trim() ||
      profile.blog_author_role?.trim() ||
      profile.blog_author_bio?.trim() ||
      profile.blog_author_archive_url?.trim() ||
      profile.blog_author_team_url?.trim(),
  );
}

export default function AuthorBioBlock({
  control,
  setValue,
}: AuthorBioBlockProps) {
  const authorId = useWatch({ control, name: "author_id" });
  const authorProfile = useWatch({ control, name: "author_profile" });
  const blogAuthorRole = useWatch({
    control,
    name: "author_profile.blog_author_role",
  });
  const blogAuthorBio = useWatch({
    control,
    name: "author_profile.blog_author_bio",
  });
  const blogAuthorArchiveUrl = useWatch({
    control,
    name: "author_profile.blog_author_archive_url",
  });
  const blogAuthorTeamUrl = useWatch({
    control,
    name: "author_profile.blog_author_team_url",
  });
  const profilePicUrl = useWatch({
    control,
    name: "author_profile.profile_pic_url",
  });
  const lastLoadedAuthorId = useRef<number | null>(null);

  useEffect(() => {
    if (!authorId) {
      lastLoadedAuthorId.current = null;
      setValue("author_profile", { ...defaultAuthorProfile });
      return;
    }

    if (lastLoadedAuthorId.current === authorId) {
      return;
    }

    // Edit flow: blog detail API already hydrated author_profile — don't overwrite.
    if (
      lastLoadedAuthorId.current === null &&
      hasAuthorProfileData(authorProfile)
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
          setValue("author_profile", mapUserToAuthorProfile(user));
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
  }, [authorId, authorProfile, setValue]);

  const profile = authorProfile || defaultAuthorProfile;
  const displayName = getAuthorDisplayName(profile);
  const archiveLabel = `All articles by ${displayName} →`;
  const hasAuthor = Boolean(authorId);
  const rolePreview = blogAuthorRole?.trim() || "";
  const bioPreview = blogAuthorBio?.trim() || "";

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
        Author bio block
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Rendered after the Sources block on the live post. Name and avatar come
        from the selected author; photo is optional (neutral silhouette when
        empty).
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
          Select an author above to configure the bio block.
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
                src={profilePicUrl || undefined}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#e5e7eb",
                  color: "#9ca3af",
                }}
              >
                {!profilePicUrl && (
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
                  sx={{ mb: 2, fontStyle: bioPreview ? "normal" : "italic" }}
                >
                  {bioPreview || "Author bio will appear here."}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {blogAuthorArchiveUrl?.trim() ? (
                    <Link
                      href={blogAuthorArchiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "#247c5c", fontWeight: 500 }}
                    >
                      {archiveLabel}
                    </Link>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      {archiveLabel}
                    </Typography>
                  )}
                  {blogAuthorTeamUrl?.trim() ? (
                    <Link
                      href={blogAuthorTeamUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "#247c5c", fontWeight: 500 }}
                    >
                      Meet the team →
                    </Link>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      Meet the team →
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormInputField
                name="author_profile.blog_author_role"
                control={control}
                label="Author role (byline)"
                helperText='Shown under the name in the byline, e.g. "VapeHub product team"'
                sx={commonFieldStyles}
              />
            </Grid>
            <Grid item xs={12}>
              <FormTextareaField
                name="author_profile.blog_author_bio"
                control={control}
                label="Author bio"
                rows={4}
                placeholder="Part of the VapeHub product team. Writes the Geek Zone's hands-on guides..."
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Profile photo uses{" "}
                <code>profile_pic_url</code> on the user account. Upload or
                update it in{" "}
                <Link href={`/apps/users/user-update/${authorId}`}>
                  user settings
                </Link>
                .
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
