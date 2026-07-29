/** CKEditor Template + styles for Related Collections type cards. */

const ACCENT = {
  teal: "#14b8a6",
  orange: "#f59e0b",
  green: "#22c55e",
  purple: "#a855f7",
} as const;

type AccentKey = keyof typeof ACCENT;

/** Compact SVG placeholder — image (not editable text). Safe tiny data URI for storefront HTML. */
export const TYPE_CARD_NO_IMAGE_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150"><rect width="400" height="150" fill="#f1f5f9"/><g fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="155" y="32" width="90" height="68" rx="6"/><circle cx="182" cy="54" r="8"/><path d="M165 88l22-20 14 12 18-22 26 30H165z"/></g><text x="200" y="128" text-anchor="middle" fill="#94a3b8" font-family="Arial,Helvetica,sans-serif" font-size="14">No image</text></svg>`
  );

/**
 * Embedded in saved `type_cards_html` so the customer storefront keeps layout
 * even when theme/prose CSS overrides images, paragraphs, and lists.
 */
export const TYPE_CARDS_STOREFRONT_CSS = `
.type-cards{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important;align-items:stretch!important;width:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important;font-family:Arial,Helvetica,sans-serif!important}
.type-cards *,.type-cards *::before,.type-cards *::after{box-sizing:border-box!important}
.type-card{display:flex!important;flex-direction:column!important;position:relative!important;float:none!important;height:100%!important;min-height:100%!important;margin:0!important;padding:16px!important;background:#fff!important;border:1px solid #e2e8f0!important;border-radius:10px!important;box-shadow:0 1px 3px rgba(15,23,42,.06)!important;overflow:hidden!important;transform:none!important}
.type-card--teal{border-top:4px solid #14b8a6!important}
.type-card--orange{border-top:4px solid #f59e0b!important}
.type-card--green{border-top:4px solid #22c55e!important}
.type-card--purple{border-top:4px solid #a855f7!important}
.type-card__body{display:block!important;flex:1 1 auto!important;position:static!important;float:none!important;width:100%!important;margin:0!important;padding:0!important;transform:none!important}
.type-card__footer{display:block!important;margin-top:auto!important;padding-top:16px!important;width:100%!important;position:static!important;float:none!important}
.type-cards figure,.type-cards .image,.type-cards figure.image{display:block!important;position:static!important;float:none!important;width:100%!important;max-width:100%!important;margin:0 0 14px 0!important;padding:0!important;transform:none!important}
.type-cards img,.type-card img{display:block!important;position:static!important;float:none!important;width:100%!important;max-width:100%!important;height:150px!important;object-fit:contain!important;margin:0 0 14px 0!important;padding:0!important;background:#fff!important;transform:none!important;inset:auto!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;z-index:auto!important}
.type-card p,.type-card h3,.type-card__label,.type-card__badge,.type-card ul,.type-card li,.type-card a{position:static!important;float:none!important;transform:none!important;inset:auto!important;z-index:auto!important;max-width:100%!important}
.type-card__label{display:block!important;margin:0 0 6px 0!important;font-size:11px!important;font-weight:800!important;letter-spacing:.08em!important;text-transform:uppercase!important;line-height:1.3!important}
.type-card__label--teal{color:#14b8a6!important}
.type-card__label--orange{color:#f59e0b!important}
.type-card__label--green{color:#22c55e!important}
.type-card__label--purple{color:#a855f7!important}
.type-card h3{display:block!important;margin:0 0 8px 0!important;font-size:20px!important;line-height:1.25!important;font-weight:800!important;color:#0f172a!important}
.type-card p:not(.type-card__label){display:block!important;margin:0 0 12px 0!important;font-size:14px!important;line-height:1.55!important;color:#475569!important;font-weight:400!important}
.type-card__badge{display:inline-block!important;background:#1a202c!important;background-color:#1a202c!important;color:#fff!important;font-size:12px!important;font-weight:700!important;padding:5px 12px!important;border-radius:16px!important;margin:0 0 12px 0!important;line-height:1.25!important;overflow:hidden!important;border:0!important;box-shadow:none!important}
.type-card__badge span,.type-card__badge > *{background:transparent!important;background-color:transparent!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:inherit!important}
.type-card ul{display:block!important;list-style:none!important;margin:0!important;padding:0 0 0 18px!important}
.type-card li{display:block!important;position:relative!important;list-style:none!important;margin:0 0 8px 0!important;padding-left:4px!important;font-size:14px!important;line-height:1.5!important;color:#334155!important}
.type-card li:last-child{margin-bottom:0!important}
.type-card li::marker{content:""!important;font-size:0!important}
.type-card--teal li::before,.type-card li .type-card__dot--teal{background:#14b8a6!important}
.type-card--orange li::before,.type-card li .type-card__dot--orange{background:#f59e0b!important}
.type-card--green li::before,.type-card li .type-card__dot--green{background:#22c55e!important}
.type-card--purple li::before,.type-card li .type-card__dot--purple{background:#a855f7!important}
.type-card li::before{content:""!important;position:absolute!important;left:-14px!important;top:7px!important;width:7px!important;height:7px!important;border-radius:50%!important;display:block!important}
.type-card .type-card__dot{display:none!important}
.type-card__btn,.type-card a.type-card__btn{display:block!important;width:100%!important;box-sizing:border-box!important;text-align:center!important;background:linear-gradient(90deg,#083122 0%,#035335 50%,#083122 100%)!important;color:#fff!important;text-decoration:none!important;padding:12px 14px!important;border-radius:6px!important;font-weight:800!important;font-size:14px!important;border:1px solid #083122!important}
@media (max-width:900px){.type-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media (max-width:560px){.type-cards{grid-template-columns:1fr!important}}
`.replace(/\s+/g, " ").trim();

export const TYPE_CARDS_STYLE_TAG = `<style data-type-cards-css="1">${TYPE_CARDS_STOREFRONT_CSS}</style>`;

/** Ensure saved HTML includes storefront-protective CSS (idempotent). */
export function ensureTypeCardsStorefrontStyles(html: string): string {
  const trimmed = (html ?? "").trim();
  if (!trimmed) return "";
  if (!trimmed.includes("type-cards") && !trimmed.includes("type-card")) {
    return trimmed;
  }
  const withoutOld = trimmed.replace(
    /<style[^>]*data-type-cards-css=["']1["'][^>]*>[\s\S]*?<\/style>/gi,
    ""
  ).trim();
  return `${TYPE_CARDS_STYLE_TAG}\n${withoutOld}`;
}

/** Injected into FormCKEditor — must beat generic .ck-content p / list / span rules. */
export const RELATED_COLLECTION_CARDS_CSS = `
  .ck-content .type-cards {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 16px !important;
    align-items: stretch !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    box-sizing: border-box !important;
  }
  .ck-content .type-card {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
    margin: 0 !important;
    padding: 16px !important;
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 10px !important;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06) !important;
    box-sizing: border-box !important;
    overflow: visible !important;
  }
  .ck-content .type-card--teal { border-top: 4px solid ${ACCENT.teal} !important; }
  .ck-content .type-card--orange { border-top: 4px solid ${ACCENT.orange} !important; }
  .ck-content .type-card--green { border-top: 4px solid ${ACCENT.green} !important; }
  .ck-content .type-card--purple { border-top: 4px solid ${ACCENT.purple} !important; }
  .ck-content .type-card__body {
    display: block !important;
    flex: 1 1 auto !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .ck-content .type-card__footer {
    display: block !important;
    margin-top: auto !important;
    width: 100% !important;
    padding-top: 16px !important;
  }
  .ck-content .type-card img,
  .ck-content .type-card img.type-card__img-placeholder {
    display: block !important;
    width: 100% !important;
    height: 150px !important;
    object-fit: contain !important;
    margin: 0 0 14px 0 !important;
    background: #f1f5f9 !important;
    box-sizing: border-box !important;
    cursor: pointer !important;
    user-select: none !important;
  }
  .ck-content .type-card img.type-card__img-placeholder:hover,
  .ck-content .type-card img[data-type-card-placeholder="1"]:hover {
    outline: 2px solid #94a3b8 !important;
    outline-offset: -2px !important;
  }
  .ck-content .type-card img[data-type-card-img] {
    cursor: pointer !important;
  }
  .ck-content .type-card h3 {
    display: block !important;
    margin: 0 0 8px 0 !important;
    font-size: 20px !important;
    line-height: 1.25 !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    width: 100% !important;
  }
  /* Body copy only — do not color labels */
  .ck-content .type-card p:not(.type-card__label) {
    display: block !important;
    margin: 0 0 12px 0 !important;
    font-size: 14px !important;
    line-height: 1.55 !important;
    color: #475569 !important;
    font-weight: 400 !important;
    width: 100% !important;
  }
  .ck-content .type-card p.type-card__label,
  .ck-content .type-card .type-card__label {
    display: block !important;
    margin: 0 0 6px 0 !important;
    padding: 0 !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    line-height: 1.3 !important;
    width: auto !important;
  }
  .ck-content .type-card p.type-card__label--teal,
  .ck-content .type-card .type-card__label--teal { color: ${ACCENT.teal} !important; }
  .ck-content .type-card p.type-card__label--orange,
  .ck-content .type-card .type-card__label--orange { color: ${ACCENT.orange} !important; }
  .ck-content .type-card p.type-card__label--green,
  .ck-content .type-card .type-card__label--green { color: ${ACCENT.green} !important; }
  .ck-content .type-card p.type-card__label--purple,
  .ck-content .type-card .type-card__label--purple { color: ${ACCENT.purple} !important; }
  .ck-content .type-card .type-card__badge {
    display: inline-block !important;
    background: #1a202c !important;
    background-color: #1a202c !important;
    background-image: none !important;
    color: #ffffff !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    padding: 5px 12px !important;
    border-radius: 16px !important;
    margin: 0 0 12px 0 !important;
    line-height: 1.25 !important;
    width: auto !important;
    max-width: 100% !important;
    overflow: hidden !important;
    vertical-align: middle !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
  }
  /* CKEditor often wraps styled text in an inner span with the same background — kill the double layer */
  .ck-content .type-card .type-card__badge span,
  .ck-content .type-card .type-card__badge > * {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: inherit !important;
  }
  /* If CKEditor wraps the badge itself, strip the outer copy of the background */
  .ck-content .type-card span:has(> .type-card__badge),
  .ck-content .type-card [style*="background"]:has(> .type-card__badge) {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
  .ck-content .type-card ul {
    display: block !important;
    list-style: none !important;
    list-style-type: none !important;
    margin: 0 !important;
    padding: 0 0 0 18px !important;
    width: auto !important;
  }
  .ck-content .type-card li {
    position: relative !important;
    display: block !important;
    list-style: none !important;
    list-style-type: none !important;
    margin: 0 0 8px 0 !important;
    padding-left: 4px !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    color: #334155 !important;
    font-weight: 400 !important;
    width: auto !important;
  }
  .ck-content .type-card li:last-child {
    margin-bottom: 0 !important;
  }
  .ck-content .type-card li::marker {
    content: "" !important;
    font-size: 0 !important;
    color: transparent !important;
  }
  /* Colored dots — ::before survives CKEditor empty-span stripping */
  .ck-content .type-card li::before {
    content: "" !important;
    position: absolute !important;
    left: -14px !important;
    top: 7px !important;
    width: 7px !important;
    height: 7px !important;
    border-radius: 50% !important;
    display: block !important;
  }
  .ck-content .type-card--teal li::before { background: ${ACCENT.teal} !important; }
  .ck-content .type-card--orange li::before { background: ${ACCENT.orange} !important; }
  .ck-content .type-card--green li::before { background: ${ACCENT.green} !important; }
  .ck-content .type-card--purple li::before { background: ${ACCENT.purple} !important; }
  /* Hide inline dots in editor when ::before is used (avoid double bullets) */
  .ck-content .type-card .type-card__dot {
    display: none !important;
  }
  .ck-content .type-card__btn,
  .ck-content .type-card a.type-card__btn,
  .ck-content .type-card__btn:link,
  .ck-content .type-card__btn:visited {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: center !important;
    background: linear-gradient(90deg, #083122 0%, #035335 50%, #083122 100%) !important;
    color: #ffffff !important;
    text-decoration: none !important;
    padding: 12px 14px !important;
    border-radius: 6px !important;
    font-weight: 800 !important;
    font-size: 14px !important;
    border: 1px solid #083122 !important;
  }
`;

const card = (
  variant: AccentKey,
  opts: {
    imgAlt: string;
    label: string;
    title: string;
    description: string;
    badge: string;
    bullets: string[];
    cta: string;
    href: string;
  }
) => {
  const accent = ACCENT[variant];
  // Inline span dots for storefront (no admin CSS). &nbsp; keeps empty spans from being stripped.
  const bulletsHtml = opts.bullets
    .map(
      (b, i) =>
        `<li style="position:relative;margin:0 0 ${i === opts.bullets.length - 1 ? 0 : 8}px 0;padding-left:4px;font-size:14px;line-height:1.5;color:#334155;list-style:none;"><span class="type-card__dot type-card__dot--${variant}" style="position:absolute;left:-14px;top:7px;width:7px;height:7px;border-radius:50%;background:${accent};display:inline-block;">&nbsp;</span>${b}</li>`
    )
    .join("");

  return (
    `<article class="type-card type-card--${variant}" style="display:flex;flex-direction:column;height:100%;min-height:100%;background:#ffffff;border:1px solid #e2e8f0;border-top:4px solid ${accent};border-radius:10px;box-shadow:0 1px 3px rgba(15,23,42,.06);padding:16px;box-sizing:border-box;margin:0;overflow:hidden;">` +
    `<div class="type-card__body" style="flex:1 1 auto;width:100%;">` +
    `<img class="type-card__img-placeholder" data-type-card-img="${variant}" data-type-card-placeholder="1" src="${TYPE_CARD_NO_IMAGE_SRC}" alt="${opts.imgAlt}" title="Click to upload image" style="display:block!important;position:static!important;float:none!important;width:100%!important;height:150px!important;object-fit:contain!important;margin:0 0 14px 0!important;background:#f1f5f9;cursor:pointer;" />` +
    `<p class="type-card__label type-card__label--${variant}" style="display:block!important;position:static!important;margin:0 0 6px 0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${accent};line-height:1.3;">${opts.label}</p>` +
    `<h3 style="display:block!important;position:static!important;margin:0 0 8px 0;font-size:20px;line-height:1.25;font-weight:800;color:#0f172a;">${opts.title}</h3>` +
    `<p style="display:block!important;position:static!important;margin:0 0 12px 0;font-size:14px;line-height:1.55;color:#475569;">${opts.description}</p>` +
    `<div class="type-card__badge" style="display:inline-block;background-color:#1a202c;color:#ffffff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:16px;margin:0 0 12px 0;line-height:1.25;overflow:hidden;vertical-align:middle;border:0;">${opts.badge}</div>` +
    `<ul style="margin:0;padding:0 0 0 18px;list-style:none;">${bulletsHtml}</ul>` +
    `</div>` +
    `<div class="type-card__footer" style="margin-top:auto;padding-top:16px;width:100%;">` +
    `<a class="type-card__btn" href="${opts.href}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(90deg, #083122 0%, #035335 50%, #083122 100%);color:#ffffff !important;text-decoration:none !important;padding:12px 14px;border-radius:6px;font-weight:800;font-size:14px;border:1px solid #083122;">${opts.cta}</a>` +
    `</div>` +
    `</article>`
  );
};

export const CATEGORY_CARDS_4COL_TEMPLATE = {
  title: "Category Cards (4-col)",
  description:
    "Insert 4 equal-height category cards with aligned CTA buttons",
  icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="33" height="33" rx="6" fill="#A5E7EB" /><g fill="#0F172A"><rect x="11" y="13" width="7" height="7" rx="2"/><rect x="19" y="13" width="7" height="7" rx="2"/><rect x="27" y="13" width="7" height="7" rx="2"/><rect x="11" y="21" width="7" height="7" rx="2"/><rect x="19" y="21" width="7" height="7" rx="2"/><rect x="27" y="21" width="7" height="7" rx="2"/></g></svg>',
  data:
    TYPE_CARDS_STYLE_TAG +
    `<section class="type-cards" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:stretch;width:100%;margin:0;padding:0;box-sizing:border-box;">` +
    card("teal", {
      imgAlt: "50-50 E-Liquids",
      label: "FOR MTL VAPERS",
      title: "50-50 E-Liquids",
      description:
        "50/50 e-liquids are one of the easiest places to start. They work well in most mouth-to-lung kits and give a balanced throat hit with clear flavour.",
      badge: "Easy everyday choice",
      bullets: [
        "Designed for MTL vape kits and starter devices",
        "Available with freebase or nicotine salt options",
        "Balanced VG/PG for everyday vaping",
      ],
      cta: "Shop 50/50 e-liquids",
      href: "#",
    }) +
    card("orange", {
      imgAlt: "Nic Salt E-Liquids",
      label: "SMOOTHER INHALES",
      title: "Nic Salt E-Liquids",
      description:
        "Nic salt e-liquids are made for smooth nicotine satisfaction with less throat hit, ideal for pods and compact MTL devices.",
      badge: "Most popular type for MTL",
      bullets: [
        "Smoother inhale than freebase at higher strengths",
        "Great for pod systems and refillable kits",
        "Fast nicotine satisfaction with clear flavour",
      ],
      cta: "Shop nic salt e-liquids",
      href: "#",
    }) +
    card("green", {
      imgAlt: "High VG E-Liquids",
      label: "SUB-OHM &amp; DTL VAPING",
      title: "High VG E-Liquids",
      description:
        "High VG e-liquids are thicker juices made for bigger clouds and smoother direct-to-lung draws on sub-ohm kits.",
      badge: "Best for dense clouds",
      bullets: [
        "Built for DTL / sub-ohm devices",
        "Thicker vapour and smoother inhale",
        "Usually lower nicotine strengths",
      ],
      cta: "Shop high VG e-liquids",
      href: "#",
    }) +
    card("purple", {
      imgAlt: "Shortfill E-Liquids",
      label: "LARGER BOTTLES",
      title: "Shortfill E-Liquids",
      description:
        "Shortfills are larger bottles of nicotine-free e-liquid. Add a nic shot to set your preferred strength and get better value.",
      badge: "0mg E-Liquids",
      bullets: [
        "Nicotine-free base ready to mix",
        "Choose your own nicotine strength",
        "Larger bottles for better value",
      ],
      cta: "Shop Shortfill E-Liquids",
      href: "#",
    }) +
    `</section>`,
} as const;
