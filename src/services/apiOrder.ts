import { getAuthToken } from "@/utils/auth";
import { fetcher, updater } from "./apiService";
import axiosInstance from "@/utils/axiosApi";

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

// Interface for order status statistics
export interface OrderStatusStatistics {
  status: OrderStatus;
  count: number;
  total_amount: string;
}

// Interface for order statistics response
export interface OrderStatisticsResponse {
  success: boolean;
  message: string;
  data: {
    order_status: OrderStatusStatistics[];
  };
}

// Interface for address
export interface Address {
  id: number;
  name: string;
  last_name: string;
  company_name: string | null;
  country: string;
  street: string;
  apartment: string | null;
  town: string;
  county: string | null;
  post_code: string;
  phone: string | null;
}

// Interface for order item
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  unit: string;
  unit_price: string;
  quantity: number;
  discount_price: string | null;
  total: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  product: {
    id: number;
    name: string;
    slug: string;
    ProductImages: Array<{
      id: number;
      url: string;
    }>;
  };
  variant: {
    id: number;
    barcode: string;
    price: string;
    slug: string;
  };
}

// Interface for order details
export interface Order {
  id: number;
  order_unique_id: string;
  user_id: number;
  coupon_id: number | null;
  total: string;
  discount_price: string | null;
  status: OrderStatus;
  shipping_address_id: number;
  billing_address_id: number;
  shipping_method_id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    profile_pic_url: string | null;
  };
  shippingAddress: Address;
  billingAddress: Address;
  orderItems: OrderItem[];
  payment_status?: PaymentStatus; // Added for backward compatibility
}

// Interface for orders list response with pagination
export interface OrdersListResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
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
): Promise<OrderStatisticsResponse> => {
  const params: any = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const response = await fetcher("/api/admin/orders/stats", params);
  return response;
};

// Function to generate Excel report of orders
export const generateOrderReport = async (
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  startDate?: string,
  endDate?: string
): Promise<void> => {
  try {
    // Build params object
    const params: any = {};
    if (status) params.status = status;
    if (paymentStatus) params.payment_status = paymentStatus;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    // Use axiosInstance with blob response type, just like in apiProductVariant
    const response = await axiosInstance.get("/api/admin/orders/report", {
      params,
      responseType: "blob",
    });

    // Create a blob from the response data
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    // Set filename with current date
    const today = new Date().toISOString().split("T")[0];
    link.download = `orders-report-${today}.xlsx`;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error downloading report:", error);
    throw error;
  }
};

// Function to update order status
export const updateOrderStatus = async (
  orderId: number,
  status: OrderStatus
): Promise<any> => {
  const response = await updater(`/api/admin/orders/${orderId}/status`, {
    status,
  });
  return response;
};

// Function to get list of orders with filtering and pagination
export const getOrders = async (
  filters: OrderFilterParams = {}
): Promise<OrdersListResponse> => {
  const response = await fetcher("/api/admin/orders", filters);
  return response;
};

// Function to get order details by ID
export const getOrderById = async (orderId: number): Promise<Order> => {
  const response = await fetcher(`/api/admin/orders/${orderId}`);
  return response?.data;
};
