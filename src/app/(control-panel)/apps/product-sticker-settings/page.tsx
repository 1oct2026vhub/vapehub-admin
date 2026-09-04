import { Metadata } from "next";
import ProductStickerSettingsPageClient from "./ProductStickerSettingsPageClient";

export const metadata: Metadata = {
  title: "Product Sticker Settings | VapeHub",
};

export default function ProductStickerSettingsPage() {
  return <ProductStickerSettingsPageClient />;
}
