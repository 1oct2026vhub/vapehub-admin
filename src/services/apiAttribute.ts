import axiosInstance from "@/utils/axiosApi";

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  sort_order: number;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateAttributeData {
  name: string;
  slug: string;
  description?: string;
  type: string;
  sort_order: number;
}

export interface UpdateAttributeData {
  name: string;
  slug: string;
  description?: string;
  type: string;
  sort_order: string;
}

export interface AttributeListParams {
  sort_by?:
    | "id"
    | "name"
    | "slug"
    | "type"
    | "sort_order"
    | "created_at"
    | "updated_at";
  order?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
  keyword?: string;
  show_deleted?: boolean;
}

export interface AttributeListResponse {
  data: {
    attributes: Attribute[];
    total: number;
  };
}

export interface AttributeDetailResponse {
  data: {
    attribute: Attribute & {
      terms?: Array<{
        id: number;
        name: string;
        slug: string;
        description?: string;
        sort_order: number;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
      }>;
    };
  };
}

export interface BulkUpdateResult {
  slug: string;
  name: string;
  status: "Created" | "Updated" | "Unchanged" | "Error";
  id?: number;
  message?: string;
}

export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      total: number;
      created: number;
      updated: number;
      unchanged: number;
      errors: number;
      skipped: number;
    };
    results: BulkUpdateResult[];
  };
}

export const createAttribute = async (data: CreateAttributeData) => {
  const response = await axiosInstance.post("/api/admin/attributes", data);
  return response.data;
};

export const updateAttribute = async (
  id: string | number,
  data: UpdateAttributeData,
) => {
  // Ensure id is a number if it's a numeric string
  const attributeId = typeof id === 'string' && !isNaN(Number(id)) 
    ? Number(id) 
    : id;
  
  console.log("Updating attribute with ID:", attributeId, "and data:", data);
  
  const response = await axiosInstance.put(`/api/admin/attributes/${attributeId}`, data);
  return response.data;
};

export const getAttributeDetails = async (
  id: string | number,
): Promise<AttributeDetailResponse> => {
  try {
    const response = await axiosInstance.get(`/api/admin/attributes/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch attribute details",
    );
  }
};

export const listAttributes = async (
  params: AttributeListParams = {},
): Promise<AttributeListResponse> => {
  const {
    sort_by = "created_at",
    order = "DESC",
    limit = 10,
    offset = 0,
    keyword = "",
    show_deleted = false,
  } = params;

  const response = await axiosInstance.get("/api/admin/attributes", {
    params: {
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

export const deleteAttribute = async (id: string | number) => {
  const response = await axiosInstance.delete(`/api/admin/attributes/${id}`);
  return response.data;
};

export const restoreAttribute = async (id: string | number) => {
  const response = await axiosInstance.patch(
    `/api/admin/attributes/${id}/restore`,
  );
  return response.data;
};

// Download sample Excel file
export const downloadSampleExcel = () => {
  return axiosInstance
    .get("/api/admin/attributes/bulk-update/sample-pdf", {
      responseType: "blob",
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "attributes-sample.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
};

// Bulk update attribute from Excel file
export const bulkUpdateAttribute = async (file: File): Promise<BulkUpdateResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/api/admin/attributes/bulk-update",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};
