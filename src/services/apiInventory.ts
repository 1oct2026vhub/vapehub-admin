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