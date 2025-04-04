import React, { useMemo, useState, useEffect, useCallback } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import MenuIcon from "@mui/icons-material/Menu";
import dayjs from "dayjs";
import {
  ListItemIcon,
  MenuItem,
  Paper,
  IconButton,
  Box,
  Pagination,
  PaginationItem,
  Typography,
} from "@mui/material";
import {
  getTransactions,
  TransactionStatus,
  TransactionType,
} from "@/services/apiTransaction";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { formatDate } from "@/utils/actions";
import TransactionStatusChip from "./TransactionStatusChip";
import TransactionTypeChip from "./TransactionTypeChip";
import TransactionFilters from "./TransactionFilters";

interface TransactionsTableProps {
  statusFilter?: TransactionStatus;
  typeFilter?: TransactionType;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

const TransactionsTable = ({
  statusFilter: initialStatusFilter,
  typeFilter: initialTypeFilter,
  searchQuery: initialSearch,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: TransactionsTableProps) => {
  const router = useRouter();
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [sortBy, setSortBy] = useState<string>("id");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState<TransactionStatus | "">(
    initialStatusFilter || ""
  );
  const [transactionType, setTransactionType] = useState<TransactionType | "">(
    initialTypeFilter || ""
  );
  const [startDateFilter, setStartDateFilter] = useState<dayjs.Dayjs | null>(
    initialStartDate ? dayjs(initialStartDate) : null
  );
  const [endDateFilter, setEndDateFilter] = useState<dayjs.Dayjs | null>(
    initialEndDate ? dayjs(initialEndDate) : null
  );

  const queryParams = useMemo(
    () => ({
      sort_by: sortBy,
      order,
      limit,
      page,
      ...(status && { status }),
      ...(transactionType && { transactionType }),
      ...(search && search.length >= 2 && { search }),
      ...(startDateFilter && {
        startDate: startDateFilter.format("YYYY-MM-DD"),
      }),
      ...(endDateFilter && { endDate: endDateFilter.format("YYYY-MM-DD") }),
    }),
    [
      sortBy,
      order,
      status,
      transactionType,
      search,
      startDateFilter,
      endDateFilter,
      page,
      limit,
    ]
  );

  const {
    data,
    error,
    isLoading: apiLoading,
  } = useFetch(["transactionList", queryParams], getTransactions, queryParams);

  const handleClearFilters = useCallback(() => {
    setStatus("");
    setTransactionType("");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSearch("");
    setPage(1);
  }, []);

  useEffect(() => {
    if (data?.data) {
      setTransactions(data.data.transactions || []);
      if (data.data.pagination) {
        setTotalRecords(data.data.pagination.total || 0);
        setTotalPages(data.data.pagination.total_pages || 1);
      }
    }
  }, [data]);

  const handleViewDetails = useCallback(
    (transactionId: number) => {
      router.push(`/apps/transaction/detail/${transactionId}`);
    },
    [router]
  );

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Reference",
        size: 170,
      },
      {
        accessorKey: "order",
        header: "Order ID",
        Cell: ({ row }) => {
          return row.original.order
            ? row.original.order.order_unique_id
            : "N/A";
        },
      },
      {
        accessorKey: "user",
        header: "Customer",
        Cell: ({ row }) => {
          const user = row.original.user;
          return user
            ? `${user.first_name || ""} ${user.last_name || ""}`
            : "Guest";
        },
      },
      {
        accessorKey: "transactionType",
        header: "Type",
        Cell: ({ row }) => {
          const type =
            row.original.transactionType.toLowerCase() as TransactionType;
          return <TransactionTypeChip type={type} />;
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        Cell: ({ row }) => {
          const method = row.original.paymentMethod;
          return method.charAt(0).toUpperCase() + method.slice(1);
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        Cell: ({ row }) => {
          const amount = parseFloat(row.original.amount);
          return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: row.original.currency || "USD",
          }).format(amount);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          const status = row.original.status.toLowerCase() as TransactionStatus;
          return <TransactionStatusChip status={status} />;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        Cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    []
  );

  // When the page changes
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
  };

  if (isLoading || (apiLoading && transactions.length === 0))
    return <FuseLoading />;
  if (error) return <p>Failed to load transactions</p>;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex items-center justify-between p-3 flex-wrap gap-2">
        <Box className="flex flex-col items-start gap-2">
          <TransactionFilters
            search={search}
            status={status}
            transactionType={transactionType}
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onTransactionTypeChange={setTransactionType}
            onStartDateChange={setStartDateFilter}
            onEndDateChange={setEndDateFilter}
            onClearFilters={handleClearFilters}
          />
        </Box>
      </div>

      <DataTable
        data={transactions}
        columns={columns}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          <MenuItem
            key="view"
            onClick={() => {
              handleViewDetails(row.original.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
            </ListItemIcon>
            View Details
          </MenuItem>,
        ]}
      />

      {/* Pagination with additional information */}
      <div className="flex flex-col items-center py-4">
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
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
      </div>
    </Paper>
  );
};

export default TransactionsTable;
