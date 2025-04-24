"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
import { getOrders, OrderStatus, PaymentStatus } from "@/services/apiOrder";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { formatDate, formatCurrency, formatPounds, formatStatusText } from "@/utils/actions";
import OrderStatusChip from "./OrderStatusChip";
import PaymentStatusChip from "./PaymentStatusChip";
import OrderFilters from "./OrderFilters";
import OrderFilterDrawer from "./OrderFilterDrawer";
import GenerateReportButton from "./GenerateReportButton";
import OrderStatistics from "./OrderStatistics";
import relativeTime from "dayjs/plugin/relativeTime";
import useColumnOrder from "@/hooks/useColumnOrder";

// Initialize dayjs plugins
dayjs.extend(relativeTime);

// Constants for localStorage keys
const COLUMNS_ORDER_KEY = 'ordersTableColumnsOrder';

// Custom relative time formatter
const formatExactRelativeTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  
  const now = dayjs();
  const date = dayjs(dateString);
  const diffSeconds = now.diff(date, 'second');
  const diffMinutes = now.diff(date, 'minute');
  const diffHours = now.diff(date, 'hour');
  const diffDays = now.diff(date, 'day');
  if (diffSeconds < 60) return `${diffSeconds} ${diffSeconds === 1 ? 'second' : 'seconds'} ago`;
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};
interface OrdersTableProps {
  statusFilter?: OrderStatus;
  paymentStatusFilter?: PaymentStatus;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

const OrdersTable = ({
  statusFilter: initialStatusFilter,
  paymentStatusFilter: initialPaymentFilter,
  searchQuery: initialSearch,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: OrdersTableProps) => {
  const router = useRouter();
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [sortBy, setSortBy] = useState<string>("id");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [orders, setOrders] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch || "");
  const [searchInput, setSearchInput] = useState(initialSearch || "");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set default date filters - from 1 month ago to today
  const [startDateFilter, setStartDateFilter] = useState<dayjs.Dayjs | null>(
    initialStartDate ? dayjs(initialStartDate) : dayjs().subtract(1, 'month')
  );
  const [endDateFilter, setEndDateFilter] = useState<dayjs.Dayjs | null>(
    initialEndDate ? dayjs(initialEndDate) : dayjs()
  );

  // Handle search input changes with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    // Clear any existing timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Set a new timer to update search state after delay
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value);
      // Reset to page 1 when search changes
      setPage(1);
    }, 500); // 500ms debounce delay
  }, []);

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const queryParams = useMemo(
    () => ({
      sort_by: sortBy,
      order,
      limit,
      page,
      ...(status && { status }),
      ...(paymentStatus && { payment_status: paymentStatus }),
      ...(search && { search }),
      ...(startDateFilter && {
        start_date: startDateFilter.format("YYYY-MM-DD"),
      }),
      ...(endDateFilter && { end_date: endDateFilter.format("YYYY-MM-DD") }),
    }),
    [
      sortBy,
      order,
      status,
      paymentStatus,
      search, // This will now only change after debounce
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
  } = useFetch(["orderList", queryParams], getOrders, queryParams);

  const handleClearFilters = useCallback(() => {
    setStatus("");
    setPaymentStatus("");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSearch("");
    setPage(1);
  }, []);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    try {
      setOrders([]);
      setIsLoading(true);
      setManuallyRefreshing(true);

      const freshData = await getOrders(queryParams);

      if (freshData?.data) {
        setOrders(freshData.data.orders || []);
        if (freshData.data.pagination) {
          setTotalRecords(freshData.data.pagination.total || 0);
          setTotalPages(freshData.data.pagination.total_pages || 1);
        }
      }

      await mutate(["orderList", queryParams]);
    } catch (error) {
      console.error("Failed to refresh order data:", error);
    } finally {
      setIsLoading(false);
      setManuallyRefreshing(false);
    }
  }, [queryParams]);

  useEffect(() => {
    if (data?.data) {
      setOrders(data.data.orders || []);
      if (data.data.pagination) {
        setTotalRecords(data.data.pagination.total || 0);
        setTotalPages(data.data.pagination.total_pages || 1);
      }
    }
  }, [data]);

  const handleViewDetails = useCallback((orderId: number) => {
    router.push(`/apps/order/detail/${orderId}`);
  }, [router]);

  // Format date as relative time
  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return "N/A";
    return formatExactRelativeTime(dateString);
  };

  // Default column definition
  const defaultColumns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      { accessorKey: "order_unique_id", header: "Order ID" },
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
        accessorKey: "total",
        header: "Total",
        Cell: ({ row }) => {
          const total = parseFloat(row.original.total);
          return formatPounds(total);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => <OrderStatusChip status={row.original.status} />,
      },
      // {
      //   accessorKey: "payment_status",
      //   header: "Payment",
      //   Cell: ({ row }) => (
      //     <PaymentStatusChip
      //       status={row.original.payment_status || "N/A"}
      //     />
      //   ),
      // },
      {
        accessorKey: "orderItems",
        header: "Items",
        Cell: ({ row }) => row.original.orderItems?.length || 0,
      },
      {
        accessorKey: "updatedAt",
        header: "Date",
        Cell: ({ row }) => formatRelativeTime(row.original.updatedAt),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        Cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    []
  );

  // Use our custom hook for column ordering
  const { columns, columnOrder, onColumnOrderChange } = useColumnOrder('orders', defaultColumns);

  // When the page changes
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  if (isLoading || manuallyRefreshing || (apiLoading && orders.length === 0))
    return <FuseLoading />;
  if (error) return <p>Failed to load orders</p>;

  return (
    <>
      <OrderStatistics 
        externalStartDate={startDateFilter?.format("YYYY-MM-DD")}
        externalEndDate={endDateFilter?.format("YYYY-MM-DD")}
        className="mb-6"
      />
      
      <div className="flex items-end justify-end mb-4">
        <Box className="flex items-end gap-2 juustify-end">
          <GenerateReportButton 
            status={status || undefined}
            paymentStatus={paymentStatus || undefined}
            startDate={startDateFilter ? startDateFilter.format("YYYY-MM-DD") : undefined}
            endDate={endDateFilter ? endDateFilter.format("YYYY-MM-DD") : undefined}
          />
        </Box>
      </div>
      
      <Paper
        className="flex flex-col flex-auto shadow-1 overflow-hidden"
        elevation={0}
      >
        <div className="flex items-center justify-between p-3 flex-wrap gap-2">
          <Box className="flex items-center gap-2 flex-grow">
            <OrderFilters
              search={searchInput}
              status={status}
              paymentStatus={paymentStatus}
              startDateFilter={startDateFilter}
              endDateFilter={endDateFilter}
              onSearchChange={handleSearchChange}
              onStatusChange={setStatus}
              onPaymentStatusChange={setPaymentStatus}
              onStartDateChange={setStartDateFilter}
              onEndDateChange={setEndDateFilter}
              onClearFilters={handleClearFilters}
              className="hidden md:flex"
            />

            <IconButton
              className="md:hidden"
              onClick={() => setOpenDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          
        </div>

        <DataTable
          data={orders}
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
          enableColumnOrdering
          onColumnOrderChange={onColumnOrderChange}
          state={{ columnOrder }}
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
          {/* {totalRecords > 0 && (
            <Typography variant="body2" color="text.secondary" className="mt-2">
              Showing page {page} of {totalPages} ({totalRecords} total records)
            </Typography>
          )} */}
        </div>
      </Paper>

      <OrderFilterDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        search={searchInput}
        status={status}
        paymentStatus={paymentStatus}
        startDateFilter={startDateFilter}
        endDateFilter={endDateFilter}
        sortBy={sortBy}
        order={order}
        onSearchChange={handleSearchChange}
        onStatusChange={setStatus}
        onPaymentStatusChange={setPaymentStatus}
        onStartDateChange={setStartDateFilter}
        onEndDateChange={setEndDateFilter}
        onSortByChange={setSortBy}
        onOrderChange={setOrder}
        onClearFilters={handleClearFilters}
        onApplyFilters={refreshData}
      />
    </>
  );
};

export default OrdersTable;
