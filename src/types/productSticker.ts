export type ProductStickerSource = "manual" | "auto_new" | "auto_new_flavours";

export type ProductSticker = {
  name: string;
  background_color: string;
  active_from: string;
  active_until: string;
  source: ProductStickerSource;
  is_active: boolean;
} | null;

export type StickerWritePayload = {
  name: string;
  background_color: string;
  active_until: string;
  active_from?: string | null;
};

export type StickerMode = "auto" | "manual" | "clear";

export type NewStickerSettings = {
  enabled: boolean;
  sticker_name: string;
  background_color: string;
  duration_days: number;
  respect_is_new_flag: boolean;
};

export type NewFlavoursStickerSettings = {
  enabled: boolean;
  sticker_name: string;
  background_color: string;
  min_product_age_days: number;
  duration_days: number;
};

export type ProductStickerSettings = {
  new: NewStickerSettings;
  new_flavours: NewFlavoursStickerSettings;
};

export type StickerSettingsField = {
  key: string;
  label: string;
  type: "boolean" | "string" | "hex" | "number";
  min?: number;
};

export type ProductStickerSettingsSchema = {
  defaults: ProductStickerSettings;
  fields: {
    new: StickerSettingsField[];
    new_flavours: StickerSettingsField[];
  };
};

/** Contrast text colour for a hex chip background */
export function getContrastTextColor(hex: string): string {
  const normalized = hex?.replace("#", "");
  if (!normalized || normalized.length !== 6) return "#ffffff";
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111827" : "#ffffff";
}

export function getStickerStatusLabel(
  sticker: NonNullable<ProductSticker>
): "Active" | "Scheduled" | "Expired" {
  if (sticker.is_active) return "Active";
  const now = Date.now();
  const from = new Date(sticker.active_from).getTime();
  if (!Number.isNaN(from) && from > now) return "Scheduled";
  return "Expired";
}

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
