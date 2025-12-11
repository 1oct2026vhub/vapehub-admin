import axiosInstance from '@/utils/axiosApi';

export interface InventoryParams {
  page?: number;
  limit?: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'low_stock';
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  top_selling?: boolean;
}

export interface InventorySummary {
  totalInventory: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  totalSalesLastMonth: number;
  totalRevenueLastMonth: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  image: string | null;
  currentStock: number;
  lowStockThreshold: number;
  isInStock: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  salesLast28Days: number;
  salesLastMonth: number;
}

export interface Pagination {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface InventoryDashboardResponse {
  success: boolean;
  message: string;
  data: {
    summary: InventorySummary;
    inventory: InventoryItem[];
    pagination: Pagination;
  };
}

export const getInventoryDashboard = async (params: InventoryParams = {}): Promise<InventoryDashboardResponse> => {
  const response = await axiosInstance.get('/api/admin/inventory/dashboard', { params });
  return response.data;
};

export interface AddStockPayload {
  variant_id: number;
  quantity: number;
  reference?: string;
}

export const addStock = async (payload: AddStockPayload) => {
  const response = await axiosInstance.post('/api/admin/inventory/add-stock', payload);
  return response.data;
}

export interface RemoveStockPayload {
  variant_id: number;
  quantity: number;
  reference?: string;
}

export const removeStock = async (payload: RemoveStockPayload) => {
  const response = await axiosInstance.post('/api/admin/inventory/remove-stock', payload);
  return response.data;
}

export interface AdjustStockPayload {
  variant_id: number;
  new_quantity: number;
  reference?: string;
}

export const adjustStock = async (payload: AdjustStockPayload) => {
  const response = await axiosInstance.post('/api/admin/inventory/adjust-stock', payload);
  return response.data;
}

export interface StockMovementParams {
  page?: number;
  limit?: number;
  variant_id?: number;
  change_type?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface StockMovement {
  id: number;
  variant_id: number;
  change_type: 'adjustment' | 'addition' | 'deduction';
  quantity: number;
  reference: string | null;
  updated_by: number;
  created_at: string;
  variant: {
    id: number;
    slug: string;
    stock: number;
    product: {
      id: number;
      name: string;
    }
  };
  updatedByUser: {
    id: number;
    first_name: string | null;
    last_name: string | null;
  }
}

export interface StockMovementsResponse {
  success: boolean;
  message: string;
  data: {
    movements: StockMovement[];
    pagination: Pagination;
  };
}

export const getStockMovements = async (params: StockMovementParams): Promise<StockMovementsResponse> => {
  const response = await axiosInstance.get('/api/admin/inventory/movements', { params });
  return response.data;
} 

export interface BulkUpdateByQuantityPayload {
  variant_ids: number[];
  quantity: number;
  reference?: string;
}

export const bulkUpdateByQuantity = async (payload: BulkUpdateByQuantityPayload) => {
  const response = await axiosInstance.post('/api/admin/inventory/bulk-update-by-quantity', payload);
  return response.data;
}

export interface ProductsParams {
  q?: string;
  page?: number;
  limit?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  currentStock: number | null;
  stockOnHold: number | null;
  reservedStock: number | null;
  salesLast28Days: number | null;
  stockWillLastDays: number | null;
}

export interface ProductsPagination {
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
  pagination: ProductsPagination;
}

export const getProducts = async (params: ProductsParams = {}): Promise<ProductsResponse> => {
  const response = await axiosInstance.get('/api/admin/inventory/products', { params });
  return response.data;
}

export interface ProductVariantsParams {
  stock_status?: 'in_stock' | 'out_of_stock' | 'low_stock';
}

export interface ProductVariant {
  id: number;
  slug: string;
  barcode: string | null;
  sku: string | null;
  currentStock: number;
  lowStockThreshold: number;
  isInStock: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  salesLast28Days: number;
  stockWillLastDays: number | null;
  price: string;
  regular_price: string;
  discount_price: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface ProductVariantsResponse {
  success: boolean;
  message: string;
  data: {
    product: {
      id: number;
      name: string;
      slug: string;
      totalStock: number;
      salesLast28Days: number;
      stockWillLastDays: number | null;
    };
    variants: ProductVariant[];
    totalVariants: number;
  };
}

export const getProductVariants = async (
  productId: number,
  params: ProductVariantsParams = {}
): Promise<ProductVariantsResponse> => {
  const response = await axiosInstance.get(`/api/admin/inventory/products/${productId}/variants`, { params });
  return response.data;
}

export interface ExportPurchaseOrderParams {
  format?: 'excel' | 'csv';
}

export const exportPurchaseOrder = async (params: ExportPurchaseOrderParams = {}): Promise<void> => {
  try {
    const format: 'excel' | 'csv' = params?.format || 'excel';
    const requestParams: Record<string, string> = {
      format: format,
    };
    
    const response = await axiosInstance.get('/api/admin/inventory/export/purchase-order', {
      params: requestParams,
      responseType: 'blob',
    });

    // Create a temporary link element
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    // Set filename
    const contentDisposition = response.headers["content-disposition"];
    let filename = "purchase-order.xlsx";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    } else {
      // Fallback filename with date
      const today = new Date().toISOString().split("T")[0];
      filename = `purchase-order-${today}.${
        format === "csv" ? "csv" : "xlsx"
      }`;
    }

    link.download = filename;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(link.href);

    return;
  } catch (error) {
    console.error("Error downloading purchase order:", error);
    throw error;
  }
}