import { fetcher, updater, patcher, poster } from "./apiService";
import axiosInstance from "@/utils/axiosApi";

// Transaction status types
export type TransactionStatus =
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

// Transaction type enum
export type TransactionType = "purchase" | "refund" | "payout";

// Payment method types
export type PaymentMethod = "worldPay" | "stripe" | "paypal" | "bank_transfer";

// Interface for transaction
export interface Transaction {
  id: number;
  userId: number;
  orderId: number;
  paymentMethod: PaymentMethod;
  transactionType: TransactionType;
  amount: string;
  currency: string;
  status: TransactionStatus;
  referenceNumber: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    profile_pic_url: string | null;
  };
  order?: {
    id: number;
    order_unique_id: string;
    user_id: number;
    coupon_id: number | null;
    total: string;
    discount_price: string | null;
    status: string;
    shipping_address_id?: number;
    billing_address_id?: number;
    shipping_method_id?: number;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
    orderItems?: Array<{
      id: number;
      order_id: number;
      product_id: number;
      variant_id: number | null;
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
      };
      variant?: {
        id: number;
        barcode: string;
        price: string;
        slug: string;
      } | null;
    }>;
    shippingMethod?: {
      id: number;
      shipping_method: string;
      shipping_cost: number;
    };
    shippingAddress?: {
      id: number;
      name: string;
      last_name: string;
      street: string;
      town: string;
      county: string | null;
      post_code: string;
      country: string | null;
      phone: string | null;
    };
    billingAddress?: {
      id: number;
      name: string;
      last_name: string;
      street: string;
      town: string;
      county: string | null;
      post_code: string;
      country: string | null;
      phone: string | null;
    };
  };
}

// Interface for transactions list response with pagination
export interface TransactionsListResponse {
  success: boolean;
  message: string;
  data: {
    transactions: Transaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
}

// Interface for transaction filter parameters
export interface TransactionFilterParams {
  userId?: number;
  orderId?: number;
  status?: TransactionStatus;
  transactionType?: TransactionType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: "ASC" | "DESC";
}

// Function to get list of transactions with filtering and pagination
export const getTransactions = async (
  filters: TransactionFilterParams = {}
): Promise<TransactionsListResponse> => {
  const response = await fetcher("/api/admin/transactions", filters);
  return response;
};

// Function to get transaction details by ID
export const getTransactionById = async (
  transactionId: number
): Promise<Transaction> => {
  const response = await fetcher(`/api/admin/transactions/${transactionId}`);
  return response?.data;
};

// Function to generate transactions report (Excel/CSV)
export const generateTransactionReport = async (
  format: "excel" | "csv" = "excel",
  filters: {
    startDate?: string;
    endDate?: string;
    status?: TransactionStatus;
    transactionType?: TransactionType;
  } = {}
): Promise<void> => {
  try {
    // Build params object
    const params: any = { format };
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.status) params.status = filters.status;
    if (filters.transactionType)
      params.transaction_type = filters.transactionType;

    // Use axiosInstance with proper configuration
    const response = await axiosInstance.get(
      `/api/admin/transactions/reports/export`,
      {
        params,
        responseType: "blob",
      }
    );

    // Create a temporary link element
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    // Set filename
    const contentDisposition = response.headers["content-disposition"];
    let filename = "transactions-report.xlsx";

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
      filename = `transactions-report-${today}.${
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
    console.error("Error downloading report:", error);
    throw error;
  }
};

// Function to update transaction status
export const updateTransactionStatus = async (
  transactionId: number,
  status: TransactionStatus
): Promise<any> => {
  try {
    // Use patcher instead of updater for PATCH request
    const response = await patcher(
      `/api/admin/transactions/${transactionId}/status`,
      {
        status,
      }
    );

    return response;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};

// Function to refund a transaction
export const refundTransaction = async (
  transactionId: number,
  data: { reason: string; amount: number }
): Promise<any> => {
  try {
    const response = await poster(
      `/api/admin/transactions/${transactionId}/refund`,
      data
    );
    return response;
  } catch (error) {
    console.error("Error refunding transaction:", error);
    throw error;
  }
};

// Function to get transaction statistics
export const getTransactionStatistics = async (): Promise<{
  totalTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  totalRevenue: string;
}> => {
  try {
    const response = await fetcher('/api/admin/transactions/stats');
    return response?.data || {
      totalTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      totalRevenue: '0.00',
    };
  } catch (error) {
    console.error("Error fetching transaction statistics:", error);
    return {
      totalTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      totalRevenue: '0.00',
    };
  }
};

// Function to get revenue report
export const getRevenueReport = async (
  startDate?: string,
  endDate?: string
): Promise<{
  totalRevenue: number;
  totalRevenue_abbreviated?: string;
  start_date: string;
  end_date: string;
}> => {
  try {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await fetcher('/api/admin/transactions/reports/revenue', params);
    return response?.data || {
      totalRevenue: 0,
      totalRevenue_abbreviated: undefined,
      start_date: startDate || '',
      end_date: endDate || '',
    };
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    return {
      totalRevenue: 0,
      totalRevenue_abbreviated: undefined,
      start_date: startDate || '',
      end_date: endDate || '',
    };
  }
};
