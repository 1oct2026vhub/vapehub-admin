/** CKEditor Template + styles for Related Collections only. */

export const RELATED_COLLECTION_CARDS_CSS = `
  .ck-content .vss-related-cards {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: stretch !important;
    gap: 16px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    box-sizing: border-box !important;
  }
  .ck-content .vss-related-card {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 1 calc(25% - 12px) !important;
    min-width: 200px !important;
    max-width: 100% !important;
    width: auto !important;
    margin: 0 !important;
    padding: 16px !important;
    background: #fff !important;
    border: 1px solid #e7e7e7 !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,.06) !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .ck-content .vss-related-card--green { border-top: 4px solid #22c55e !important; }
  .ck-content .vss-related-card--orange { border-top: 4px solid #f97316 !important; }
  .ck-content .vss-related-card--lime { border-top: 4px solid #84cc16 !important; }
  .ck-content .vss-related-card--purple { border-top: 4px solid #a855f7 !important; }
  .ck-content .vss-related-card__body {
    display: block !important;
    flex: 1 1 auto !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .ck-content .vss-related-card__footer {
    display: block !important;
    margin-top: auto !important;
    width: 100% !important;
    padding-top: 8px !important;
  }
  .ck-content .vss-related-card img {
    display: block !important;
    width: 100% !important;
    height: 140px !important;
    object-fit: contain !important;
    margin: 0 0 12px 0 !important;
    background: #fff !important;
  }
  .ck-content .vss-related-card__label {
    display: block !important;
    margin: 0 0 6px 0 !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: .06em !important;
    text-transform: uppercase !important;
    width: auto !important;
  }
  .ck-content .vss-related-card__label--green { color: #22c55e !important; }
  .ck-content .vss-related-card__label--orange { color: #f97316 !important; }
  .ck-content .vss-related-card__label--lime { color: #84cc16 !important; }
  .ck-content .vss-related-card__label--purple { color: #a855f7 !important; }
  .ck-content .vss-related-card h3 {
    display: block !important;
    margin: 0 0 8px 0 !important;
    font-size: 18px !important;
    line-height: 1.25 !important;
    color: #111 !important;
    font-weight: 700 !important;
    width: 100% !important;
  }
  .ck-content .vss-related-card p {
    display: block !important;
    margin: 0 0 12px 0 !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    color: #444 !important;
    width: 100% !important;
  }
  .ck-content .vss-related-card__badge {
    display: inline-block !important;
    background: #333 !important;
    color: #fff !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    padding: 4px 10px !important;
    border-radius: 4px !important;
    margin: 0 0 12px 0 !important;
    width: auto !important;
  }
  .ck-content .vss-related-card ul {
    display: block !important;
    list-style-type: disc !important;
    margin: 0 0 8px 0 !important;
    padding-left: 18px !important;
    width: auto !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
    color: #333 !important;
  }
  .ck-content .vss-related-card li {
    display: list-item !important;
    list-style-type: disc !important;
    list-style-position: outside !important;
    margin: 0 0 4px 0 !important;
    width: auto !important;
  }
  .ck-content .vss-related-card__btn,
  .ck-content .vss-related-card__btn:link,
  .ck-content .vss-related-card__btn:visited {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: center !important;
    background: #0d9488 !important;
    color: #fff !important;
    text-decoration: none !important;
    padding: 12px 14px !important;
    border-radius: 6px !important;
    font-weight: 800 !important;
    font-size: 14px !important;
  }
`;

const card = (
  variant: "green" | "orange" | "lime" | "purple",
  opts: {
    imgAlt: string;
    label: string;
    title: string;
    description: string;
    badge?: string;
    bullets: string[];
    cta: string;
    href: string;
  }
) => {
  const badgeHtml = opts.badge
    ? `<span class="vss-related-card__badge">${opts.badge}</span>`
    : "";
  const bulletsHtml = opts.bullets
    .map((b) => `<li>${b}</li>`)
    .join("");

  return (
    `<div class="vss-related-card vss-related-card--${variant}" style="display:flex;flex-direction:column;flex:1 1 22%;min-width:200px;background:#fff;border:1px solid #e7e7e7;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;padding:16px;box-sizing:border-box;margin:0;">` +
    `<div class="vss-related-card__body" style="flex:1 1 auto;">` +
    `<img src="https://via.placeholder.com/600x300?text=Replace+Image" alt="${opts.imgAlt}" style="width:100%;height:140px;object-fit:contain;display:block;margin:0 0 12px 0;" />` +
    `<p class="vss-related-card__label vss-related-card__label--${variant}" style="margin:0 0 6px 0;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;">${opts.label}</p>` +
    `<h3 style="margin:0 0 8px 0;font-size:18px;line-height:1.25;color:#111;">${opts.title}</h3>` +
    `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.5;color:#444;">${opts.description}</p>` +
    badgeHtml +
    `<ul style="margin:0 0 8px 0;padding-left:18px;font-size:14px;line-height:1.6;color:#333;">${bulletsHtml}</ul>` +
    `</div>` +
    `<div class="vss-related-card__footer" style="margin-top:auto;width:100%;">` +
    `<a class="vss-related-card__btn" href="${opts.href}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:#0d9488;color:#fff;text-decoration:none;padding:12px 14px;border-radius:6px;font-weight:800;">${opts.cta}</a>` +
    `</div>` +
    `</div>`
  );
};

export const CATEGORY_CARDS_4COL_TEMPLATE = {
  title: "Category Cards (4-col)",
  description:
    "Insert 4 equal-height category cards with aligned CTA buttons",
  icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="33" height="33" rx="6" fill="#A5E7EB" /><g fill="#0F172A"><rect x="11" y="13" width="7" height="7" rx="2"/><rect x="19" y="13" width="7" height="7" rx="2"/><rect x="27" y="13" width="7" height="7" rx="2"/><rect x="11" y="21" width="7" height="7" rx="2"/><rect x="19" y="21" width="7" height="7" rx="2"/><rect x="27" y="21" width="7" height="7" rx="2"/></g></svg>',
  data:
    `<div class="vss-related-cards" style="display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;width:100%;font-family:Arial,sans-serif;margin:0;">` +
    card("green", {
      imgAlt: "50-50 E-Liquids",
      label: "FOR MTL VAPERS",
      title: "50-50 E-Liquids",
      description:
        "50/50 VG/PG mix that's smooth and easy for everyday vaping.",
      badge: "Easy everyday choice",
      bullets: [
        "Designed for MTL vape kits",
        "Available in freebase or nic salt",
        "Balanced throat hit",
      ],
      cta: "Shop 50/50 e-liquids",
      href: "#",
    }) +
    card("orange", {
      imgAlt: "Nic Salt E-Liquids",
      label: "SMOOTHER INHALES",
      title: "Nic Salt E-Liquids",
      description:
        "Nic salts for a smoother nicotine experience with fast satisfaction.",
      bullets: [
        "Balanced nicotine strength",
        "Great for pod devices",
        "More satisfying inhale",
      ],
      cta: "Shop nic salt e-liquids",
      href: "#",
    }) +
    card("lime", {
      imgAlt: "High VG E-Liquids",
      label: "SUB-OHM &amp; DTL VAPING",
      title: "High VG E-Liquids",
      description:
        "Thicker clouds and smoother draws thanks to higher VG content.",
      bullets: [
        "Big cloud production",
        "Designed for DTL / sub-ohm",
        "Lower nicotine options",
      ],
      cta: "Shop high VG e-liquids",
      href: "#",
    }) +
    card("purple", {
      imgAlt: "Shortfill E-Liquids",
      label: "LARGER BOTTLES",
      title: "Shortfill E-Liquids",
      description:
        "Mix to your preferred strength and enjoy better value for money.",
      bullets: [
        "Nicotine-free base (mix ready)",
        "Choose your nicotine strength",
        "Good for topping up",
      ],
      cta: "Shop Shortfill e-liquids",
      href: "#",
    }) +
    `</div>`,
} as const;
