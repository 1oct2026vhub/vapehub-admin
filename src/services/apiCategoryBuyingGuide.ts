import axiosInstance from "@/utils/axiosApi";
import type { BlogRelatedBlog } from "@/services/apiBlog";

export interface BuyingGuideHighlight {
  text: string;
}

export interface BuyingGuideTab {
  tab_title: string;
  section_heading: string;
  section_body: string;
  order?: number;
}

export type BuyingGuideRelatedBlog = BlogRelatedBlog;

export interface CategoryBuyingGuide {
  id?: number;
  category_id: number;
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
  related_blogs?: BuyingGuideRelatedBlog[];
}

export interface BuyingGuideApiResponse {
  success: boolean;
  message: string;
  data?: {
    buyingGuide: CategoryBuyingGuide;
  };
  errors?: { field?: string; message: string }[];
}

export interface SaveCategoryBuyingGuideData
  extends Partial<CategoryBuyingGuide> {
  banner_image_file?: File | null;
  clear_banner?: boolean;
}

export const getCategoryBuyingGuide = (
  categoryId: number
): Promise<BuyingGuideApiResponse> => {
  return axiosInstance
    .get(`/api/admin/category/${categoryId}/buying-guide`)
    .then((res) => res.data);
};

/** Storefront — enabled guides only */
export const getPublicCategoryBuyingGuideBySlug = (
  slug: string
): Promise<BuyingGuideApiResponse> => {
  return axiosInstance
    .get(`/api/category/slug/${slug}/buying-guide`)
    .then((res) => res.data);
};

const appendCommonFields = (
  formData: FormData,
  data: SaveCategoryBuyingGuideData
) => {
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
  if (data.clear_banner) {
    formData.append("clear_banner", "true");
  }
};

export const saveCategoryBuyingGuide = async (
  categoryId: number,
  data: SaveCategoryBuyingGuideData
): Promise<BuyingGuideApiResponse> => {
  const hasFile = data.banner_image_file instanceof File;

  if (hasFile) {
    const formData = new FormData();
    appendCommonFields(formData, data);
    formData.append("banner_image", data.banner_image_file as File);

    const response = await axiosInstance.post(
      `/api/admin/category/${categoryId}/buying-guide`,
      formData
    );
    return response.data;
  }

  const payload: Record<string, unknown> = {
    is_enabled: data.is_enabled ?? false,
    cta_prompt: data.cta_prompt ?? "",
    cta_label: data.cta_label ?? "",
    guide_label: data.guide_label ?? "",
    title: data.title ?? "",
    intro_content: data.intro_content ?? "",
    banner_alt: data.banner_alt ?? "",
    highlights: data.highlights ?? [],
    tabs: data.tabs ?? [],
    related_blog_ids: data.related_blog_ids ?? [],
  };

  if (data.clear_banner) {
    payload.clear_banner = true;
    payload.banner_image = null;
  } else if (
    typeof data.banner_image === "string" &&
    data.banner_image
  ) {
    payload.banner_image = data.banner_image;
  }

  const response = await axiosInstance.post(
    `/api/admin/category/${categoryId}/buying-guide`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

export const getBuyingGuideErrorMessage = (error: unknown): string => {
  const err = error as {
    response?: { data?: BuyingGuideApiResponse };
    message?: string;
  };
  const data = err?.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => e.message).join(", ");
  }
  return data?.message || err?.message || "Failed to save buying guide";
};
