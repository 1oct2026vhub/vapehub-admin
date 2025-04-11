import { fetcher } from "./apiService";

// Types for dashboard API responses
export interface SalesChartData {
  date: string;
  ordersCount: number;
  totalSales: number;
}

export interface UserGrowthChartData {
  date: string;
  admin: number;
  customer: number;
}

export interface TransactionChartData {
  date: string;
  transactionCount: number;
  totalRevenue: number;
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
  _id: string;
  count: number;
  role: string;
}

export interface DashboardStats {
  sales: {
    today: string;
    weekly: string;
    monthly: string;
  };
  orders: OrderCount[];
  users: UserCount[];
  products: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
  marketing: {
    activeCoupons: number;
    newsletterSubscribers: number;
    totalBlogPosts: number;
    activeCarousels: number;
    activeBanners: number;
  };
  recentTransactions: RecentTransaction[];
  recentOrders: RecentOrder[];
}

type ChartPeriod = "daily" | "weekly" | "monthly";

// Function to get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetcher("/api/admin/dashboard/stats");
  return response.data;
};

// Function to get sales chart data
export const getSalesChartData = async (
  period: ChartPeriod
): Promise<SalesChartData[]> => {
  const response = await fetcher(`/api/admin/dashboard/chart/sales`, {
    period,
  });
  return response.data;
};

// Function to get user growth chart data
export const getUserGrowthChartData = async (
  period: ChartPeriod
): Promise<UserGrowthChartData[]> => {
  const response = await fetcher(`/api/admin/dashboard/chart/user`, { period });
  return response.data;
};

// Function to get transaction chart data
export const getTransactionChartData = async (
  period: ChartPeriod
): Promise<TransactionChartData[]> => {
  const response = await fetcher(`/api/admin/dashboard/chart/transaction`, {
    period,
  });
  return response.data;
};
