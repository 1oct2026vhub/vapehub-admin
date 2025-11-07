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
  sort_order: string;
  image?: File;
}

export interface UpdateAttributeData {
  name?: string;
  slug?: string;
  description?: string;
  type?: string;
  sort_order?: string;
  image?: File | null;
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
  success: boolean;
  message: string;
  data: Attribute & {
    image_url?: string | null;
    terms?: Array<{
      id: number;
      name: string;
      slug: string;
      description?: string;
      sort_order?: number;
      created_at: string;
      updated_at: string;
      deleted_at?: string | null;
    }>;
    updatedByUser?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    } | null;
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
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('slug', data.slug);
  if (data.description) {
    formData.append('description', data.description);
  }
  formData.append('type', data.type);
  formData.append('sort_order', data.sort_order);
  if (data.image) {
    formData.append('image', data.image);
  }

  // Axios automatically sets Content-Type to multipart/form-data when posting FormData
  const response = await axiosInstance.post("/api/admin/attributes", formData);
  return response.data;
};

export const updateAttribute = async (
  id: string | number,
  data: UpdateAttributeData,
) => {
  const attributeId = typeof id === 'string' && !isNaN(Number(id)) 
    ? Number(id) 
    : id;

  const formData = new FormData();

  // Append fields only if they exist in the data object
  if (data.name !== undefined) formData.append('name', data.name);
  if (data.slug !== undefined) formData.append('slug', data.slug);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.type !== undefined) formData.append('type', data.type);
  if (data.sort_order !== undefined) formData.append('sort_order', data.sort_order);

  // Handle image update/replacement
  if (data.image instanceof File) {
    formData.append('image', data.image);
    formData.append('new_image', 'true'); // Signal new image upload
  }
  // Note: Logic for *removing* an existing image is not explicitly defined here.
  // If data.image is explicitly null, we might need to send a different flag or 
  // handle it based on backend expectations (e.g., sending new_image=true without an image file?).
  // For now, we only handle replacement.

  // Axios requires a specific way to send FormData with PUT, often using POST with a method override.
  // Adding _method field common practice.
  formData.append('_method', 'PUT'); 

  console.log("Updating attribute with ID:", attributeId, "and FormData... (image file not shown)");
  // Use POST because PUT with FormData can be problematic. Backend should handle _method=PUT.
  const response = await axiosInstance.put(`/api/admin/attributes/${attributeId}`, formData, {
    headers: {
      // Content-Type is set automatically by Axios for FormData
    }
  });
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

// New function to remove attribute image
export const removeAttributeImage = async (id: string | number) => {
  const response = await axiosInstance.delete(`/api/admin/attributes/${id}/remove-image`);
  return response.data; // Assuming response structure { success: boolean, data: string, message: string }
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

// Bulk delete attributes by IDs
export const bulkDeleteAttribute = async (ids: number[]) => {
  const response = await axiosInstance.delete(
    "/api/admin/attributes/bulk-delete",
    {
      data: { ids },
    }
  );
  return response.data;
};

// Bulk restore soft-deleted attributes by IDs
export const bulkRestoreAttribute = async (ids: number[]) => {
  const response = await axiosInstance.put(
    "/api/admin/attributes/bulk-restore",
    { ids }
  );
  return response.data;
};
