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