import axiosInstance from "@/utils/axiosApi";

export interface ShippingMethod {
  id: number;
  shipping_method: string;
  description: string;
  display_text: string;
  shipping_cost: string;
  method_order: number;
  is_enabled: boolean;
  service_code: string;
  carrier_code: string;
  requestedShippingService: string;
  updated_by: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  updatedBy: number | null;
}

export interface CreateShippingMethodData {
  shipping_method: string;
  description: string;
  display_text: string;
  shipping_cost: number;
  method_order: number;
  is_enabled: boolean;
  service_code?: string;
  carrier_code?: string;
}

export interface UpdateShippingMethodData {
  shipping_method?: string;
  description?: string;
  display_text?: string;
  shipping_cost?: number;
  method_order?: number;
  is_enabled?: boolean;
  service_code?: string;
  carrier_code?: string;
}

export interface MethodOrderUpdate {
  id: number;
  method_order: number;
}

export interface UpdateMethodOrderData {
  method_orders: MethodOrderUpdate[];
}

export interface ShippingMethodListParams {
  sort_by?:
    | "id"
    | "shipping_method"
    | "shipping_cost"
    | "method_order"
    | "is_enabled"
    | "createdAt"
    | "updatedAt";
  order?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
  keyword?: string;
  show_deleted?: boolean;
}

export interface ShippingMethodListResponse {
  success: boolean;
  message: string;
  data: ShippingMethod[];
}

export interface ShippingMethodDetailResponse {
  success: boolean;
  message: string;
  data: ShippingMethod;
}

/**
 * Creates a new shipping method.
 * POST /api/admin/shipping-methods
 */
export const createShippingMethod = async (data: CreateShippingMethodData) => {
  const response = await axiosInstance.post("/api/admin/shipping-methods", data);
  return response.data;
};

/**
 * Gets all shipping methods.
 * GET /api/admin/shipping-methods
 */
export const listShippingMethods = async (
  params: ShippingMethodListParams = {},
): Promise<ShippingMethodListResponse> => {
  const {
    sort_by = "createdAt",
    order = "DESC",
    limit = 10,
    offset = 0,
    keyword = "",
    show_deleted = false,
  } = params;

  const response = await axiosInstance.get("/api/admin/shipping-methods", {
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

/**
 * Gets a shipping method by ID.
 * GET /api/admin/shipping-methods/{id}
 */
export const getShippingMethodDetails = async (
  id: string | number,
): Promise<ShippingMethodDetailResponse> => {
  try {
    const response = await axiosInstance.get(`/api/admin/shipping-methods/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to fetch shipping method details",
    );
  }
};

/**
 * Updates a shipping method.
 * PUT /api/admin/shipping-methods/{id}
 */
export const updateShippingMethod = async (
  id: string | number,
  data: UpdateShippingMethodData,
) => {
  const shippingMethodId = typeof id === 'string' && !isNaN(Number(id)) 
    ? Number(id) 
    : id;

  const response = await axiosInstance.put(`/api/admin/shipping-methods/${shippingMethodId}`, data);
  return response.data;
};

/**
 * Deletes a shipping method.
 * DELETE /api/admin/shipping-methods/{id}
 */
export const deleteShippingMethod = async (id: string | number) => {
  const response = await axiosInstance.delete(`/api/admin/shipping-methods/${id}`);
  return response.data;
};

/**
 * Restores a deleted shipping method.
 * PATCH /api/admin/shipping-methods/{id}/restore
 */
export const restoreShippingMethod = async (id: string | number) => {
  const response = await axiosInstance.patch(
    `/api/admin/shipping-methods/${id}/restore`,
  );
  return response.data;
};

/**
 * Updates the method order for multiple shipping methods in bulk.
 * POST /api/admin/shipping-methods/update-order
 */
export const updateShippingMethodOrder = async (data: UpdateMethodOrderData) => {
  const response = await axiosInstance.post("/api/admin/shipping-methods/update-order", data);
  return response.data;
};
