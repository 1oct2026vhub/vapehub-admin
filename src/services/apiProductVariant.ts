import axiosInstance from "@/utils/axiosApi";

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  barcode: string;
  price: number;
  stock_quantity: number;
  stock_status: "in_stock" | "out_of_stock" | "low_stock";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductVariantListParams {
  sort_by?: string;
  order?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
  keyword?: string;
  price_range?: string;
  stock_status?: "in_stock" | "out_of_stock" | "low_stock";
  product_id?: number;
}

export interface ProductVariantListResponse {
  data: ProductVariant[];
  total: number;
  limit: number;
  offset: number;
}

// export const listProductVariants = async (
//   params: ProductVariantListParams = {},
// ): Promise<ProductVariantListResponse> => {
//   const {
//     sort_by = "id",
//     order = "ASC",
//     limit = 10,
//     offset = 0,
//     keyword,
//     price_range,
//     stock_status,
//     product_id,
//   } = params;

//   const response = await axiosInstance.get("/api/admin/product-variants", {
//     params: {
//       sort_by,
//       order,
//       limit,
//       offset,
//       ...(keyword && { keyword }),
//       ...(price_range && { price_range }),
//       ...(stock_status && { stock_status }),
//       ...(product_id && { product_id }),
//     },
//   });

//   return response.data;
// };

export const listProducts = async (params = {}) => {
  const response = await axiosInstance.get("/api/admin/product-variants", { params });
  return response.data;
};

// Helper function to get stock status text
export const getStockStatusText = (status: string): string => {
  const statusMap = {
    in_stock: "In Stock",
    out_of_stock: "Out of Stock",
    low_stock: "Low Stock",
  };
  return statusMap[status] || status;
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const deleteVariant = async (variantId: number) => {
  const response = await axiosInstance.delete(
    `/api/admin/product-variants/variants/${variantId}`,
  );
  return response.data;
};

export const restoreVariant = async (variantId: number) => {
  const response = await axiosInstance.put(
    `/api/admin/product-variants/variants/${variantId}/restore`,
  );
  return response.data;
};

export const downloadSampleExcel = async () => {
  const response = await axiosInstance.get(
    "/api/admin/product-variants/bulk-update/download-sample",
    {
      responseType: "blob",
    },
  );

  // Create a blob from the response data
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Create a temporary link element
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "variant_bulk_update_sample.xlsx";

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL
  URL.revokeObjectURL(link.href);
};

export const getVariantDetails = async (
  id: number,
): Promise<{ data: ProductVariant }> => {
  const response = await axiosInstance.get(`/api/admin/product-variants/${id}`);
  return response.data;
};

export interface ProductAttribute {
  attribute_id: number;
  term_id: number;
  is_visible_page: boolean;
  used_in_variation: boolean;
}

export interface AddProductAttributesRequest {
  attributes: ProductAttribute[];
}

export const addProductAttributes = async (
  productId: number,
  data: AddProductAttributesRequest,
) => {
  const response = await axiosInstance.post(
    `/api/admin/product-variants/product/${productId}/attributes`,
    data,
  );
  return response.data;
};


// Bulk update attribute from Excel file
export const bulkUpdateVariant = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/api/admin/product-variants/bulk-update",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

