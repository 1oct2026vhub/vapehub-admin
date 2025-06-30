import { fetcher } from "./apiService";

// Types for dashboard API responses
export interface SalesChartData {
  date: string;
  dateRange: string;
  totalSales: number;
  ordersCount: number;
  revenue?: number;
}

export interface UserGrowthChartData {
  date: string;
  dateRange: string;
  admin: number;
  customer: number;
  newUsers?: number;
  totalUsers?: number;
}

export interface TransactionChartData {
  date: string;
  dateRange: string;
  totalRevenue: number;
  transactionCount: number;
}

export interface RecentTransaction {
  amount: number;
  createdAt: string;
  orderId: string;
  paymentMethod?: string;
  status?: string;
  referenceNumber?: string;
  transactionType?: string;
}

export interface RecentOrder {
  orderNumber: string;
  order_unique_id?: string;
  createdAt: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  total?: string | number;
  status?: string;
}

export interface OrderCount {
  _id: string;
  count: number;
  status: string;
}

export interface UserCount {
  role: string;
  count: number;
  blocked_count?: string | number;
  active_count?: string | number;
  deleted_count?: string | number;
  verified_customer_count?: string | number;
  unverified_customer_count?: string | number;
}

// Define the dashboard statistics types
export interface DashboardStats {
  sales: {
    today: string;
    weekly: string;
    monthly: string;
  };
  orders: OrderCount[];
  users: UserCount[];
  products: ProductStats;
  recentOrders: RecentOrder[];
  recentTransactions: RecentTransaction[];
}

// Product statistics types
export interface ProductStats {
  totalProducts: number;
  lowStock: number | string;
  outOfStock: number | string;
  inStock: number | string;
  healthyStock: number | string;
  outOfStockStatus: number | string;
}

export interface SalesSummary {
  grossSales: number;
  averageGrossDailySales: number;
  netSales: number;
  averageNetDailySales: number;
  ordersPlaced: number;
  itemsPurchased: number;
  refundedOrders: number;
  shippingCharged: number;
  couponsUsed: number;
}

export interface SalesChartApiResponse {
  summary: SalesSummary;
  chart: SalesChartData[];
}

export interface PercentChange {
  totalSales: string;
  totalOrders: string;
  newUsers: string;
}

export interface SalesStatsPeriod {
  dateRange: string;
  totalSales: string;
  totalOrders: number | string;
  newUsers: number;
  percentChange: PercentChange;
}

export interface SalesStatsOverview {
  today: SalesStatsPeriod;
  week: SalesStatsPeriod;
  month: SalesStatsPeriod;
}

type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

// Function to get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetcher("/api/admin/dashboard/stats");
  return response.data;
};

/**
 * Retrieve sales statistics overview including total sales, total orders, and new users.
 */
export const getSalesStatsOverview = async (): Promise<SalesStatsOverview> => {
  const response = await fetcher('/api/admin/dashboard/sales-stats-overview');
  return response.data;
};

// Function to get sales chart data
export const getSalesChartData = async (
  period: ChartPeriod,
  params?: {
    productId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<SalesChartApiResponse> => {
  const response = await fetcher(`/api/admin/dashboard/chart/sales`, {
    period,
    ...params,
  });
  return response.data;
};

// Function to get user growth chart data
export const getUserGrowthChartData = async (
  period: ChartPeriod,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<UserGrowthChartData[]> => {
  const response = await fetcher(`/api/admin/dashboard/chart/user`, {
    period,
    ...params,
  });
  return response.data;
};

// Function to get transaction chart data
export const getTransactionChartData = async (
  period: ChartPeriod,
  params?: {
    productId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<TransactionChartData[]> => {
  const response = await fetcher(`/api/admin/dashboard/chart/transaction`, {
    period,
    ...params,
  });
  return response.data;
};
