import axiosInstance from "@/utils/axiosApi";

export interface BuyingGuideHighlight {
  text: string;
}

export interface BuyingGuideTab {
  tab_title: string;
  section_heading: string;
  section_body: string;
  order?: number;
}

export interface CategoryBuyingGuide {
  id?: number;
  category_id: number;
  is_enabled: boolean;
  guide_label: string;
  title: string;
  intro_content: string;
  banner_image?: string | null;
  banner_alt?: string;
  highlights: BuyingGuideHighlight[];
  tabs: BuyingGuideTab[];
  related_category_ids: number[];
}

export interface BuyingGuideApiResponse {
  success: boolean;
  message: string;
  data?: {
    buyingGuide: CategoryBuyingGuide;
  };
}

export const getCategoryBuyingGuide = (
  categoryId: number
): Promise<BuyingGuideApiResponse> => {
  return axiosInstance
    .get(`/api/admin/category/${categoryId}/buying-guide`)
    .then((res) => res.data);
};

export const saveCategoryBuyingGuide = async (
  categoryId: number,
  data: Partial<CategoryBuyingGuide> & { banner_image_file?: File | null }
): Promise<BuyingGuideApiResponse> => {
  const hasFile = data.banner_image_file instanceof File;

  if (hasFile) {
    const formData = new FormData();
    formData.append("is_enabled", String(data.is_enabled ?? false));
    formData.append("guide_label", data.guide_label ?? "");
    formData.append("title", data.title ?? "");
    formData.append("intro_content", data.intro_content ?? "");
    formData.append("banner_alt", data.banner_alt ?? "");
    formData.append("highlights", JSON.stringify(data.highlights ?? []));
    formData.append("tabs", JSON.stringify(data.tabs ?? []));
    formData.append(
      "related_category_ids",
      JSON.stringify(data.related_category_ids ?? [])
    );
    formData.append("banner_image", data.banner_image_file);

    const response = await axiosInstance.post(
      `/api/admin/category/${categoryId}/buying-guide`,
      formData
    );
    return response.data;
  }

  const payload = {
    is_enabled: data.is_enabled ?? false,
    guide_label: data.guide_label ?? "",
    title: data.title ?? "",
    intro_content: data.intro_content ?? "",
    banner_alt: data.banner_alt ?? "",
    highlights: data.highlights ?? [],
    tabs: data.tabs ?? [],
    related_category_ids: data.related_category_ids ?? [],
    ...(typeof data.banner_image === "string" && data.banner_image
      ? { banner_image: data.banner_image }
      : {}),
  };

  const response = await axiosInstance.post(
    `/api/admin/category/${categoryId}/buying-guide`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};
