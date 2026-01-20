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
import TablePagination from "@/components/Shared/TablePagination";
import { usePageState } from "@/hooks/usePageState";

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
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "transactionsTable",
    {
      order: "DESC" as "ASC" | "DESC",
      sortBy: "id",
      page: 1,
      search: initialSearch || "",
      status: (initialStatusFilter || "") as TransactionStatus | "",
      transactionType: (initialTypeFilter || "") as TransactionType | "",
      startDate: initialStartDate || null,
      endDate: initialEndDate || null,
    }
  );

  // Use pageState values directly
  const { order, sortBy, page, search, status, transactionType, startDate, endDate } = pageState;
  const [limit, setLimit] = useState(100);
  const [transactions, setTransactions] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Convert date strings to dayjs objects
  const startDateFilter = startDate ? dayjs(startDate) : null;
  const endDateFilter = endDate ? dayjs(endDate) : null;
  
  // Helper functions to update pageState
  const setOrder = (value: "ASC" | "DESC") => setPageState(prev => ({ ...prev, order: value }));
  const setSortBy = (value: string) => setPageState(prev => ({ ...prev, sortBy: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setStatus = (value: TransactionStatus | "") => setPageState(prev => ({ ...prev, status: value }));
  const setTransactionType = (value: TransactionType | "") => setPageState(prev => ({ ...prev, transactionType: value }));
  
  const setStartDateFilter = (date: dayjs.Dayjs | null) => {
    setPageState(prev => ({ ...prev, startDate: date ? date.format("YYYY-MM-DD") : null }));
    if (onStartDateChange) {
      onStartDateChange(date);
    }
  };
  
  const setEndDateFilter = (date: dayjs.Dayjs | null) => {
    setPageState(prev => ({ ...prev, endDate: date ? date.format("YYYY-MM-DD") : null }));
    if (onEndDateChange) {
      onEndDateChange(date);
    }
  };
  
  const [hasUserFiltered, setHasUserFiltered] = useState(false);

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  // Update filters when props change (only if not already set in session storage)
  useEffect(() => {
    if (initialStartDate && !startDate) {
      setStartDateFilter(dayjs(initialStartDate));
    }

    if (initialEndDate && !endDate) {
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
  };

  const handleEndDateFilterChange = (date: dayjs.Dayjs | null) => {
    setEndDateFilter(date);
  };

  const handleClearFilters = useCallback(() => {
    setStatus("");
    setTransactionType("");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSearch("");
    setPage(1);
    clearPageState(); // Clear session storage
  }, [clearPageState]);

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
          manualPagination={true}
          hideRowSelectionCheckboxes={true}
          state={{ 
            columnOrder,
            pagination: {
              pageIndex: 0,
              pageSize: transactions.length || limit || 1000
            }
          }}
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

        <TablePagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalRecords={totalRecords}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </Paper>
    </div>
  );
};

export default TransactionsTable;
