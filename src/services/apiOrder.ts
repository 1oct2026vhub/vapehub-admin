import { getAuthToken } from "@/utils/auth";
import { fetcher, updater } from "./apiService";
import axiosInstance from "@/utils/axiosApi";
import { ShippingMethod } from "./apiShippingMethod";

// Order status types
export type OrderStatus =
  | "draft"
  | "pending"
  | "processing"
  | "packed"
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
  count_abbreviated?: string;
  total_amount: string;
  total_amount_abbreviated?: string;
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
      image_url: string;
      is_primary?: boolean;
    }>;
  };
  variant: {
    id: number;
    barcode: string | null;
    price: string;
    slug: string;
    stock?: number;
    variantImages?: Array<{
      id: number;
      image_url: string;
      is_primary?: boolean;
    }> | null;
    variantAttributes?: Array<{
      id?: number;
      attribute: { id?: number; name: string };
      term: { id?: number; attribute_id?: number; name:string };
    }> | null;
  };
}

// Define the structure of a status timeline item from API
export interface StatusTimelineItem {
  status: string;
  label: string;
  icon: string;
  achieved: boolean;
  current: boolean;
  timestamp: string;
  skipped: boolean;
}

// Define the structure of an order log item from API
export interface OrderLogItem {
  id: number;
  status: string;
  label: string;
  additional_info: string | null;
  createdAt: string;
  user: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    profile_pic_url: string | null;
  };
}

// Define User interface based on API response
export interface User {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  profile_pic_url: string | null;
  gender?: string | null;
  dob?: string | null;
}

// Interface for order details
export interface Order {
  id: number;
  order_unique_id: string;
  order_code?: string;
  user_id: number;
  coupon_id: number | null;
  total: string;
  discount_price: string | null;
  deals_discount?: string | null;
  loyalty_discount?: string | null;
  mailSubscription_discount?: string | null;
  sub_total?: string | null;
  discount_type?: 'percentage' | 'fixed_amount' | 'referral' | string | null;
  shipping_cost?: string | null;
  status: OrderStatus;
  shipping_address_id: number | null;
  billing_address_id: number | null;
  order_shipping_address_id?: number;
  order_billing_address_id?: number;
  shipping_method_id: number;
  email?: string;
  phone?: string;
  referral_id?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: User;
  orderBillingAddress: Address;
  orderShippingAddress: Address;
  orderItems: OrderItem[];
  notes?: string | null;
  payment_status?: PaymentStatus;
  orderLogs?: OrderLogItem[];
  statusTimeline?: StatusTimelineItem[];
  coupon?: Coupon | null;
  paymentMethod?: PaymentMethod;
  shippingMethod?: ShippingMethod;
  transactions?: OrderTransaction[];
}

// Define PaymentMethod interface based on API response
export interface PaymentMethod {
  id: number;
  payment_method: string;
  status: string;
}

// Define Coupon interface based on API response
export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | string;
  discount_value: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Define OrderTransaction interface for transactions in Order response
export interface OrderTransaction {
  id: number;
  paymentMethod: string;
  transactionType: string;
  amount: string;
  currency: string;
  status: string;
  referenceNumber: string;
  notes?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
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

// Interface for bulk status update response
export interface BulkStatusUpdateResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    successful: number;
    failed: number;
    status: OrderStatus;
    results: Array<{
      order_id: number;
      order_unique_id: string;
      status: OrderStatus;
      success: boolean;
      shipstation_data?: {
        order_id: string;
        label_data?: {
          shipment_id: string;
          tracking_number: string;
          shipment_cost: number;
        };
      } | null;
    }>;
    errors: Array<{
      order_id: number;
      order_unique_id: string;
      error: string;
    }>;
  };
}

// Interface for bulk status update request
export interface BulkStatusUpdateRequest {
  order_ids: number[];
  status: OrderStatus;
}

export const BULK_STATUS_SYNC_MAX = 100;
export const BULK_STATUS_ASYNC_MAX = 500;
export const BULK_STATUS_JOB_SESSION_KEY = "bulkStatusJobId";

export type BulkStatusJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "partial_failed"
  | "failed";

export interface BulkStatusJobError {
  order_id: number;
  order_unique_id: string;
  error: string;
}

export interface BulkStatusJobData {
  job_id: string;
  status: BulkStatusJobStatus;
  progress_percent: number;
  successful: number;
  failed: number;
  skipped: number;
  pending: number;
  total?: number;
  errors?: BulkStatusJobError[];
}

export interface BulkStatusAsyncStartResponse {
  success: boolean;
  message?: string;
  data: {
    job_id: string;
  };
}

export interface BulkStatusJobResponse {
  success: boolean;
  message?: string;
  data: BulkStatusJobData;
}

const isTerminalBulkStatusJob = (status: BulkStatusJobStatus) =>
  status === "completed" || status === "partial_failed" || status === "failed";

// Sync bulk update — up to 100 orders, 60s timeout
export const bulkUpdateOrderStatus = async (
  orderIds: number[],
  status: OrderStatus
): Promise<BulkStatusUpdateResponse> => {
  const response = await axiosInstance.put(
    "/api/admin/orders/bulk-status",
    { order_ids: orderIds, status },
    { timeout: 60000 }
  );
  return response.data;
};

// Async bulk update — 101–500 orders, 15s timeout to receive job_id
export const bulkUpdateOrderStatusAsync = async (
  orderIds: number[],
  status: OrderStatus
): Promise<BulkStatusAsyncStartResponse> => {
  const response = await axiosInstance.post(
    "/api/admin/orders/bulk-status/async",
    { order_ids: orderIds, status },
    { timeout: 15000 }
  );
  return response.data;
};

// Poll async bulk status job — 15s timeout per request
export const getBulkStatusJob = async (
  jobId: string
): Promise<BulkStatusJobResponse> => {
  const response = await axiosInstance.get(
    `/api/admin/orders/bulk-status/jobs/${jobId}`,
    { timeout: 15000 }
  );
  return response.data;
};

export { isTerminalBulkStatusJob };

export const storeBulkStatusJobId = (jobId: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(BULK_STATUS_JOB_SESSION_KEY, jobId);
  }
};

export const getStoredBulkStatusJobId = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(BULK_STATUS_JOB_SESSION_KEY);
};

export const clearStoredBulkStatusJobId = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(BULK_STATUS_JOB_SESSION_KEY);
  }
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
