import { fetcher, updater } from "./apiService";

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
export type TransactionType = 
  | "purchase" 
  | "refund" 
  | "payout";

// Payment method types
export type PaymentMethod = 
  | "worldPay" 
  | "stripe" 
  | "paypal" 
  | "bank_transfer";

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
export const getTransactionById = async (transactionId: number): Promise<Transaction> => {
  const response = await fetcher(`/api/admin/transactions/${transactionId}`);
  return response?.data;
};

// Function to generate transactions report (Excel)
export const generateTransactionReport = async (
  status?: TransactionStatus,
  transactionType?: TransactionType,
  startDate?: string,
  endDate?: string
): Promise<void> => {
  try {
    // Build params object
    const params: any = {};
    if (status) params.status = status;
    if (transactionType) params.transactionType = transactionType;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    // Use axiosInstance with blob response type
    const response = await fetch(`/api/admin/transactions/report?${new URLSearchParams(params)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    const blob = await response.blob();
    
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    // Set filename with current date
    const today = new Date().toISOString().split('T')[0];
    link.download = `transactions-report-${today}.xlsx`;

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