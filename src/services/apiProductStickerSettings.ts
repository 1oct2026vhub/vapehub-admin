import axiosInstance from "@/utils/axiosApi";
import type {
  ProductStickerSettings,
  ProductStickerSettingsSchema,
} from "@/types/productSticker";

export const getProductStickerSettingsSchema = async (): Promise<{
  success: boolean;
  message: string;
  data: ProductStickerSettingsSchema;
}> => {
  const response = await axiosInstance.get(
    "/api/admin/product-sticker-settings/schema"
  );
  return response.data;
};

export const getProductStickerSettings = async (): Promise<{
  success: boolean;
  message: string;
  data: ProductStickerSettings;
}> => {
  const response = await axiosInstance.get(
    "/api/admin/product-sticker-settings"
  );
  return response.data;
};

export const updateProductStickerSettings = async (
  payload: ProductStickerSettings
): Promise<{
  success: boolean;
  message: string;
  data: ProductStickerSettings;
}> => {
  const response = await axiosInstance.put(
    "/api/admin/product-sticker-settings",
    payload
  );
  return response.data;
};
