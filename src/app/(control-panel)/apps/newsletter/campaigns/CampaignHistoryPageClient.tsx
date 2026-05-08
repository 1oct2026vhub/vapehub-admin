"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  ListItemIcon,
  MenuItem,
  Pagination,
  Paper,
  PaginationItem,
  Typography,
} from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import { useRouter } from "next/navigation";
import FuseLoading from "@fuse/core/FuseLoading";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import DataTable from "@/components/data-table/DataTable";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getPromotionalCampaigns,
  type PromotionalCampaign,
} from "@/services/apiMailSubscriptionSettings";

type CampaignTableRow = {
  id: number;
  subject?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  sentAt?: string;
  sent_at?: string;
  _campaignRawId: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getCampaignId(campaign: PromotionalCampaign): string {
  const row = asRecord(campaign);
  const id = row.campaignId ?? row.id;
  return id != null ? String(id) : "";
}

function getCampaignSubject(campaign: PromotionalCampaign): string {
  const row = asRecord(campaign);
  return String(row.subject ?? row.title ?? row.name ?? "Untitled campaign");
}

function getCampaignStatus(campaign: PromotionalCampaign): string {
  const row = asRecord(campaign);
  return String(row.status ?? row.state ?? "Unknown");
}

function getCampaignCreatedAt(campaign: PromotionalCampaign): string {
  const row = asRecord(campaign);
  return String(row.createdAt ?? row.created_at ?? row.sentAt ?? row.sent_at ?? "-");
}

export default function CampaignHistoryPageClient() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [rows, setRows] = useState<PromotionalCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const tableRows = useMemo<CampaignTableRow[]>(
    () =>
      rows.map((row, index) => {
        const record = asRecord(row);
        const normalizedId = getCampaignId(row);
        return {
          ...record,
          id: Number(normalizedId) || Number(record.id) || index + 1,
          _campaignRawId: normalizedId,
        } as CampaignTableRow;
      }),
    [rows],
  );

  const columns = useMemo<MRT_ColumnDef<CampaignTableRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        Cell: ({ row }) => row.original._campaignRawId || "-",
      },
      {
        accessorKey: "subject",
        header: "Subject",
        Cell: ({ row }) => getCampaignSubject(row.original as unknown as PromotionalCampaign),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          const status = getCampaignStatus(row.original as unknown as PromotionalCampaign);
          const lower = status.toLowerCase();
          const color =
            lower === "sent" || lower === "completed"
              ? "success"
              : lower === "failed"
                ? "error"
                : lower === "pending" || lower === "queued"
                  ? "warning"
                  : "default";
          return <Chip label={status} color={color} size="small" />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        Cell: ({ row }) => getCampaignCreatedAt(row.original as unknown as PromotionalCampaign),
      },
    ],
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPromotionalCampaigns({ page, limit: pageSize });
      if (!res.success) {
        setRows([]);
        setTotalRecords(0);
        setTotalPages(1);
        showSnackbar(res.message ?? "Failed to load campaign history.", "error");
        return;
      }

      const payload = asRecord(res.data);
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(payload.campaigns)
          ? payload.campaigns
          : [];
      const nextRows = rawList.filter(
        (item): item is PromotionalCampaign => Boolean(item && typeof item === "object"),
      );

      const pagination = asRecord(payload.pagination);
      const totalCount = Number(
        pagination.total ?? pagination.totalCount ?? pagination.count ?? nextRows.length,
      );
      const limit = Number(pagination.limit ?? pagination.pageSize ?? pageSize);

      setRows(nextRows);
      setTotalRecords(totalCount);
      setTotalPages(Math.max(1, Math.ceil(totalCount / Math.max(1, limit))));
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Failed to load campaign history.";
      showSnackbar(msg, "error");
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, showSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && rows.length === 0) {
    return <FuseLoading />;
  }

  return (
    <Box className="p-6">
      <PageBreadcrumb />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          gap: 2,
        }}
      >
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Email history
        </Typography>
      </Box>

      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>
          No campaign history found.
        </Typography>
      ) : (
        <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
          <DataTable
            data={tableRows}
            columns={columns}
            enableColumnOrdering
            hideRowSelectionCheckboxes
            renderRowActionMenuItems={({ closeMenu, row }) => {
              const rawId = row.original._campaignRawId || "";
              return [
                <MenuItem
                  key="view"
                  onClick={() => {
                    if (rawId) {
                      router.push(`/apps/newsletter/campaigns/${encodeURIComponent(rawId)}`);
                    }
                    closeMenu();
                  }}
                  disabled={!rawId}
                >
                  <ListItemIcon>
                    <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                  </ListItemIcon>
                  View
                </MenuItem>,
              ];
            }}
          />
          <Box className="flex justify-center p-4">
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages} ({totalRecords} total)
            </Typography>
          </Box>
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
        </Paper>
      )}
    </Box>
  );
}
