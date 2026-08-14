import type { RelatedLink } from "@/services/apiProductCategory";

export const EMPTY_RELATED_LINK: RelatedLink = { text: "", url: "" };

const INVALID_URL_MESSAGE =
  "Enter a valid absolute URL (https://...), path (/disposable-vapes), or slug (disposable-vapes)";

/** Absolute http(s) URL, root-relative path, or hyphenated slug. */
const ABSOLUTE_URL_PATTERN = /^https?:\/\/[^\s]+$/i;
const PATH_PATTERN = /^\/[A-Za-z0-9\-._~:/?#\[\]@!$&'()*+,;=%]+$/;
/** Slug must include at least one hyphen, e.g. disposable-vapes (not random text). */
const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$/;

export function isValidRelatedLinkUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;

  if (ABSOLUTE_URL_PATTERN.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  if (PATH_PATTERN.test(value)) {
    return true;
  }

  return SLUG_PATTERN.test(value);
}

export function getRelatedLinkUrlError(url: string): string | null {
  const value = url.trim();
  if (!value) return null;
  if (isValidRelatedLinkUrl(value)) return null;
  return INVALID_URL_MESSAGE;
}

export function cleanRelatedLinks(links: RelatedLink[]): RelatedLink[] {
  return links
    .map((link) => ({
      text: (link.text ?? "").trim(),
      url: (link.url ?? "").trim(),
    }))
    .filter((link) => link.text || link.url);
}

export type RelatedLinkFieldErrors = {
  text?: string;
  url?: string;
};

export function getRelatedLinkRowErrors(
  link: RelatedLink,
  options?: { requireFields?: boolean }
): RelatedLinkFieldErrors {
  const text = (link.text ?? "").trim();
  const url = (link.url ?? "").trim();
  const errors: RelatedLinkFieldErrors = {};

  // Optional rows (e.g. create forms): completely blank rows are skipped
  if (!options?.requireFields && !text && !url) {
    return errors;
  }

  if (!text) {
    errors.text = "Text is required";
  }

  if (!url) {
    errors.url = "URL is required";
  } else if (!isValidRelatedLinkUrl(url)) {
    errors.url = INVALID_URL_MESSAGE;
  }

  return errors;
}

/** Live URL-only check (while typing) — empty is not an error yet. */
export function getLiveRelatedLinkUrlError(url: string): string | null {
  return getRelatedLinkUrlError(url);
}

export function hasRelatedLinksErrors(links: RelatedLink[]): boolean {
  return links.some((link) => {
    const text = (link.text ?? "").trim();
    const url = (link.url ?? "").trim();
    if (!text && !url) return false;
    return Object.keys(getRelatedLinkRowErrors(link)).length > 0;
  });
}

export function getRelatedLinksValidationErrors(
  links: RelatedLink[] | null | undefined,
  options?: { requireFields?: boolean }
): string[] {
  const errors: string[] = [];

  if (links === undefined || links === null) {
    errors.push("Related links are required");
    return errors;
  }

  if (!Array.isArray(links)) {
    errors.push("Related links must be an array");
    return errors;
  }

  links.forEach((link, index) => {
    if (!link || typeof link !== "object" || Array.isArray(link)) {
      errors.push("Invalid related link entry");
      return;
    }

    const rowErrors = getRelatedLinkRowErrors(link, options);
    const rowLabel = `Link ${index + 1}`;

    if (rowErrors.text) {
      errors.push(`${rowLabel}: ${rowErrors.text}`);
    }
    if (rowErrors.url) {
      errors.push(`${rowLabel}: ${rowErrors.url}`);
    }
  });

  return Array.from(new Set(errors));
}

export function extractRelatedLinksApiErrors(error: unknown): string[] {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
        errors?: { msg?: string; message?: string }[];
      };
    };
    message?: string;
  };

  const messages =
    apiError?.response?.data?.errors
      ?.map((entry) => entry.msg || entry.message)
      .filter((msg): msg is string => Boolean(msg)) ?? [];

  if (messages.length > 0) {
    return messages;
  }

  const fallback =
    apiError?.response?.data?.message ||
    apiError?.message ||
    "Failed to save related links";

  return [fallback];
}
