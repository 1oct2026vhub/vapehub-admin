import axiosInstance from "@/utils/axiosApi";

export type AbandonedCartSummaryPeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface AbandonedCartRecord {
  order_id?: string | number;
  orderId?: string | number;
  customer_email?: string;
  customerEmail?: string;
  customer_name?: string;
  customerName?: string;
  abandoned_at?: string;
  abandonedAt?: string;
  status?: string;
  total?: number | string;
  [key: string]: unknown;
}

export interface AbandonedCartSummaryTotals {
  abandoned_carts: number;
  email1_sent: number;
  email2_sent: number;
  recovered_orders: number;
  recovered_revenue: number;
  cancelled_orders: number;
  superseded_orders: number;
}

export interface AbandonedCartSummaryPerformanceItem {
  key: string;
  abandoned_carts?: number;
  email1_sent?: number;
  email2_sent?: number;
  recovered_orders?: number;
  cancelled_orders?: number;
  superseded_orders?: number;
  recovered_revenue?: number;
}

export interface AbandonedCartsResponse {
  success?: boolean;
  message?: string;
  items?: AbandonedCartRecord[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
    totalPages?: number;
  };
  data?: {
    items?: AbandonedCartRecord[];
    carts?: AbandonedCartRecord[];
    abandoned_carts?: AbandonedCartRecord[];
    orders?: AbandonedCartRecord[];
    pagination?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
  } | AbandonedCartRecord[];
}

export interface AbandonedCartSummaryResponse {
  success?: boolean;
  message?: string;
  data?: {
    totals?: Partial<AbandonedCartSummaryTotals>;
    performance?: AbandonedCartSummaryPerformanceItem[];
  };
}

export interface AbandonedCartDetailResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

const BASE = "/api/admin/abandoned-carts";

export async function getAbandonedCarts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<AbandonedCartsResponse> {
  const { data } = await axiosInstance.get<AbandonedCartsResponse>(BASE, { params });
  return data;
}

export async function getAbandonedCartsSummary(
  period: AbandonedCartSummaryPeriod,
): Promise<AbandonedCartSummaryResponse> {
  const { data } = await axiosInstance.get<AbandonedCartSummaryResponse>(`${BASE}/summary`, {
    params: { period },
  });
  return data;
}

export async function getAbandonedCartByOrderId(
  orderId: string,
): Promise<AbandonedCartDetailResponse> {
  const { data } = await axiosInstance.get<AbandonedCartDetailResponse>(
    `${BASE}/${encodeURIComponent(orderId)}`,
  );
  return data;
}
