import { fetcher, updater } from "./apiService";

// Order status types
export type OrderStatus =
  | "draft"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "fail"
  | "cancel"
  | "return_requested"
  | "return_approved"
  | "return_received"
  | "refunded";

// Payment status types
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// Interface for order statistics response
export interface OrderStatistics {
  totalOrders: number;
  totalSales: number;
  totalRevenue: number;
  ordersByStatus: {
    status: OrderStatus;
    count: number;
  }[];
  ordersByPaymentStatus: {
    status: PaymentStatus;
    count: number;
  }[];
  dailySales: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}

// Interface for order item
export interface OrderItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
  total: number;
  product: {
    name: string;
    slug: string;
    image: string;
  };
  variant: {
    attributes: {
      attribute: string;
      value: string;
    }[];
  };
}

// Interface for order details
export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  total_items: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
    email: string;
  };
  billing_address: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
    email: string;
  };
  shipping_method: string;
  shipping_cost: number;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Interface for orders list response with pagination
export interface OrdersListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  last_page: number;
}

// Interface for order filter parameters
export interface OrderFilterParams {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

// Function to get order statistics
export const getOrderStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<OrderStatistics> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await fetcher("/api/admin/orders/stats", params);
  return response.data;
};

// Function to generate Excel report of orders
export const generateOrderReport = async (
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  startDate?: string,
  endDate?: string
): Promise<Blob> => {
  const params: any = {};
  if (status) params.status = status;
  if (paymentStatus) params.payment_status = paymentStatus;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  // This needs to be handled differently to get the blob data
  const response = await fetch(
    `/api/admin/orders/report?${new URLSearchParams(params).toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate report");
  }

  return await response.blob();
};

// Function to update order status
export const updateOrderStatus = async (
  orderId: number,
  status: OrderStatus
): Promise<any> => {
  const response = await updater(`/api/admin/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};

// Function to get list of orders with filtering and pagination
export const getOrders = async (
  filters: OrderFilterParams = {}
): Promise<OrdersListResponse> => {
  const response = await fetcher("/api/admin/orders", filters);
  return response.data;
};

// Function to get order details by ID
export const getOrderById = async (orderId: number): Promise<Order> => {
  const response = await fetcher(`/api/admin/orders/${orderId}`);
  return response.data;
};
