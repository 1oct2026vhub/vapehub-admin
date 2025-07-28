import React, { useMemo, useState, useEffect, useCallback } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import MenuIcon from "@mui/icons-material/Menu";
import dayjs from "dayjs";
import useColumnOrder from "@/hooks/useColumnOrder";
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
import { formatDate, formatCurrency, formatCustomerNameSafely } from "@/utils/actions";
import TransactionStatusChip from "./TransactionStatusChip";
import TransactionTypeChip from "./TransactionTypeChip";
import TransactionFilters from "./TransactionFilters";
import GenerateReportButton from "./GenerateReportButton";

interface TransactionsTableProps {
  statusFilter?: TransactionStatus;
  typeFilter?: TransactionType;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: dayjs.Dayjs | null) => void;
  onEndDateChange?: (date: dayjs.Dayjs | null) => void;
}

const TransactionsTable = ({
  statusFilter: initialStatusFilter,
  typeFilter: initialTypeFilter,
  searchQuery: initialSearch,
  startDate: initialStartDate,
  endDate: initialEndDate,
  onStartDateChange,
  onEndDateChange,
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
  const [hasUserFiltered, setHasUserFiltered] = useState(false);

  // Initial setup of filters from props
  useEffect(() => {
    // Only update if we haven't set initial values yet and they are provided
    if (!startDateFilter && initialStartDate) {
      const date = dayjs(initialStartDate);
      setStartDateFilter(date);
    }

    if (!endDateFilter && initialEndDate) {
      const date = dayjs(initialEndDate);
      setEndDateFilter(date);
    }
  }, []); // Empty dependency array = only run once on mount

  // Update filters when props change
  useEffect(() => {
    if (
      initialStartDate &&
      (!startDateFilter ||
        initialStartDate !== startDateFilter.format("YYYY-MM-DD"))
    ) {
      setStartDateFilter(dayjs(initialStartDate));
    }

    if (
      initialEndDate &&
      (!endDateFilter || initialEndDate !== endDateFilter.format("YYYY-MM-DD"))
    ) {
      setEndDateFilter(dayjs(initialEndDate));
    }
  }, [initialStartDate, initialEndDate]);

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

  const handleStartDateFilterChange = (date: dayjs.Dayjs | null) => {
    setStartDateFilter(date);
    if (onStartDateChange) {
      onStartDateChange(date);
    }
  };

  const handleEndDateFilterChange = (date: dayjs.Dayjs | null) => {
    setEndDateFilter(date);
    if (onEndDateChange) {
      onEndDateChange(date);
    }
  };

  const handleClearFilters = useCallback(() => {
    setStatus("");
    setTransactionType("");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSearch("");
    setPage(1);

    if (onStartDateChange) {
      onStartDateChange(null);
    }

    if (onEndDateChange) {
      onEndDateChange(null);
    }
  }, [onStartDateChange, onEndDateChange]);

  useEffect(() => {
    if (data?.data) {
      setTransactions(data.data.transactions || []);
      if (data.data.pagination) {
        setTotalRecords(data.data.pagination.total || 0);
        setTotalPages(data.data.pagination.totalPages || 1);
      }
    }
  }, [data]);

  const handleViewDetails = useCallback(
    (transactionId: number) => {
      router.push(`/apps/transaction/detail/${transactionId}`);
    },
    [router]
  );

  // Rename columns to defaultColumns
  const defaultColumns = useMemo<MRT_ColumnDef<any>[]>(() => [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      size: 170,
      Cell: ({ row }) => row.original.referenceNumber || "N/A",
    },
    {
      id: 'orderId',
      accessorFn: (row) => row.order?.order_unique_id,
      header: "Order ID",
      Cell: ({ row }) => {
        return row.original.order?.order_unique_id || "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      Cell: ({ row }) => {
        const rawStatus = row.original.status;
        const status = typeof rawStatus === 'string' 
          ? rawStatus.toLowerCase() as TransactionStatus
          : 'pending';
        return <TransactionStatusChip status={status} />;
      },
    },
    {
      accessorKey: "user",
      header: "Customer",
      Cell: ({ row }) => {
        const user = row.original.user;
        return user 
          ? formatCustomerNameSafely(`${user.first_name || ""} ${user.last_name || "N/A"}`)
          : "N/A";
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      Cell: ({ row }) => {
        return row.original.user?.email || "N/A";
      },
    },
    {
      accessorKey: "transactionType",
      header: "Type",
      Cell: ({ row }) => {
        const rawType = row.original.transactionType;
        const type = typeof rawType === 'string' 
          ? rawType.toLowerCase() as TransactionType
          : 'purchase';
        return <TransactionTypeChip type={type} />;
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      Cell: ({ row }) => {
        const method = row.original.paymentMethod;
        return method ? method.charAt(0).toUpperCase() + method.slice(1) : "N/A";
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      Cell: ({ row }) => {
        const amountValue = row.original.amount;
        if (amountValue === null || amountValue === undefined) {
          return "N/A";
        }
        const amount = parseFloat(amountValue);
        return !isNaN(amount) ? formatCurrency(amount, row.original.currency) : "N/A";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      Cell: ({ row }) => {
        return row.original.createdAt ? formatDate(row.original.createdAt) : "N/A";
      },
    },
  ], []);

  // Use the column order hook
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('transactions', defaultColumns);

  // When the page changes
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
  };

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    return (
      search !== "" ||
      status !== "" ||
      transactionType !== "" ||
      startDateFilter !== null ||
      endDateFilter !== null
    );
  }, [search, status, transactionType, startDateFilter, endDateFilter]);
  // --- END ADD ---

  // --- Wrapper functions to track user interaction ---
  const handleSearchChangeWithInteraction = (value: string) => {
    setSearch(value);
    setHasUserFiltered(true);
  };

  const handleStatusChangeWithInteraction = (value: TransactionStatus | "") => {
    setStatus(value);
    setHasUserFiltered(true);
  };

  const handleTransactionTypeChangeWithInteraction = (value: TransactionType | "") => {
    setTransactionType(value);
    setHasUserFiltered(true);
  };

  const handleStartDateChangeWithInteraction = (date: dayjs.Dayjs | null) => {
    handleStartDateFilterChange(date);
    setHasUserFiltered(true);
  };

  const handleEndDateChangeWithInteraction = (date: dayjs.Dayjs | null) => {
    handleEndDateFilterChange(date);
    setHasUserFiltered(true);
  };

  // Modified clear filters handler to reset interaction flag
  const handleClearFiltersWithInteraction = useCallback(() => {
    handleClearFilters();
    setHasUserFiltered(false);
  }, [handleClearFilters]);

  if (isLoading || (apiLoading && transactions.length === 0))
    return <FuseLoading />;
  if (error) return <p>Failed to load transactions</p>;

  return (
    <div>
      <div className="flex items-end justify-end mb-4">
        <Box>
          <GenerateReportButton
            status={status || undefined}
            transactionType={transactionType || undefined}
            startDate={
              startDateFilter ? startDateFilter.format("YYYY-MM-DD") : undefined
            }
            endDate={
              endDateFilter ? endDateFilter.format("YYYY-MM-DD") : undefined
            }
            disabled={isLoading}
          />
        </Box>
      </div>
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
              onSearchChange={handleSearchChangeWithInteraction}
              onStatusChange={handleStatusChangeWithInteraction}
              onTransactionTypeChange={handleTransactionTypeChangeWithInteraction}
              onStartDateChange={handleStartDateChangeWithInteraction}
              onEndDateChange={handleEndDateChangeWithInteraction}
              onClearFilters={handleClearFiltersWithInteraction}
              areFiltersActive={areFiltersActive}
              hasUserFiltered={hasUserFiltered}
            />
          </Box>
        </div>

        <DataTable
          data={transactions}
          columns={orderedColumns}
          enableColumnOrdering
          onColumnOrderChange={onColumnOrderChange}
          state={{ columnOrder }}
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
    </div>
  );
};

export default TransactionsTable;
