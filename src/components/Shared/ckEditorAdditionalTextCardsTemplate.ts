/** CKEditor templates + styles for Additional Text Box card blocks. */

import { typeCardPlaceholderSrc } from "@/components/Shared/ckEditorCategoryCardsTemplate";

/** Shop CTA / link text (nicotine buttons + flavour links). */
const SHOP_LINK = "#005434";
const TEXT_DARK = "#1e293b";
const TEXT_MUTED = "#475569";
const BORDER = "#e2e8f0";

/** Nicotine strength card images — square 250×250. */
export const ATB_NIC_IMAGE_WIDTH = 250;
export const ATB_NIC_IMAGE_HEIGHT = 250;
export const ATB_NIC_IMAGE_ASPECT_RATIO = `${ATB_NIC_IMAGE_WIDTH}/${ATB_NIC_IMAGE_HEIGHT}`;
export const ATB_NIC_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ATB_NIC_IMG_INLINE_STYLE =
  `display:block!important;position:static!important;float:none!important;width:160px!important;max-width:160px!important;height:auto!important;aspect-ratio:${ATB_NIC_IMAGE_ASPECT_RATIO}!important;object-fit:contain!important;object-position:center center!important;image-rendering:auto!important;margin:0 auto 16px auto!important;padding:0!important;background:#f1f5f9!important;transform:none!important;`;

/** Flavour category icons — square 250×250 (matches storefront CDN assets). */
export const ATB_FLAVOUR_IMAGE_WIDTH = 250;
export const ATB_FLAVOUR_IMAGE_HEIGHT = 250;
export const ATB_FLAVOUR_IMAGE_ASPECT_RATIO = `${ATB_FLAVOUR_IMAGE_WIDTH}/${ATB_FLAVOUR_IMAGE_HEIGHT}`;
export const ATB_FLAVOUR_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ATB_FLAVOUR_IMG_INLINE_STYLE =
  `display:block!important;position:static!important;float:none!important;width:125px!important;max-width:125px!important;height:auto!important;aspect-ratio:${ATB_FLAVOUR_IMAGE_ASPECT_RATIO}!important;object-fit:contain!important;object-position:center center!important;image-rendering:auto!important;margin:0 auto 16px auto!important;padding:0!important;background:#f1f5f9!important;transform:none!important;`;

/** Embedded in saved `additional_text_box` so storefront keeps layout. */
export const ADDITIONAL_TEXT_CARDS_STOREFRONT_CSS = `
.atb-nic-cards{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important;align-items:stretch!important;width:100%!important;margin:0 0 32px 0!important;padding:0!important;box-sizing:border-box!important;font-family:Arial,Helvetica,sans-serif!important}
.atb-nic-cards *,.atb-nic-cards *::before,.atb-nic-cards *::after{box-sizing:border-box!important}
.atb-nic-card{display:flex!important;flex-direction:column!important;height:100%!important;min-height:100%!important;margin:0!important;padding:0!important;background:#fff!important;border:1px solid ${BORDER}!important;border-radius:12px!important;box-shadow:0 1px 3px rgba(15,23,42,.06)!important;overflow:hidden!important;text-align:left!important}
.atb-nic-card__media{display:block!important;width:100%!important;margin:0!important;padding:20px 16px 16px 16px!important;border-bottom:1px solid ${BORDER}!important;box-sizing:border-box!important;flex-shrink:0!important;text-align:center!important}
.atb-nic-card__img,.atb-nic-card img.atb-nic-card__img,.atb-nic-card__media img{display:block!important;width:160px!important;max-width:160px!important;height:auto!important;aspect-ratio:${ATB_NIC_IMAGE_ASPECT_RATIO}!important;object-fit:contain!important;object-position:center center!important;margin:0 auto!important;padding:0!important;background:#f1f5f9!important;border:0!important;border-radius:0!important}
.atb-nic-card__media figure,.atb-nic-card__media .image,.atb-nic-card__media figure.image{display:block!important;width:160px!important;max-width:160px!important;margin:0 auto!important;padding:0!important;aspect-ratio:${ATB_NIC_IMAGE_ASPECT_RATIO}!important;overflow:hidden!important;background:#f1f5f9!important}
.atb-nic-card__media figure img,.atb-nic-card__media .image img{margin:0!important;width:100%!important;height:100%!important;aspect-ratio:auto!important;object-fit:contain!important}
.atb-nic-card__body{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;width:100%!important;margin:0!important;padding:20px!important;box-sizing:border-box!important}
.atb-nic-card h3,.atb-nic-card__title{display:block!important;margin:0 0 10px 0!important;font-size:18px!important;line-height:1.3!important;font-weight:700!important;color:${TEXT_DARK}!important}
.atb-nic-card p,.atb-nic-card__desc{display:block!important;margin:0 0 16px 0!important;font-size:14px!important;line-height:1.55!important;font-weight:400!important;color:${TEXT_MUTED}!important;flex:1 1 auto!important}
.atb-nic-card__footer{display:flex!important;flex-direction:column!important;gap:10px!important;margin-top:auto!important;padding-top:0!important;border-top:0!important;width:100%!important}
.atb-nic-card__btn-row{display:block!important;width:100%!important;margin:0!important;padding:0!important;background:#fff!important;border:1px solid ${BORDER}!important;border-radius:8px!important;box-sizing:border-box!important;overflow:hidden!important}
.atb-nic-card__btn,.atb-nic-card a.atb-nic-card__btn,.atb-nic-card__btn-row a{display:flex!important;align-items:center!important;justify-content:space-between!important;width:100%!important;box-sizing:border-box!important;padding:12px 14px!important;background:transparent!important;border:0!important;border-radius:0!important;color:${SHOP_LINK}!important;font-size:14px!important;font-weight:600!important;text-decoration:none!important;line-height:1.3!important}
.atb-nic-card__btn-arrow{display:inline-block!important;color:#94a3b8!important;font-weight:400!important;margin-left:8px!important;flex-shrink:0!important}
.atb-flavour-cards{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:28px!important;column-gap:28px!important;row-gap:28px!important;align-items:stretch!important;width:100%!important;margin:0 0 32px 0!important;padding:0!important;box-sizing:border-box!important;font-family:Arial,Helvetica,sans-serif!important}
.atb-flavour-cards *,.atb-flavour-cards *::before,.atb-flavour-cards *::after{box-sizing:border-box!important}
.atb-flavour-card{display:grid!important;grid-template-rows:auto 1fr auto!important;grid-template-columns:minmax(0,1fr)!important;align-self:stretch!important;height:100%!important;min-height:100%!important;margin:0!important;padding:0!important;background:#fff!important;border:1px solid ${BORDER}!important;border-radius:12px!important;box-shadow:0 1px 3px rgba(15,23,42,.04)!important;overflow:hidden!important;text-align:left!important;position:relative!important;float:none!important}
.atb-flavour-card__media{display:block!important;grid-row:1!important;width:100%!important;margin:0!important;padding:20px 16px 16px 16px!important;border-bottom:1px solid ${BORDER}!important;box-sizing:border-box!important;text-align:center!important}
.atb-flavour-card__img,.atb-flavour-card img.atb-flavour-card__img,.atb-flavour-card__media img{display:block!important;width:125px!important;max-width:125px!important;height:auto!important;aspect-ratio:${ATB_FLAVOUR_IMAGE_ASPECT_RATIO}!important;object-fit:contain!important;object-position:center center!important;margin:0 auto 0 auto!important;padding:0!important;background:#f1f5f9!important;border:0!important;border-radius:0!important}
.atb-flavour-card__media figure,.atb-flavour-card__media .image,.atb-flavour-card__media figure.image{display:block!important;width:125px!important;max-width:125px!important;margin:0 auto!important;padding:0!important;aspect-ratio:${ATB_FLAVOUR_IMAGE_ASPECT_RATIO}!important;overflow:hidden!important;background:#f1f5f9!important}
.atb-flavour-card__media figure img,.atb-flavour-card__media .image img{margin:0!important;width:100%!important;height:100%!important;aspect-ratio:auto!important;object-fit:contain!important}
.atb-flavour-card__body{display:block!important;grid-row:2!important;width:100%!important;margin:0!important;padding:16px 16px 0 16px!important;box-sizing:border-box!important;min-height:0!important}
.atb-flavour-card h3,.atb-flavour-card__title{display:block!important;margin:0 0 10px 0!important;font-size:16px!important;line-height:1.3!important;font-weight:700!important;color:${TEXT_DARK}!important}
.atb-flavour-card p,.atb-flavour-card__desc{display:block!important;margin:0!important;font-size:14px!important;line-height:1.55!important;font-weight:400!important;color:${TEXT_MUTED}!important}
.atb-flavour-card__footer{display:block!important;grid-row:3!important;margin:0!important;padding:16px 16px 20px 16px!important;width:100%!important;box-sizing:border-box!important;align-self:end!important}
.atb-flavour-card__link,.atb-flavour-card a.atb-flavour-card__link{display:block!important;margin:0!important;padding:0!important;color:${SHOP_LINK}!important;font-size:14px!important;font-weight:700!important;text-decoration:none!important;line-height:1.3!important}
@media (max-width:1100px){.atb-flavour-cards{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
@media (max-width:900px){.atb-nic-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}.atb-flavour-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media (max-width:560px){.atb-nic-cards,.atb-flavour-cards{grid-template-columns:1fr!important}}
`.replace(/\s+/g, " ").trim();

export const ADDITIONAL_TEXT_CARDS_STYLE_TAG = `<style data-atb-cards-css="1">${ADDITIONAL_TEXT_CARDS_STOREFRONT_CSS}</style>`;

/** Ensure saved HTML includes storefront-protective CSS (idempotent). */
export function ensureAdditionalTextCardsStorefrontStyles(html: string): string {
  const trimmed = (html ?? "").trim();
  if (!trimmed) return "";
  const hasBlocks =
    trimmed.includes("atb-nic-cards") ||
    trimmed.includes("atb-nic-card") ||
    trimmed.includes("atb-flavour-cards") ||
    trimmed.includes("atb-flavour-card");
  if (!hasBlocks) return trimmed;

  const withoutOld = trimmed
    .replace(/<style[^>]*data-atb-cards-css=["']1["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .trim();
  // Trailing empty paragraph so editors can click below the card grid.
  const withCaretTarget = /<\/p>\s*$/i.test(withoutOld)
    ? withoutOld
    : `${withoutOld}\n<p>&nbsp;</p>`;
  return `${ADDITIONAL_TEXT_CARDS_STYLE_TAG}\n${withCaretTarget}`;
}

/** Injected into FormCKEditor — beats generic .ck-content rules. */
export const ADDITIONAL_TEXT_CARDS_EDITOR_CSS = `
  .ck-content .atb-nic-cards {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 16px !important;
    align-items: stretch !important;
    width: 100% !important;
    margin: 0 0 32px 0 !important;
    padding: 0 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    box-sizing: border-box !important;
  }
  .ck-content .atb-nic-card {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    border: 1px solid ${BORDER} !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06) !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    text-align: left !important;
  }
  .ck-content .atb-nic-card__media {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 20px 16px 16px 16px !important;
    border-bottom: 1px solid ${BORDER} !important;
    box-sizing: border-box !important;
    flex-shrink: 0 !important;
    text-align: center !important;
  }
  .ck-content .atb-nic-card__img,
  .ck-content .atb-nic-card img.atb-nic-card__img,
  .ck-content .atb-nic-card__media img {
    display: block !important;
    width: 160px !important;
    max-width: 160px !important;
    height: auto !important;
    aspect-ratio: ${ATB_NIC_IMAGE_ASPECT_RATIO} !important;
    object-fit: contain !important;
    object-position: center center !important;
    margin: 0 auto !important;
    padding: 0 !important;
    background: #f1f5f9 !important;
    border: 0 !important;
    border-radius: 0 !important;
  }
  .ck-content .atb-nic-card__media figure,
  .ck-content .atb-nic-card__media .image,
  .ck-content .atb-nic-card__media figure.image {
    display: block !important;
    width: 160px !important;
    max-width: 160px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    aspect-ratio: ${ATB_NIC_IMAGE_ASPECT_RATIO} !important;
    overflow: hidden !important;
    background: #f1f5f9 !important;
  }
  .ck-content .atb-nic-card__media figure img,
  .ck-content .atb-nic-card__media .image img {
    margin: 0 !important;
    width: 100% !important;
    height: 100% !important;
    aspect-ratio: auto !important;
    object-fit: contain !important;
  }
  .ck-content .atb-nic-card__body {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 auto !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 20px !important;
    box-sizing: border-box !important;
  }
  .ck-content .atb-nic-card h3,
  .ck-content .atb-nic-card .atb-nic-card__title {
    display: block !important;
    margin: 0 0 10px 0 !important;
    font-size: 18px !important;
    line-height: 1.3 !important;
    font-weight: 700 !important;
    color: ${TEXT_DARK} !important;
  }
  .ck-content .atb-nic-card p,
  .ck-content .atb-nic-card .atb-nic-card__desc {
    display: block !important;
    margin: 0 0 16px 0 !important;
    font-size: 14px !important;
    line-height: 1.55 !important;
    font-weight: 400 !important;
    color: ${TEXT_MUTED} !important;
    flex: 1 1 auto !important;
  }
  .ck-content .atb-nic-card__footer {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    margin-top: auto !important;
    padding-top: 0 !important;
    border-top: 0 !important;
    width: 100% !important;
  }
  .ck-content .atb-nic-card__btn-row {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    border: 1px solid ${BORDER} !important;
    border-radius: 8px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .ck-content .atb-nic-card__btn,
  .ck-content .atb-nic-card a.atb-nic-card__btn,
  .ck-content .atb-nic-card__btn-row a {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 12px 14px !important;
    background: transparent !important;
    border: 0 !important;
    border-radius: 0 !important;
    color: ${SHOP_LINK} !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    line-height: 1.3 !important;
  }
  .ck-content .atb-nic-card__btn-arrow {
    display: inline-block !important;
    color: #94a3b8 !important;
    font-weight: 400 !important;
    margin-left: 8px !important;
    flex-shrink: 0 !important;
  }
  .ck-content .atb-flavour-cards {
    display: grid !important;
    grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
    gap: 28px !important;
    column-gap: 28px !important;
    row-gap: 28px !important;
    align-items: stretch !important;
    width: 100% !important;
    margin: 0 0 32px 0 !important;
    padding: 0 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    box-sizing: border-box !important;
  }
  .ck-content .atb-flavour-card {
    display: grid !important;
    grid-template-rows: auto 1fr auto !important;
    grid-template-columns: minmax(0, 1fr) !important;
    position: relative !important;
    float: none !important;
    align-self: stretch !important;
    height: 100% !important;
    min-height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    border: 1px solid ${BORDER} !important;
    border-radius: 12px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) !important;
    box-sizing: border-box !important;
    overflow: visible !important;
    text-align: left !important;
  }
  .ck-content .atb-flavour-card__media {
    display: block !important;
    grid-row: 1 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 20px 16px 16px 16px !important;
    border-bottom: 1px solid ${BORDER} !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }
  .ck-content .atb-flavour-card__img,
  .ck-content .atb-flavour-card img.atb-flavour-card__img,
  .ck-content .atb-flavour-card__media img {
    display: block !important;
    width: 125px !important;
    max-width: 125px !important;
    height: auto !important;
    aspect-ratio: ${ATB_FLAVOUR_IMAGE_ASPECT_RATIO} !important;
    object-fit: contain !important;
    object-position: center center !important;
    margin: 0 auto !important;
    padding: 0 !important;
    background: #f1f5f9 !important;
    border: 0 !important;
    border-radius: 0 !important;
  }
  .ck-content .atb-flavour-card__media figure,
  .ck-content .atb-flavour-card__media .image,
  .ck-content .atb-flavour-card__media figure.image {
    display: block !important;
    width: 125px !important;
    max-width: 125px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    aspect-ratio: ${ATB_FLAVOUR_IMAGE_ASPECT_RATIO} !important;
    overflow: hidden !important;
    background: #f1f5f9 !important;
  }
  .ck-content .atb-flavour-card__media figure img,
  .ck-content .atb-flavour-card__media .image img {
    margin: 0 !important;
    width: 100% !important;
    height: 100% !important;
    aspect-ratio: auto !important;
    object-fit: contain !important;
  }
  .ck-content .atb-flavour-card__body {
    display: block !important;
    grid-row: 2 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 16px 16px 0 16px !important;
    box-sizing: border-box !important;
    min-height: 0 !important;
  }
  .ck-content .atb-flavour-card h3,
  .ck-content .atb-flavour-card .atb-flavour-card__title {
    display: block !important;
    margin: 0 0 10px 0 !important;
    font-size: 16px !important;
    line-height: 1.3 !important;
    font-weight: 700 !important;
    color: ${TEXT_DARK} !important;
  }
  .ck-content .atb-flavour-card p,
  .ck-content .atb-flavour-card .atb-flavour-card__desc {
    display: block !important;
    margin: 0 !important;
    font-size: 14px !important;
    line-height: 1.55 !important;
    font-weight: 400 !important;
    color: ${TEXT_MUTED} !important;
  }
  .ck-content .atb-flavour-card__footer {
    display: block !important;
    grid-row: 3 !important;
    margin: 0 !important;
    padding: 16px 16px 20px 16px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    align-self: end !important;
  }
  .ck-content .atb-flavour-card__link,
  .ck-content .atb-flavour-card a.atb-flavour-card__link {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    color: ${SHOP_LINK} !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    text-decoration: none !important;
    line-height: 1.3 !important;
  }
`;

const TEMPLATE_ICON_4 =
  '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="45" height="45" rx="6" fill="#A5E7EB"/><g fill="#0F172A"><rect x="6" y="14" width="7" height="18" rx="2"/><rect x="15" y="14" width="7" height="18" rx="2"/><rect x="24" y="14" width="7" height="18" rx="2"/><rect x="33" y="14" width="6" height="18" rx="2"/></g></svg>';

const TEMPLATE_ICON_6 =
  '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="45" height="45" rx="6" fill="#A5E7EB"/><g fill="#0F172A"><circle cx="11" cy="16" r="4"/><circle cx="22.5" cy="16" r="4"/><circle cx="34" cy="16" r="4"/><circle cx="11" cy="29" r="4"/><circle cx="22.5" cy="29" r="4"/><circle cx="34" cy="29" r="4"/></g></svg>';

const nicPlaceholderImg = (slot: string, alt: string) =>
  `<img class="atb-nic-card__img atb-nic-card__img-placeholder atb-nic-card__img--${slot}" data-atb-nic-img="${slot}" data-atb-nic-placeholder="1" data-type-card-img="${slot}" src="${typeCardPlaceholderSrc(slot)}" alt="${alt}" style="${ATB_NIC_IMG_INLINE_STYLE}background:#f1f5f9!important;" title="Use Edit image on the toolbar to replace" />`;

const nicBtn = (label: string, href = "#") =>
  `<div class="atb-nic-card__btn-row" style="display:block;width:100%;margin:0;padding:0;background:#fff;border:1px solid ${BORDER};border-radius:8px;box-sizing:border-box;overflow:hidden;">` +
  `<a class="atb-nic-card__btn" href="${href}" style="display:flex;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;padding:12px 14px;background:transparent;border:0;color:${SHOP_LINK};font-size:14px;font-weight:600;text-decoration:none;line-height:1.3;">` +
  `<span>${label}</span><span class="atb-nic-card__btn-arrow" style="color:#94a3b8;font-weight:400;margin-left:8px;">→</span></a>` +
  `</div>`;

const nicCard = (opts: {
  slot: string;
  title: string;
  description: string;
  buttons: { label: string; href?: string }[];
}) =>
  `<article class="atb-nic-card" style="display:flex;flex-direction:column;height:100%;min-height:100%;margin:0;padding:0;background:#fff;border:1px solid ${BORDER};border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.06);box-sizing:border-box;overflow:hidden;text-align:left;">` +
  `<div class="atb-nic-card__media" style="display:block;width:100%;margin:0;padding:16px 16px 0 16px;border-bottom:1px solid ${BORDER};box-sizing:border-box;">` +
  nicPlaceholderImg(opts.slot, opts.title) +
  `</div>` +
  `<div class="atb-nic-card__body" style="display:flex;flex-direction:column;flex:1 1 auto;width:100%;margin:0;padding:20px;box-sizing:border-box;">` +
  `<h3 class="atb-nic-card__title" style="display:block;margin:0 0 10px 0;font-size:18px;line-height:1.3;font-weight:700;color:${TEXT_DARK};">${opts.title}</h3>` +
  `<p class="atb-nic-card__desc" style="display:block;margin:0 0 16px 0;font-size:14px;line-height:1.55;font-weight:400;color:${TEXT_MUTED};flex:1 1 auto;">${opts.description}</p>` +
  `<div class="atb-nic-card__footer" style="display:flex;flex-direction:column;gap:10px;margin-top:auto;padding-top:0;width:100%;">` +
  opts.buttons.map((b) => nicBtn(b.label, b.href)).join("") +
  `</div></div></article>`;

const flavourPlaceholderImg = (slot: string, alt: string) =>
  `<img class="atb-flavour-card__img atb-flavour-card__img-placeholder atb-flavour-card__img--${slot}" data-atb-flavour-img="${slot}" data-atb-flavour-placeholder="1" data-type-card-img="${slot}" src="${typeCardPlaceholderSrc(slot)}" alt="${alt}" style="${ATB_FLAVOUR_IMG_INLINE_STYLE}background:#f1f5f9!important;" title="Use Edit image on the toolbar to replace" />`;

const flavourCard = (opts: {
  slot: string;
  title: string;
  description: string;
  linkLabel: string;
  href?: string;
}) =>
  `<article class="atb-flavour-card" style="display:grid;grid-template-rows:auto 1fr auto;grid-template-columns:minmax(0,1fr);align-self:stretch;height:100%;min-height:100%;margin:0;padding:0;background:#fff;border:1px solid ${BORDER};border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.04);box-sizing:border-box;overflow:hidden;text-align:left;">` +
  `<div class="atb-flavour-card__media" style="display:block;grid-row:1;width:100%;margin:0;padding:20px 16px 16px 16px;border-bottom:1px solid ${BORDER};box-sizing:border-box;text-align:center;">` +
  flavourPlaceholderImg(opts.slot, opts.title) +
  `</div>` +
  `<div class="atb-flavour-card__body" style="display:block;grid-row:2;width:100%;margin:0;padding:16px 16px 0 16px;box-sizing:border-box;min-height:0;">` +
  `<h3 class="atb-flavour-card__title" style="display:block;margin:0 0 10px 0;font-size:16px;line-height:1.3;font-weight:700;color:${TEXT_DARK};">${opts.title}</h3>` +
  `<p class="atb-flavour-card__desc" style="display:block;margin:0;font-size:14px;line-height:1.55;font-weight:400;color:${TEXT_MUTED};">${opts.description}</p>` +
  `</div>` +
  `<div class="atb-flavour-card__footer" style="display:block;grid-row:3;margin:0;padding:16px 16px 20px 16px;width:100%;box-sizing:border-box;align-self:end;">` +
  `<a class="atb-flavour-card__link" href="${opts.href ?? "#"}" style="display:block;margin:0;padding:0;color:${SHOP_LINK};font-size:14px;font-weight:700;text-decoration:none;line-height:1.3;">${opts.linkLabel}</a>` +
  `</div></article>`;

export const NICOTINE_STRENGTH_CARDS_4COL_TEMPLATE = {
  title: "Nicotine Strength Cards (4-col)",
  description:
    "Insert 4 nicotine-strength guide cards with editable 250×250 images and shop buttons",
  icon: TEMPLATE_ICON_4,
  data:
    ADDITIONAL_TEXT_CARDS_STYLE_TAG +
    `<section class="atb-nic-cards" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:stretch;width:100%;margin:0 0 32px 0;padding:0;box-sizing:border-box;">` +
    nicCard({
      slot: "nic-0",
      title: "Light Smoker (1–5 cigarettes per day)",
      description:
        "A lower strength is usually a good place to start if you were a light smoker. These options give a gentle nicotine hit while still delivering solid flavour.",
      buttons: [
        { label: "Shop 3mg freebase" },
        { label: "Shop 5mg nic salts" },
      ],
    }) +
    nicCard({
      slot: "nic-1",
      title: "Moderate smoker (up to 10–14 cigarettes per day)",
      description:
        "A mid-range strength suits people who smoked regularly. These options are popular everyday choices for balanced nicotine and flavour.",
      buttons: [
        { label: "Shop 6mg freebase" },
        { label: "Shop 10mg nic salts" },
      ],
    }) +
    nicCard({
      slot: "nic-2",
      title: "Heavy smoker (15+ cigarettes per day)",
      description:
        "Higher strengths are often better if you smoked heavily and want something closer to cigarette satisfaction when switching.",
      buttons: [
        { label: "Shop 12mg freebase" },
        { label: "Shop 20mg nic salts" },
      ],
    }) +
    nicCard({
      slot: "nic-3",
      title: "0mg Nicotine-Free Vape Juice",
      description:
        "Choose 0mg if you want flavour without nicotine, or if you're using shortfills and prefer to add your own nic shot.",
      buttons: [{ label: "Shop nicotine-free e-liquids" }],
    }) +
    `</section><p>&nbsp;</p>`,
} as const;

export const FLAVOUR_CATEGORY_CARDS_6COL_TEMPLATE = {
  title: "Flavour Category Cards (6-col)",
  description:
    "Insert 6 flavour category cards with editable 250×250 images and shop links",
  icon: TEMPLATE_ICON_6,
  data:
    ADDITIONAL_TEXT_CARDS_STYLE_TAG +
    `<section class="atb-flavour-cards" style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:28px;column-gap:28px;row-gap:28px;align-items:stretch;width:100%;margin:0 0 32px 0;padding:0;box-sizing:border-box;">` +
    flavourCard({
      slot: "flav-0",
      title: "Fruit flavours",
      description:
        "Bright, juicy and refreshing. Fruit e-liquids cover everything from classic strawberry and mango to mixed berry blends.",
      linkLabel: "Shop fruit e-liquids",
    }) +
    flavourCard({
      slot: "flav-1",
      title: "Menthol and ice flavours",
      description:
        "Cool, crisp and clean. Menthol and ice e-liquids deliver a fresh inhale with minty or iced-fruit profiles.",
      linkLabel: "Shop menthol e-liquids",
    }) +
    flavourCard({
      slot: "flav-2",
      title: "Tobacco flavours",
      description:
        "Classic and familiar. Tobacco e-liquids range from mild everyday blends to richer, deeper profiles.",
      linkLabel: "Shop tobacco e-liquids",
    }) +
    flavourCard({
      slot: "flav-3",
      title: "Dessert and sweet flavours",
      description:
        "Indulgent and comforting. Dessert e-liquids include custards, cakes, creams and other sweet treats.",
      linkLabel: "Shop dessert e-liquids",
    }) +
    flavourCard({
      slot: "flav-4",
      title: "Drink and soda flavours",
      description:
        "Fizzy, creamy or iced. Drink-inspired e-liquids recreate sodas, coffees, energy drinks and more.",
      linkLabel: "Shop soda e-liquids",
    }) +
    flavourCard({
      slot: "flav-5",
      title: "Sweet and candy flavours",
      description:
        "Bold and playful. Candy e-liquids bring soft sweets, hard-boiled classics and sugary favourites.",
      linkLabel: "Shop candy e-liquids",
    }) +
    `</section><p>&nbsp;</p>`,
} as const;

export const ADDITIONAL_TEXT_CARD_TEMPLATES = [
  NICOTINE_STRENGTH_CARDS_4COL_TEMPLATE,
  FLAVOUR_CATEGORY_CARDS_6COL_TEMPLATE,
] as const;
