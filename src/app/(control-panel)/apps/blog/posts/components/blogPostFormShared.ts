import { z } from "zod";
import { SxProps, Theme } from "@mui/material/styles";
import type { BlogPost, BlogSource } from "@/services/apiBlog";
import { updateUser } from "@/services/apiService";

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

const authorProfileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  profile_pic_url: z.string().optional(),
  blog_author_role: z.string().optional(),
  blog_author_bio: z.string().optional(),
  blog_author_archive_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
  blog_author_team_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal("")),
});

export const defaultAuthorProfile: z.infer<typeof authorProfileSchema> = {
  first_name: "",
  last_name: "",
  profile_pic_url: "",
  blog_author_role: "",
  blog_author_bio: "",
  blog_author_archive_url: "",
  blog_author_team_url: "",
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
  author_profile: authorProfileSchema.default(defaultAuthorProfile),
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
  author_profile: { ...defaultAuthorProfile },
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

function mapAuthorToProfile(author?: BlogPost["author"]) {
  if (!author) {
    return { ...defaultAuthorProfile };
  }

  return {
    first_name: author.first_name || "",
    last_name: author.last_name || "",
    profile_pic_url: author.profile_pic_url || "",
    blog_author_role: author.blog_author_role || "",
    blog_author_bio: author.blog_author_bio || "",
    blog_author_archive_url: author.blog_author_archive_url || "",
    blog_author_team_url: author.blog_author_team_url || "",
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
    author_profile: mapAuthorToProfile(post.author),
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
  profile: BlogPostFormType["author_profile"],
): string {
  const name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || "Author";
}

export async function saveAuthorProfile(
  authorId: number,
  profile: BlogPostFormType["author_profile"],
) {
  await updateUser(authorId, {
    blog_author_role: profile.blog_author_role?.trim() || "",
    blog_author_bio: profile.blog_author_bio?.trim() || "",
    blog_author_archive_url: profile.blog_author_archive_url?.trim() || "",
    blog_author_team_url: profile.blog_author_team_url?.trim() || "",
  });
}
