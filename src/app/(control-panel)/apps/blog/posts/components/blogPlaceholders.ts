/** Placeholder tokens inserted in CKEditor content; replaced on the storefront. */
export const BLOG_PLACEHOLDER_TOKENS = {
  pullQuote: "{{pullQuote}}",
  inlineProductCard: "{{inlineProductCard}}",
  firstPersonCallout: (index: number) => `{{firstPersonCallout:${index}}}`,
} as const;

const PULL_QUOTE_RE = /\{\{pullQuote\}\}/g;
const INLINE_PRODUCT_CARD_RE = /\{\{inlineProductCard\}\}/g;
const FIRST_PERSON_CALLOUT_RE = /\{\{firstPersonCallout:(\d+)\}\}/g;
const WAREHOUSE_CALLOUT_MARKER_RE = /blog-warehouse-callout/gi;
const INDUSTRY_QUOTE_MARKER_RE = /blog-industry-quote/gi;
const PROMO_BANNER_MARKER_RE = /blog-promo-banner/gi;

export interface BlogPlaceholderCounts {
  pullQuote: number;
  inlineProductCard: number;
  firstPersonCallouts: Record<number, number>;
}

export function countBlogPlaceholders(content: string): BlogPlaceholderCounts {
  const firstPersonCallouts: Record<number, number> = {};

  for (const match of content.matchAll(FIRST_PERSON_CALLOUT_RE)) {
    const index = Number.parseInt(match[1], 10);
    if (Number.isFinite(index) && index > 0) {
      firstPersonCallouts[index] = (firstPersonCallouts[index] ?? 0) + 1;
    }
  }

  return {
    pullQuote: (content.match(PULL_QUOTE_RE) ?? []).length,
    inlineProductCard: (content.match(INLINE_PRODUCT_CARD_RE) ?? []).length,
    firstPersonCallouts,
  };
}

/** Count placeholders plus embedded storefront marker divs already in saved content. */
export function countBlogBlockPositions(content: string): BlogPlaceholderCounts {
  const counts = countBlogPlaceholders(content);
  const firstPersonCallouts = { ...counts.firstPersonCallouts };

  const warehouseMarkerCount = (content.match(WAREHOUSE_CALLOUT_MARKER_RE) ?? []).length;
  for (let index = 1; index <= warehouseMarkerCount; index += 1) {
    if ((firstPersonCallouts[index] ?? 0) === 0) {
      firstPersonCallouts[index] = 1;
    }
  }

  return {
    pullQuote: counts.pullQuote + (content.match(INDUSTRY_QUOTE_MARKER_RE) ?? []).length,
    inlineProductCard:
      counts.inlineProductCard + (content.match(PROMO_BANNER_MARKER_RE) ?? []).length,
    firstPersonCallouts,
  };
}

export function getFirstPersonCalloutPlaceholderIndexes(
  counts: BlogPlaceholderCounts,
): number[] {
  return Object.keys(counts.firstPersonCallouts)
    .map((key) => Number.parseInt(key, 10))
    .filter((index) => Number.isFinite(index) && index > 0)
    .sort((a, b) => a - b);
}
