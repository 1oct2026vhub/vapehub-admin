"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  PaginationItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import { useRouter } from "next/navigation";
import DataTable from "@/components/data-table/DataTable";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import {
  type AbandonedCartRecord,
  type AbandonedCartSummaryPerformanceItem,
  type AbandonedCartSummaryPeriod,
  getAbandonedCarts,
  getAbandonedCartsSummary,
} from "@/services/apiAbandonedCarts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Totals = {
  abandoned_carts: number;
  email1_sent: number;
  email2_sent: number;
  recovered_orders: number;
  recovered_revenue: number;
  cancelled_orders: number;
  superseded_orders: number;
};

type AbandonedCartTableRow = AbandonedCartRecord & {
  id: number;
};

const DEFAULT_TOTALS: Totals = {
  abandoned_carts: 0,
  email1_sent: 0,
  email2_sent: 0,
  recovered_orders: 0,
  recovered_revenue: 0,
  cancelled_orders: 0,
  superseded_orders: 0,
};

const METRICS = [
  { key: "abandoned_carts", label: "Abandoned Carts" },
  { key: "email1_sent", label: "Reminder 1 Sent" },
  { key: "email2_sent", label: "Reminder 2 Sent" },
  { key: "recovered_orders", label: "Recovered Orders" },
  { key: "recovered_revenue", label: "Recovered Revenue" },
  { key: "cancelled_orders", label: "Cancelled" },
  { key: "superseded_orders", label: "Superseded" },
] as const;

function getRowsFromListResponse(data: unknown): AbandonedCartRecord[] {
  if (Array.isArray(data)) return data as AbandonedCartRecord[];
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as AbandonedCartRecord[];
  if (Array.isArray(obj.carts)) return obj.carts as AbandonedCartRecord[];
  if (Array.isArray(obj.abandoned_carts)) return obj.abandoned_carts as AbandonedCartRecord[];
  if (Array.isArray(obj.orders)) return obj.orders as AbandonedCartRecord[];
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items as AbandonedCartRecord[];
    if (Array.isArray(nested.carts)) return nested.carts as AbandonedCartRecord[];
    if (Array.isArray(nested.abandoned_carts)) return nested.abandoned_carts as AbandonedCartRecord[];
    if (Array.isArray(nested.orders)) return nested.orders as AbandonedCartRecord[];
  }
  return [];
}

function getPaginationFromListResponse(data: unknown): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;
  const paginationSource =
    (obj.pagination && typeof obj.pagination === "object" ? obj.pagination : null) ??
    (obj.data &&
    typeof obj.data === "object" &&
    (obj.data as Record<string, unknown>).pagination &&
    typeof (obj.data as Record<string, unknown>).pagination === "object"
      ? (obj.data as Record<string, unknown>).pagination
      : null);

  if (!paginationSource || typeof paginationSource !== "object") return null;
  const pagination = paginationSource as Record<string, unknown>;

  const total = numberOrZero(pagination.total);
  const page = Math.max(1, numberOrZero(pagination.page) || 1);
  const limit = Math.max(1, numberOrZero(pagination.limit) || 25);
  const totalPages =
    Math.max(1, numberOrZero(pagination.total_pages) || numberOrZero(pagination.totalPages)) ||
    Math.max(1, Math.ceil(total / limit));

  return { total, page, limit, totalPages };
}

function numberOrZero(value: unknown): number {
  const num = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(num) ? num : 0;
}

export default function AbandonedCartsPageClient() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<AbandonedCartSummaryPeriod>("weekly");
  const [rows, setRows] = useState<AbandonedCartRecord[]>([]);
  const [totals, setTotals] = useState<Totals>(DEFAULT_TOTALS);
  const [performance, setPerformance] = useState<AbandonedCartSummaryPerformanceItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const tableRows = useMemo<AbandonedCartTableRow[]>(
    () =>
      rows.map((row, index) => {
        const numericOrderId =
          typeof row.order_id === "number"
            ? row.order_id
            : typeof row.orderId === "number"
              ? row.orderId
              : Number(row.order_id ?? row.orderId);
        return {
          ...row,
          id: Number.isFinite(numericOrderId) ? numericOrderId : index + 1,
        };
      }),
    [rows],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [listRes, summaryRes] = await Promise.all([
          getAbandonedCarts({ page, limit: pageSize }),
          getAbandonedCartsSummary(period),
        ]);

        setRows(getRowsFromListResponse(listRes));
        const pagination = getPaginationFromListResponse(listRes);
        if (pagination) {
          setTotalRecords(pagination.total);
          setTotalPages(pagination.totalPages);
          setPageSize(pagination.limit);
        }

        const incomingTotals = summaryRes?.data?.totals ?? {};
        setTotals({
          abandoned_carts: numberOrZero(incomingTotals.abandoned_carts),
          email1_sent: numberOrZero(incomingTotals.email1_sent),
          email2_sent: numberOrZero(incomingTotals.email2_sent),
          recovered_orders: numberOrZero(incomingTotals.recovered_orders),
          recovered_revenue: numberOrZero(incomingTotals.recovered_revenue),
          cancelled_orders: numberOrZero(incomingTotals.cancelled_orders),
          superseded_orders: numberOrZero(incomingTotals.superseded_orders),
        });

        setPerformance(Array.isArray(summaryRes?.data?.performance) ? summaryRes.data.performance : []);
      } catch (error: unknown) {
        const msg =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "Failed to load abandoned carts.";
        showSnackbar(msg, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [period, page, pageSize, showSnackbar]);

  const columns = useMemo<MRT_ColumnDef<AbandonedCartTableRow>[]>(
    () => [
      {
        accessorKey: "order_id",
        header: "Order ID",
        Cell: ({ row }) =>
          String(row.original.order_unique_id ?? row.original.order_id ?? row.original.orderId ?? "-"),
      },
      {
        accessorKey: "customer_email",
        header: "Customer",
        Cell: ({ row }) =>
          String(
            row.original.customer_email ??
              row.original.customerEmail ??
              (row.original.user as { email?: string } | undefined)?.email ??
              "-",
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => String(row.original.status ?? "-"),
      },
      {
        accessorKey: "abandoned_at",
        header: "Abandoned At",
        Cell: ({ row }) => {
          const rawDate =
            row.original.abandoned_at ??
            row.original.abandonedAt ??
            (row.original.createdAt as string | undefined);
          return rawDate ? formatDate(String(rawDate)) : "N/A";
        },
      },
      {
        accessorKey: "total",
        header: "Order Total",
        Cell: ({ row }) => String(row.original.total ?? "-"),
      },
    ],
    [],
  );

  const chartCategories = performance.map((item) => item.key);
  const chartSeries = METRICS.map((metric) => ({
    name: metric.label,
    data: performance.map((item) => numberOrZero(item[metric.key])),
  }));

  const chartOptions = {
    chart: {
      type: "line" as const,
      toolbar: { show: false },
    },
    stroke: { width: 2, curve: "smooth" as const },
    xaxis: {
      categories: chartCategories,
      title: { text: "Period" },
    },
    yaxis: {
      min: 0,
    },
    legend: {
      position: "top" as const,
    },
  };

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as AbandonedCartSummaryPeriod);
    setPage(1);
  };

  return (
    <Box className="p-6">
      <PageBreadcrumb />
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ mb: 2 }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Abandoned carts
        </Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="abandoned-carts-period">Period</InputLabel>
          <Select
            labelId="abandoned-carts-period"
            value={period}
            label="Period"
            onChange={handlePeriodChange}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {METRICS.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.key}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {Number(totals[item.key]).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Abandoned cart performance
          </Typography>
          {loading ? (
            <Typography color="text.secondary">Loading chart...</Typography>
          ) : performance.length === 0 ? (
            <Typography color="text.secondary">No chart data available.</Typography>
          ) : (
            <Chart type="line" options={chartOptions} series={chartSeries} height={360} />
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Abandoned cart orders
          </Typography>
          <DataTable
            data={tableRows}
            columns={columns}
            state={{ isLoading: loading }}
            enableColumnOrdering
            hideRowSelectionCheckboxes
            renderRowActionMenuItems={({ row, closeMenu }) => {
              const orderId = String(row.original.order_id ?? row.original.orderId ?? "");
              return [
                <MenuItem
                  key="view"
                  disabled={!orderId}
                  onClick={() => {
                    if (orderId) {
                      router.push(`/apps/newsletter/abandoned-carts/${encodeURIComponent(orderId)}`);
                    }
                    closeMenu();
                  }}
                >
                  View details
                </MenuItem>,
              ];
            }}
          />
          {/* <Box className="flex justify-center p-4">
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages} ({totalRecords.toLocaleString()} total)
            </Typography>
          </Box> */}
          <Box className="flex justify-center p-4 pt-0">
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              shape="rounded"
              color="primary"
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                  className="text-gray-600 hover:text-[#2E9970]"
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "#2E9970",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#247C5C",
                      },
                    },
                  }}
                />
              )}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
