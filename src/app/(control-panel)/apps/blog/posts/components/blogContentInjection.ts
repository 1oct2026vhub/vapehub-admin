import { BLOG_PLACEHOLDER_TOKENS } from "./blogPlaceholders";

const DEFAULT_WAREHOUSE_CALLOUT_LABEL = "FROM OUR WAREHOUSE";

const WAREHOUSE_CALLOUT_DIV_RE =
  /<div[^>]*\bclass=["'][^"']*\bblog-warehouse-callout\b[^"']*["'][^>]*(?:\/>|>[\s\S]*?<\/div>)/gi;

function escapeCalloutAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeCalloutAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export interface InjectedFirstPersonCallout {
  label: string;
  heading: string;
  body: string;
}

function buildWarehouseCalloutDiv(label: string, title: string, bodyHtml: string): string {
  return `<div class="blog-warehouse-callout" data-label="${escapeCalloutAttr(label)}" data-title="${escapeCalloutAttr(title)}" data-body-html="${escapeCalloutAttr(bodyHtml)}"></div>`;
}

/** Replace {{firstPersonCallout:n}} tokens with storefront marker divs before save. */
export function injectFirstPersonCalloutsIntoContent(
  content: string,
  callouts: InjectedFirstPersonCallout[],
): string {
  return callouts.reduce((result, callout, index) => {
    const token = BLOG_PLACEHOLDER_TOKENS.firstPersonCallout(index + 1);
    const marker = buildWarehouseCalloutDiv(
      callout.label?.trim() || DEFAULT_WAREHOUSE_CALLOUT_LABEL,
      callout.heading.trim(),
      callout.body,
    );

    if (result.includes(token)) {
      return result.split(token).join(marker);
    }

    const trimmed = result.trimEnd();
    return trimmed ? `${trimmed}${marker}` : marker;
  }, content);
}

/** Parse callout blocks embedded in saved HTML back into form values. */
export function extractFirstPersonCalloutsFromContent(
  content: string,
): InjectedFirstPersonCallout[] {
  const callouts: InjectedFirstPersonCallout[] = [];

  for (const match of content.matchAll(WAREHOUSE_CALLOUT_DIV_RE)) {
    const openTag = match[0].match(/^<div[^>]*>/i)?.[0] ?? "";
    const label =
      openTag.match(/data-label=["']([^"']*)["']/i)?.[1] ??
      DEFAULT_WAREHOUSE_CALLOUT_LABEL;
    const heading = openTag.match(/data-title=["']([^"']*)["']/i)?.[1] ?? "";
    const bodyFromAttr = openTag.match(/data-body-html=["']([^"']*)["']/i)?.[1] ?? "";

    callouts.push({
      label: decodeCalloutAttr(label),
      heading: decodeCalloutAttr(heading),
      body: decodeCalloutAttr(bodyFromAttr),
    });
  }

  return callouts;
}

/** Convert saved marker divs back to editor placeholders for editing. */
export function restoreFirstPersonCalloutPlaceholdersInContent(content: string): string {
  let calloutIndex = 0;

  return content.replace(WAREHOUSE_CALLOUT_DIV_RE, () => {
    calloutIndex += 1;
    return BLOG_PLACEHOLDER_TOKENS.firstPersonCallout(calloutIndex);
  });
}
