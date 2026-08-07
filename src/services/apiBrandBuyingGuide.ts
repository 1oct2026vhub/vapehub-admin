import type { BlogRelatedBlog } from "@/services/apiBlog";
import type {
  BuyingGuideHighlight,
  BuyingGuideTab,
} from "@/services/apiCategoryBuyingGuide";
import axiosInstance from "@/utils/axiosApi";

export interface BrandBuyingGuide {
  id?: number;
  brand_id: number;
  is_enabled: boolean;
  cta_prompt: string;
  cta_label: string;
  guide_label: string;
  title: string;
  intro_content: string;
  banner_image?: string | null;
  banner_alt?: string;
  highlights: BuyingGuideHighlight[];
  tabs: BuyingGuideTab[];
  related_blog_ids: number[];
  related_blogs?: BlogRelatedBlog[];
}

export interface BrandBuyingGuideApiResponse {
  success: boolean;
  message: string;
  data?: {
    buyingGuide: BrandBuyingGuide;
  };
  errors?: { field?: string; message: string }[];
}

export interface SaveBrandBuyingGuideData
  extends Partial<BrandBuyingGuide> {
  banner_image_file?: File | null;
  clear_banner?: boolean;
}

export const getBrandBuyingGuide = (
  brandId: number
): Promise<BrandBuyingGuideApiResponse> => {
  return axiosInstance
    .get(`/api/admin/brand/${brandId}/buying-guide`)
    .then((response) => response.data);
};

export const saveBrandBuyingGuide = async (
  brandId: number,
  data: SaveBrandBuyingGuideData
): Promise<BrandBuyingGuideApiResponse> => {
  const formData = new FormData();

  formData.append("is_enabled", String(data.is_enabled ?? false));
  formData.append("cta_prompt", data.cta_prompt ?? "");
  formData.append("cta_label", data.cta_label ?? "");
  formData.append("guide_label", data.guide_label ?? "");
  formData.append("title", data.title ?? "");
  formData.append("intro_content", data.intro_content ?? "");
  formData.append("banner_alt", data.banner_alt ?? "");
  formData.append("highlights", JSON.stringify(data.highlights ?? []));
  formData.append("tabs", JSON.stringify(data.tabs ?? []));
  formData.append(
    "related_blog_ids",
    JSON.stringify(data.related_blog_ids ?? [])
  );

  if (data.banner_image_file instanceof File) {
    formData.append("banner_image", data.banner_image_file);
  } else if (data.clear_banner) {
    formData.append("banner_image", "");
  } else if (
    typeof data.banner_image === "string" &&
    data.banner_image.length > 0
  ) {
    formData.append("banner_image", data.banner_image);
  }

  const response = await axiosInstance.post(
    `/api/admin/brand/${brandId}/buying-guide`,
    formData
  );

  return response.data;
};
