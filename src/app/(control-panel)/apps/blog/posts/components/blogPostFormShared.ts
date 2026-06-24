import { z } from "zod";
import { SxProps, Theme } from "@mui/material/styles";
import type { BlogAuthorOverride, BlogPost, BlogSource } from "@/services/apiBlog";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MIN_IMAGE_WIDTH = 1091;
export const MIN_IMAGE_HEIGHT = 320;
export const MAX_IMAGE_WIDTH = 1300;
export const MAX_IMAGE_HEIGHT = 360;

export const commonFieldStyles: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "0",
    "& fieldset": {
      borderColor: "#2E9970",
      borderRadius: "0",
    },
    "&:hover fieldset": {
      borderColor: "#247C5C",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1E7A56",
      borderWidth: "2px",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#2E9970",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2E9970",
  },
};

const categoryTagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const sourceSchema = z.object({
  label: z.string().optional(),
  href: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

const relatedPostSchema = z.object({
  id: z.number(),
  title: z.string(),
});

const authorOverrideSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  archive_url: z.string().optional().or(z.literal("")),
  team_url: z.string().optional().or(z.literal("")),
});

export const defaultAuthorOverride: z.infer<typeof authorOverrideSchema> = {
  first_name: "",
  last_name: "",
  role: "",
  bio: "",
  avatar_url: "",
  archive_url: "",
  team_url: "",
};

export const blogPostBaseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  content: z.string().min(1, "Content is required"),
  alt_text: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(150, "Slug must not exceed 150 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be in valid format (lowercase letters, numbers, and hyphens)",
    ),
  image: z
    .any()
    .refine(
      (file) => !file || !(file instanceof File) || file.size <= MAX_FILE_SIZE,
      "File size exceeds the maximum limit of 5MB.",
    )
    .optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().nullable().optional(),
  categories: z.array(categoryTagSchema).default([]),
  tags: z.array(categoryTagSchema).default([]),
  author_id: z.number().nullable().optional(),
  author_override: authorOverrideSchema.default(defaultAuthorOverride),
  author_avatar: z
    .any()
    .refine(
      (file) =>
        !file || !(file instanceof File) || file.size <= MAX_FILE_SIZE,
      "File size exceeds the maximum limit of 5MB.",
    )
    .optional(),
  sources: z.array(sourceSchema).default([]),
  related_posts: z.array(relatedPostSchema).max(3, "Maximum 3 related guides").default([]),
  redirect_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
});

export type BlogPostFormType = z.infer<typeof blogPostBaseSchema>;

export const blogPostDefaultValues: BlogPostFormType = {
  title: "",
  content: "",
  slug: "",
  alt_text: "",
  status: "draft",
  published_at: null,
  categories: [],
  tags: [],
  author_id: null,
  author_override: { ...defaultAuthorOverride },
  sources: [],
  related_posts: [],
  redirect_url: "",
};

function mapSourceToFormValue(source: BlogSource & { text?: string; url?: string }) {
  return {
    label: source.label || source.text || "",
    href: source.href || source.url || "",
    description: source.description || "",
  };
}

function mapAuthorOverrideFromPost(post: BlogPost): BlogPostFormType["author_override"] {
  const override = post.author_override;
  if (override) {
    return {
      first_name: override.first_name || "",
      last_name: override.last_name || "",
      role: override.role || "",
      bio: override.bio || "",
      avatar_url: override.avatar_url || "",
      archive_url: override.archive_url || "",
      team_url: override.team_url || "",
    };
  }

  const author = post.author;
  if (!author) {
    return { ...defaultAuthorOverride };
  }

  return {
    first_name: author.first_name || "",
    last_name: author.last_name || "",
    role: author.blog_author_role || "",
    bio: author.blog_author_bio || "",
    avatar_url: author.profile_pic_url || "",
    archive_url: author.blog_author_archive_url || "",
    team_url: author.blog_author_team_url || "",
  };
}

export function mapBlogPostToFormValues(post: BlogPost): BlogPostFormType {
  const relatedBlogs = post.related_blogs || post.related_posts || [];

  return {
    title: post.title,
    content: post.content,
    slug: post.slug,
    alt_text: post.alt_text || "",
    status: (post.status as BlogPostFormType["status"]) || "draft",
    published_at: post.published_at || null,
    categories: post.categories || [],
    tags: post.tags || [],
    author_id: post.author_id ?? post.author?.id ?? null,
    author_override: mapAuthorOverrideFromPost(post),
    sources: (post.sources || []).map(mapSourceToFormValue),
    related_posts: relatedBlogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
    })),
    redirect_url: post.redirect_url || post.redirect?.redirect_url || "",
  };
}

export function buildBlogPostFormData(
  data: BlogPostFormType,
  options?: {
    image?: File | null;
    redirectUrl?: string;
  },
): FormData {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("content", data.content);
  formData.append("slug", data.slug);
  formData.append("status", data.status);

  if (data.alt_text?.trim()) {
    formData.append("alt_text", data.alt_text.trim());
  }

  if (data.published_at) {
    formData.append("published_at", data.published_at);
  }

  data.categories.forEach((category) => {
    formData.append("categories", String(category.id));
  });

  data.tags.forEach((tag) => {
    formData.append("tags", String(tag.id));
  });

  if (options?.image) {
    formData.append("image", options.image);
  }

  if (data.author_id) {
    formData.append("author_id", String(data.author_id));
  }

  const authorAvatarFile =
    data.author_avatar instanceof File ? data.author_avatar : null;
  const authorOverridePayload = buildAuthorOverridePayload(
    data.author_override,
    authorAvatarFile,
  );

  if (authorOverridePayload) {
    formData.append("author_override", JSON.stringify(authorOverridePayload));
  }

  if (authorAvatarFile) {
    formData.append("author_avatar", authorAvatarFile);
  }

  const validSources = data.sources.filter((source) => source.label?.trim());
  if (validSources.length > 0) {
    formData.append(
      "sources",
      JSON.stringify(
        validSources.map((source) => {
          const entry: { label: string; href: string; description?: string } = {
            label: source.label!.trim(),
            href: source.href?.trim() || "",
          };
          if (source.description?.trim()) {
            entry.description = source.description.trim();
          }
          return entry;
        }),
      ),
    );
  }

  if (data.related_posts.length > 0) {
    formData.append(
      "related_blog_ids",
      data.related_posts.map((post) => post.id).join(","),
    );
  }

  if (options?.redirectUrl?.trim()) {
    formData.append("redirect_url", options.redirectUrl.trim());
  }

  return formData;
}

export function getAuthorDisplayName(
  override: BlogPostFormType["author_override"],
): string {
  const name = [override.first_name, override.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || "Author";
}

function buildAuthorOverridePayload(
  override: BlogPostFormType["author_override"],
  authorAvatarFile: File | null,
): BlogAuthorOverride | null {
  const payload: BlogAuthorOverride = {};

  if (override.first_name?.trim()) {
    payload.first_name = override.first_name.trim();
  }
  if (override.last_name?.trim()) {
    payload.last_name = override.last_name.trim();
  }
  if (override.role?.trim()) {
    payload.role = override.role.trim();
  }
  if (override.bio?.trim()) {
    payload.bio = override.bio.trim();
  }
  if (override.archive_url?.trim()) {
    payload.archive_url = override.archive_url.trim();
  }
  if (override.team_url?.trim()) {
    payload.team_url = override.team_url.trim();
  }
  if (!authorAvatarFile && override.avatar_url?.trim()) {
    payload.avatar_url = override.avatar_url.trim();
  }

  return Object.keys(payload).length > 0 || authorAvatarFile ? payload : null;
}
