import axiosInstance from "@/utils/axiosApi";

interface ProductListParams {
  sort_by?: string;
  order?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
  keyword?: string;
  price_range?: string;
  categories?: string;
  brands?: string;
  deleted?: boolean;
  is_new?: boolean;
}

// Generic fetcher for GET requests
export const fetcher = (url: string, params = {}) => {
  return axiosInstance.get(url, { params }).then((res) => res.data);
};

// Generic poster for POST requests
export const poster = (url: string, data: any) =>
  axiosInstance.post(url, data).then((res) => res.data);

// Generic updater for PUT requests
export const updater = (url: string, data: any) =>
  axiosInstance.put(url, data).then((res) => res.data);

// Generic deleter for DELETE requests
export const deleter = (url: string) =>
  axiosInstance.delete(url).then((res) => res.data);

// Product actions
// export const listProducts = (params: ProductListParams = {}) => {
//   const {
//     sort_by = "id",
//     order = "ASC",
//     limit = 10,
//     offset = 0,
//     keyword = "",
//     price_range = "",
//     categories = "",
//     brands = "",
//     deleted = false,
//     is_new = false,
//   } = params;

//   return fetcher("/api/admin/products", {
//     sort_by,
//     order,
//     limit,
//     offset,
//     ...(keyword && { keyword }),
//     // ...(price_range && { price_range }),
//     ...(categories && { categories }),
//     ...(brands && { brands }),
//     ...(deleted !== null && { deleted }),
//     // ...(is_new !== null && { is_new }),
//   });
// };
export const listProducts = (params = {}) =>
  fetcher("/api/admin/products", params);



export const getProduct = async (id: number) => {
  const response = await axiosInstance.get(`/api/admin/products/fetch/${id}`);
  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await axiosInstance.delete(`/api/admin/products/${id}`);
  return response.data;
};

export const restoreProduct = async (id: number) => {
  const response = await axiosInstance.put(`/api/admin/products/${id}/restore`);
  return response.data;
};

export const downloadSampleExcel = async () => {
  try {
    const response = await axiosInstance.get(
      "/api/admin/products/download-sample",
      {
        responseType: "blob",
      },
    );

    // Create a blob from the response data
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_sample.xlsx";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
};

// Bulk update brands from Excel file
export const bulkUpdateProducts = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post(
    "/api/admin/products/bulk-update",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  // price: number;
  // discount_price?: number;
  // stock_quantity: number;
  is_new: boolean;
  category_id: number;
  brand_id: number;
}

export const createProduct = async (data: CreateProductData) => {
  const response = await axiosInstance.post("/api/admin/products", data);
  return response.data;
};

export const uploadProductImages = async (
  productId: number,
  images: File[],
) => {
  const formData = new FormData();
  formData.append("product_id", productId.toString());

  images.forEach((image) => {
    formData.append("images", image);
  });

  const response = await axiosInstance.post(
    "/api/admin/products/upload/image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
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

export const updatePrimaryImage = async (
  productId: number,
  imageId: number,
) => {
  const response = await axiosInstance.put(
    `/api/admin/products/${productId}/image/${imageId}/primary`,
  );
  return response.data;
};

export interface ProductVariant {
  slug: string;
  price: number;
  discount_price?: number;
  purchase_price?: number;
  stock: number;
  low_stock_threshold?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  barcode?: string;
  description?: string;
  status: "active" | "inactive";
  attributes: {
    attribute_id: number;
    term_id: number;
  }[];
}

export interface CreateProductVariantsRequest {
  variants: ProductVariant[];
}

export const createProductVariants = async (
  productId: number,
  data: CreateProductVariantsRequest,
) => {
  const response = await axiosInstance.post(
    `/api/admin/product-variants/product/${productId}/variants`,
    data,
  );
  return response.data;
};

export const deleteProductVariant = async (variant_id: number) => {
  const response = await axiosInstance.delete(
    `/api/admin/product-variants/variants/${variant_id}`,
  );
  return response.data;
};

// New update functions for unified form handling

export const updateProduct = async (id: number, data: CreateProductData) => {
  const response = await axiosInstance.put(`/api/admin/products/${id}`, data);
  return response.data;
};

export interface UpdateProductAttributesRequest {
  attributes: Array<{
    attribute_id: number;
    term_id?: number;
    term_ids?: number[];
    is_visible_page: boolean;
    used_in_variation: boolean;
  }>;
}

export const updateProductAttributes = async (
  productId: number,
  data: UpdateProductAttributesRequest
) => {
  const response = await axiosInstance.put(
    `/api/admin/product-variants/product/${productId}/attributes`,
    data
  );
  return response.data;
};

export interface UpdateProductVariantRequest {
  slug: string;
  price: number;
  discount_price?: number;
  purchase_price?: number;
  stock: number;
  low_stock_threshold?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  barcode?: string;
  attributes: Array<{
    attribute_id: number;
    term_id: number;
  }>;
}

export const updateProductVariant = async (
  productId: number,
  variantId: number,
  data: UpdateProductVariantRequest
) => {
  const response = await axiosInstance.put(
    `/api/admin/product-variants/product/${productId}/variants/${variantId}`,
    data
  );
  return response.data;
};

export const deleteProductImage = async (productId: number, imageId: number) => {
  const response = await axiosInstance.delete(
    `/api/admin/products/${productId}/image/${imageId}`,
  );
  return response.data;
};

export const deleteProductAttributeTerm = async (productId: number, attributeTermId: number) => {
  const response = await axiosInstance.delete(
    `/api/admin/product-variants/product/${productId}/attributes/${attributeTermId}`,
  );
  return response.data;
};
