import { z } from "zod";
import { SxProps, Theme } from "@mui/material/styles";
import type {
  BlogAuthorOverride,
  BlogFirstPersonCallout,
  BlogInlineProductCardEntityType,
  BlogPost,
  BlogPullQuoteSourceType,
  BlogSource,
} from "@/services/apiBlog";

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

export const PULL_QUOTE_SOURCE_TYPES = [
  "UKVIA",
  "MHRA",
  "OHID",
  "peer_reviewed",
] as const satisfies readonly BlogPullQuoteSourceType[];

export const PULL_QUOTE_SOURCE_TYPE_OPTIONS: {
  value: BlogPullQuoteSourceType;
  label: string;
}[] = [
  { value: "UKVIA", label: "UKVIA" },
  { value: "MHRA", label: "MHRA" },
  { value: "OHID", label: "OHID" },
  { value: "peer_reviewed", label: "Peer-reviewed study" },
];

const INTERNAL_ATTRIBUTION_PATTERNS = [
  /vapehub/i,
  /geek\s*zone/i,
  /editorial\s*team/i,
  /product\s*team/i,
];

const INTERNAL_SOURCE_HOST_PATTERNS = [/vapehub/i, /geekzone/i, /geek-zone/i];

function isInternalAttribution(value: string): boolean {
  return INTERNAL_ATTRIBUTION_PATTERNS.some((pattern) => pattern.test(value));
}

function isInternalSourceUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return INTERNAL_SOURCE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

const pullQuoteSchema = z
  .object({
    enabled: z.boolean().default(false),
    body: z.string().max(1000, "Quote body must not exceed 1000 characters"),
    attribution: z.string().max(255, "Attribution must not exceed 255 characters"),
    source_url: z.string(),
    source_type: z.enum(PULL_QUOTE_SOURCE_TYPES).or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) {
      return;
    }

    if (!data.body.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quote body is required",
        path: ["body"],
      });
    }

    if (!data.attribution.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Attribution is required",
        path: ["attribution"],
      });
    } else if (isInternalAttribution(data.attribution)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Attribution must be from an authoritative external source, not internal staff",
        path: ["attribution"],
      });
    }

    if (!data.source_url.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source URL is required",
        path: ["source_url"],
      });
    } else {
      try {
        const url = new URL(data.source_url.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Source URL must use http or https",
            path: ["source_url"],
          });
        } else if (isInternalSourceUrl(data.source_url.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Source URL must not be an internal VapeHub domain",
            path: ["source_url"],
          });
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Source URL must be a valid URL",
          path: ["source_url"],
        });
      }
    }

    if (!data.source_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Source type is required",
        path: ["source_type"],
      });
    }
  });

export const defaultPullQuote: z.infer<typeof pullQuoteSchema> = {
  enabled: false,
  body: "",
  attribution: "",
  source_url: "",
  source_type: "",
};

export const INLINE_PRODUCT_CARD_ENTITY_TYPES = [
  "product",
  "category",
] as const satisfies readonly BlogInlineProductCardEntityType[];

export const INLINE_PRODUCT_CARD_ENTITY_TYPE_OPTIONS: {
  value: BlogInlineProductCardEntityType;
  label: string;
}[] = [
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
];

const inlineProductCardEntitySchema = z.object({
  id: z.number(),
  name: z.string(),
});

const inlineProductCardSchema = z
  .object({
    enabled: z.boolean().default(false),
    entity_type: z.enum(INLINE_PRODUCT_CARD_ENTITY_TYPES).or(z.literal("")),
    entity: inlineProductCardEntitySchema.nullable().default(null),
    blurb: z.string().max(500, "Blurb must not exceed 500 characters"),
    title: z.string().max(255, "Title must not exceed 255 characters"),
    cta_label: z.string().max(50, "CTA label must not exceed 50 characters"),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) {
      return;
    }

    if (!data.entity_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Entity type is required",
        path: ["entity_type"],
      });
    }

    if (!data.entity?.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Product or category is required",
        path: ["entity"],
      });
    }

    if (!data.blurb.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Blurb is required",
        path: ["blurb"],
      });
    }
  });

export const defaultInlineProductCard: z.infer<typeof inlineProductCardSchema> = {
  enabled: false,
  entity_type: "",
  entity: null,
  blurb: "",
  title: "",
  cta_label: "",
};

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export const DEFAULT_FIRST_PERSON_CALLOUT_LABEL = "FROM OUR WAREHOUSE";

const firstPersonCalloutItemSchema = z.object({
  label: z.string().max(100, "Label must not exceed 100 characters").optional(),
  heading: z.string().max(255, "Heading must not exceed 255 characters"),
  body: z.string(),
  insert_after_paragraph: z.coerce.number(),
});

const firstPersonCalloutsSchema = z
  .array(firstPersonCalloutItemSchema)
  .max(2, "Maximum 2 first-person callouts per article")
  .superRefine((items, ctx) => {
    const paragraphIndexes = new Set<number>();

    items.forEach((item, index) => {
      if (!item.heading.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Heading is required",
          path: [index, "heading"],
        });
      }

      if (!stripHtml(item.body)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Body copy is required",
          path: [index, "body"],
        });
      } else if (item.body.length > 2000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Body copy must not exceed 2000 characters",
          path: [index, "body"],
        });
      }

      if (!Number.isFinite(item.insert_after_paragraph) || item.insert_after_paragraph < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Insert after paragraph is required (minimum 1)",
          path: [index, "insert_after_paragraph"],
        });
      } else if (paragraphIndexes.has(item.insert_after_paragraph)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Insert after paragraph must be unique for each callout",
          path: [index, "insert_after_paragraph"],
        });
      } else {
        paragraphIndexes.add(item.insert_after_paragraph);
      }
    });
  });

export const defaultFirstPersonCalloutItem: z.infer<typeof firstPersonCalloutItemSchema> = {
  label: "",
  heading: "",
  body: "",
  insert_after_paragraph: 0,
};

function parseInsertAfterParagraph(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildFirstPersonCalloutsPayload(
  callouts: BlogPostFormType["first_person_callouts"] | undefined,
): BlogFirstPersonCallout[] {
  return (callouts ?? []).map((callout) => ({
    label: callout.label?.trim() || DEFAULT_FIRST_PERSON_CALLOUT_LABEL,
    heading: callout.heading.trim(),
    body: callout.body,
    insert_after_paragraph: parseInsertAfterParagraph(callout.insert_after_paragraph),
  }));
}

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
  pull_quote: pullQuoteSchema.default(defaultPullQuote),
  inline_product_card: inlineProductCardSchema.default(defaultInlineProductCard),
  first_person_callouts: firstPersonCalloutsSchema.default([]),
});

export type BlogPostFormType = z.infer<typeof blogPostBaseSchema>;

export type BlogAuthorOption = {
  id: number;
  label: string;
};

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
  pull_quote: { ...defaultPullQuote },
  inline_product_card: { ...defaultInlineProductCard },
  first_person_callouts: [],
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
    pull_quote: post.pull_quote
      ? {
          enabled: true,
          body: post.pull_quote.body || "",
          attribution: post.pull_quote.attribution || "",
          source_url: post.pull_quote.source_url || "",
          source_type: post.pull_quote.source_type || "",
        }
      : { ...defaultPullQuote },
    inline_product_card: post.inline_product_card
      ? {
          enabled: true,
          entity_type: post.inline_product_card.entity_type || "",
          entity: post.inline_product_card.entity_id
            ? {
                id: post.inline_product_card.entity_id,
                name:
                  post.inline_product_card.entity_name ||
                  post.inline_product_card.title ||
                  post.inline_product_card.product?.title ||
                  `#${post.inline_product_card.entity_id}`,
              }
            : null,
          blurb:
            post.inline_product_card.blurb ||
            post.inline_product_card.product?.blurb ||
            "",
          title:
            post.inline_product_card.title ||
            post.inline_product_card.product?.title ||
            "",
          cta_label: post.inline_product_card.cta_label || "",
        }
      : { ...defaultInlineProductCard },
    first_person_callouts: (post.first_person_callouts || []).map((callout) => ({
      label: callout.label || "",
      heading: callout.heading || "",
      body: callout.body || "",
      insert_after_paragraph: callout.insert_after_paragraph ?? 0,
    })),
  };
}

export function buildBlogPostFormData(
  data: BlogPostFormType,
  options?: {
    image?: File | null;
    redirectUrl?: string;
    isEdit?: boolean;
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

  if (data.pull_quote.enabled) {
    formData.append(
      "pull_quote",
      JSON.stringify({
        body: data.pull_quote.body.trim(),
        attribution: data.pull_quote.attribution.trim(),
        source_url: data.pull_quote.source_url.trim(),
        source_type: data.pull_quote.source_type,
        location: "mid_body_after_h2",
      }),
    );
  } else if (options?.isEdit) {
    formData.append("pull_quote", "");
  }

  if (data.inline_product_card.enabled && data.inline_product_card.entity?.id) {
    const cardPayload: Record<string, string | number> = {
      entity_type: data.inline_product_card.entity_type,
      entity_id: data.inline_product_card.entity.id,
      blurb: data.inline_product_card.blurb.trim(),
    };

    if (data.inline_product_card.title.trim()) {
      cardPayload.title = data.inline_product_card.title.trim();
    }

    if (data.inline_product_card.cta_label.trim()) {
      cardPayload.cta_label = data.inline_product_card.cta_label.trim();
    }

    formData.append("inline_product_card", JSON.stringify(cardPayload));
  } else if (options?.isEdit) {
    formData.append("inline_product_card", "");
  }

  const firstPersonCallouts = data.first_person_callouts ?? [];

  if (firstPersonCallouts.length > 0) {
    formData.append(
      "first_person_callouts",
      JSON.stringify(buildFirstPersonCalloutsPayload(firstPersonCallouts)),
    );
  } else if (options?.isEdit) {
    formData.append("first_person_callouts", "");
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
