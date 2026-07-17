"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  BulkStatusItemStatus,
  BulkStatusJobOrderItem,
  getBulkStatusJobOrders,
  isTerminalBulkStatusJob,
} from "@/services/apiOrder";
import TablePagination from "@/components/Shared/TablePagination";
import {
  formatItemStatus,
  getJobProgressKey,
  itemStatusChipColor,
} from "./bulkStatusJobUtils";
import type { BulkJobState } from "./bulkStatusJobUtils";

const ITEM_STATUS_TABS: Array<{ value: BulkStatusItemStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "queued", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
];

interface BulkStatusJobOrdersSectionProps {
  job: BulkJobState;
  fetchEnabled?: boolean;
}

const BulkStatusJobOrdersSection = ({
  job,
  fetchEnabled = true,
}: BulkStatusJobOrdersSectionProps) => {
  const [itemStatusFilter, setItemStatusFilter] = useState<
    BulkStatusItemStatus | "all"
  >("all");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<BulkStatusJobOrderItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summary, setSummary] = useState<Record<BulkStatusItemStatus, number> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInFlightRef = useRef(false);

  const jobTerminal =
    job.pollData !== null && isTerminalBulkStatusJob(job.pollData.status);
  const progressKey = getJobProgressKey(job);

  const fetchOrders = useCallback(async () => {
    if (!fetchEnabled || fetchInFlightRef.current) return;

    fetchInFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await getBulkStatusJobOrders(job.meta.jobId, {
        page,
        limit: 50,
        ...(itemStatusFilter !== "all" ? { item_status: itemStatusFilter } : {}),
      });

      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Failed to load job orders");
      }

      setOrders(response.data.orders);
      setSummary(response.data.summary);
      setTotalPages(response.data.pagination.total_pages);
      setTotalRecords(response.data.pagination.total);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "Failed to load per-order status.";
      setError(message);
    } finally {
      setLoading(false);
      fetchInFlightRef.current = false;
    }
  }, [fetchEnabled, itemStatusFilter, job.meta.jobId, page]);

  useEffect(() => {
    if (!fetchEnabled) return;
    void fetchOrders();
  }, [fetchEnabled, fetchOrders, progressKey]);

  useEffect(() => {
    setPage(1);
  }, [itemStatusFilter]);

  if (!fetchEnabled) {
    return null;
  }

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 1.5, py: 1, bgcolor: "action.hover" }}>
        <Typography variant="subtitle2" fontWeight="medium">
          Orders in batch
        </Typography>
        {summary && (
          <Typography variant="caption" color="text.secondary">
            {summary.completed} completed · {summary.queued} queued ·{" "}
            {summary.processing} processing · {summary.failed} failed
          </Typography>
        )}
      </Box>

      <Tabs
        value={itemStatusFilter}
        onChange={(_, value) => setItemStatusFilter(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40 }}
      >
        {ITEM_STATUS_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            sx={{ minHeight: 40, py: 0.5, textTransform: "none" }}
          />
        ))}
      </Tabs>

      {loading && orders.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography variant="body2" color="error" sx={{ p: 2 }}>
          {error}
        </Typography>
      ) : orders.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          {jobTerminal
            ? "No orders match this filter."
            : "No per-order data yet — job may still be starting."}
        </Typography>
      ) : (
        <List dense disablePadding sx={{ maxHeight: 280, overflow: "auto" }}>
          {orders.map((order) => (
            <ListItem key={order.order_id} divider>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {order.order_unique_id || `Order #${order.order_id}`}
                    </Typography>
                    <Chip
                      size="small"
                      label={formatItemStatus(order.item_status)}
                      color={itemStatusChipColor(order.item_status)}
                    />
                  </Box>
                }
                secondary={order.error || undefined}
                secondaryTypographyProps={{ variant: "caption", color: "error" }}
              />
            </ListItem>
          ))}
        </List>
      )}

      {totalPages > 1 && (
        <Box sx={{ borderTop: 1, borderColor: "divider" }}>
          <TablePagination
            page={page}
            totalPages={totalPages}
            limit={50}
            totalRecords={totalRecords}
            onPageChange={setPage}
            onLimitChange={() => {}}
          />
        </Box>
      )}
    </Box>
  );
};

export default BulkStatusJobOrdersSection;
