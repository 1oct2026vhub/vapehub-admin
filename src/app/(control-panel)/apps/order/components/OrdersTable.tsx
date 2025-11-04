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
import { formatCustomerNameSafely } from "@/utils/actions";
import { listProducts } from "@/services/apiProduct";
import TablePagination from "@/components/Shared/TablePagination";

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
  const [limit, setLimit] = useState(100);
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
  const [hasUserFiltered, setHasUserFiltered] = useState(false);

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  // Product filter state
  interface Product { id: number; name: string }
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
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

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    return (
      search !== "" ||
      status !== "" ||
      paymentStatus !== "" ||
      selectedProduct !== null ||
      startDateFilter !== null || // Check for non-null start date
      endDateFilter !== null || // Check for non-null end date
      // Consider if default dates count as 'active'. Assuming null means 'not set'.
      // If you want the button to show even with default dates, adjust logic here.
      (initialStartDate && startDateFilter?.format("YYYY-MM-DD") !== initialStartDate) ||
      (initialEndDate && endDateFilter?.format("YYYY-MM-DD") !== initialEndDate)
    );
  }, [search, status, paymentStatus, selectedProduct, startDateFilter, endDateFilter, initialStartDate, initialEndDate]);
  // --- END ADD ---

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
      ...(selectedProduct && { product_id: selectedProduct.id }),
    }),
    [
      sortBy,
      order,
      status,
      paymentStatus,
      search, // This will now only change after debounce
      startDateFilter,
      endDateFilter,
      selectedProduct,
      page,
      limit,
    ]
  );

  const {
    data,
    error,
    isLoading: apiLoading,
  } = useFetch(["orderList", queryParams], getOrders, queryParams);

  // --- Wrapper functions to track user interaction ---
  const handleSearchChangeWithInteraction = useCallback((value: string) => {
    handleSearchChange(value); // Call original debounced handler
    setHasUserFiltered(true);
  }, [handleSearchChange]);

  const handleStatusChangeWithInteraction = (value: OrderStatus | "") => {
    setStatus(value);
    setHasUserFiltered(true);
  };

  const handlePaymentStatusChangeWithInteraction = (value: PaymentStatus | "") => {
    setPaymentStatus(value);
    setHasUserFiltered(true);
  };

  const handleStartDateChangeWithInteraction = (date: dayjs.Dayjs | null) => {
    setStartDateFilter(date);
    setHasUserFiltered(true);
  };

  const handleEndDateChangeWithInteraction = (date: dayjs.Dayjs | null) => {
    setEndDateFilter(date);
    setHasUserFiltered(true);
  };

  // Original clear filters logic
  const clearFiltersLogic = useCallback(() => {
    setStatus("");
    setPaymentStatus("");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSearch("");
    setSearchInput(""); // Clear search input as well
    if (searchDebounceRef.current) { // Clear any pending debounce timer
        clearTimeout(searchDebounceRef.current);
    }
    setSelectedProduct(null);
    setProductSearch("");
    setDebouncedProductSearch("");
    setPage(1);
  }, []);

  // Modified clear filters handler to reset interaction flag
  const handleClearFiltersWithInteraction = useCallback(() => {
    clearFiltersLogic();
    setHasUserFiltered(false); // Reset interaction flag
  }, [clearFiltersLogic]);

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

  // Debounce product search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Fetch products for product filter
  const fetchProducts = useCallback(async (keyword: string) => {
    try {
      setIsLoadingProducts(true);
      if (!keyword.trim()) {
        const response = await listProducts({ limit: 50 });
        setProducts(response.data?.products || []);
      } else {
        const response = await listProducts({ keyword, limit: 20 });
        setProducts(response.data?.products || []);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load initial products
  useEffect(() => {
    fetchProducts("");
  }, [fetchProducts]);

  // Fetch products on debounced search change
  useEffect(() => {
    fetchProducts(debouncedProductSearch);
  }, [debouncedProductSearch, fetchProducts]);

  const handleViewDetails = useCallback((orderId: number) => {
    router.push(`/apps/order/detail/${orderId}`);
  }, [router]);

  // Format date as relative time
  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return "N/A";
    return formatExactRelativeTime(dateString);
  };

  // Default column definition
  const defaultColumns = useMemo<MRT_ColumnDef<any>[]>(() => [
    {
      accessorKey: "order_unique_id",
      header: "Order ID",
      Cell: ({ row }) => row.original.order_unique_id || "N/A",
    },
    {
      id: 'user',
      header: "Customer",
      accessorFn: (row) => formatCustomerNameSafely(row.user),
      Cell: ({ cell }) => cell.getValue<string>(),
    },
    {
      accessorKey: "total",
      header: "Total",
      Cell: ({ row }) => {
        const totalValue = row.original.total;
        if (totalValue === null || totalValue === undefined) {
          return "N/A";
        }
        const total = parseFloat(totalValue);
        return !isNaN(total) ? formatPounds(total) : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      Cell: ({ row }) => row.original.status ? <OrderStatusChip status={row.original.status} /> : "N/A",
    },
    {
      accessorKey: "orderItems",
      header: "Items",
      Cell: ({ row }) => row.original.orderItems?.length || 0,
    },
    {
      accessorKey: "updatedAt",
      header: "Date",
      Cell: ({ row }) => row.original.updatedAt ? formatRelativeTime(row.original.updatedAt) : "N/A",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      Cell: ({ row }) => row.original.createdAt ? formatDate(row.original.createdAt) : "N/A",
    },
  ], []);

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
              onSearchChange={handleSearchChangeWithInteraction}
              onStatusChange={handleStatusChangeWithInteraction}
              onPaymentStatusChange={handlePaymentStatusChangeWithInteraction}
              onStartDateChange={handleStartDateChangeWithInteraction}
              onEndDateChange={handleEndDateChangeWithInteraction}
              onClearFilters={handleClearFiltersWithInteraction}
              areFiltersActive={areFiltersActive}
              hasUserFiltered={hasUserFiltered}
              products={products}
              selectedProduct={selectedProduct}
              productSearch={productSearch}
              onProductChange={(product) => { setSelectedProduct(product); setHasUserFiltered(true); }}
              onProductSearchChange={(value) => { setProductSearch(value); setHasUserFiltered(true); }}
              isLoadingProducts={isLoadingProducts}
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
          manualPagination={true}
          state={{ 
            columnOrder,
            pagination: {
              pageIndex: 0,
              pageSize: orders.length || limit || 1000
            }
          }}
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
        onSearchChange={handleSearchChangeWithInteraction}
        onStatusChange={handleStatusChangeWithInteraction}
        onPaymentStatusChange={handlePaymentStatusChangeWithInteraction}
        onStartDateChange={handleStartDateChangeWithInteraction}
        onEndDateChange={handleEndDateChangeWithInteraction}
        onSortByChange={setSortBy}
        onOrderChange={setOrder}
        onClearFilters={handleClearFiltersWithInteraction}
        onApplyFilters={refreshData}
        areFiltersActive={areFiltersActive}
        hasUserFiltered={hasUserFiltered}
      />
    </>
  );
};

export default OrdersTable;
