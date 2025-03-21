import axiosInstance from "@/utils/axiosApi";

export interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
  description?: string;
  attribute_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AttributeTermListParams {
  attribute_id?: number;
  sort_by?: "id" | "name" | "slug" | "created_at" | "updated_at";
  order?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
  keyword?: string;
  show_deleted?: boolean;
}

export interface AttributeTermListResponse {
  data: {
    terms: AttributeTerm[];
    total: number;
  };
}

export interface CreateAttributeTermData {
  attribute_id: number;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
}

export interface UpdateAttributeTermData {
  name: string;
  slug: string;
  description?: string;
}

export interface AttributeTermDetailResponse {
  data: {
    term: AttributeTerm;
  };
}

export const listAttributeTerms = async (
  params: AttributeTermListParams = {},
): Promise<AttributeTermListResponse> => {
  const {
    attribute_id,
    sort_by = "created_at",
    order = "DESC",
    limit = 10,
    offset = 0,
    keyword = "",
    show_deleted = false,
  } = params;

  const response = await axiosInstance.get("/api/admin/attribute-terms", {
    params: {
      ...(attribute_id && { attribute_id }),
      sort_by,
      order,
      limit,
      offset,
      ...(keyword && { keyword }),
      show_deleted,
    },
  });

  return response.data;
};

export const createAttributeTerm = async (data: CreateAttributeTermData) => {
  const response = await axiosInstance.post("/api/admin/attribute-terms", data);
  return response.data;
};

export const getAttributeTermDetails = async (
  id: string | number,
): Promise<AttributeTermDetailResponse> => {
  try {
    const response = await axiosInstance.get(
      `/api/admin/attribute-terms/${id}`,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch term details",
    );
  }
};

export const updateAttributeTerm = async (
  id: string | number,
  data: UpdateAttributeTermData,
) => {
  try {
    // Ensure id is a number if it's a numeric string
    const termId = typeof id === 'string' && !isNaN(Number(id)) 
      ? Number(id) 
      : id;
    
    console.log("Updating attribute term with ID:", termId, "and data:", data);
    
    const response = await axiosInstance.put(
      `/api/admin/attribute-terms/${termId}`,
      data,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to update term");
  }
};

export const deleteAttributeTerm = async (id: string | number) => {
  const response = await axiosInstance.delete(
    `/api/admin/attribute-terms/${id}`,
  );
  return response.data;
};

export const restoreAttributeTerm = async (id: string | number) => {
  const response = await axiosInstance.patch(
    `/api/admin/attribute-terms/${id}/restore`,
  );
  return response.data;
};

// Download sample Excel file
export const downloadSampleExcel = () => {
  return axiosInstance
    .get("/api/admin/attribute-terms/bulk-update/sample-excel", {
      responseType: "blob",
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "term-sample.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
};

// Bulk update attribute term from Excel file
export const bulkUpdateAttributeTerm = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/api/admin/attribute-terms/bulk-update",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};
