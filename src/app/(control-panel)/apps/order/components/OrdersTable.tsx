"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { type MRT_ColumnDef, type MRT_Row } from "material-react-table";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  getOrders,
  OrderStatus,
  PaymentStatus,
  bulkUpdateOrderStatusAsync,
  BULK_STATUS_BATCH_MAX,
} from "@/services/apiOrder";
import { useBulkStatusJob } from "@/contexts/BulkStatusJobContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { isAxiosError } from "axios";
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
import BulkStatusJobsToolbarButton from "./BulkStatusJobsToolbarButton";
import { formatItemStatus, isOrderBulkSelectionLocked } from "./bulkStatusJobUtils";
import AppButton from "@/components/Shared/AppButton";
import relativeTime from "dayjs/plugin/relativeTime";
import useColumnOrder from "@/hooks/useColumnOrder";
import { formatCustomerNameSafely } from "@/utils/actions";
import { listProducts } from "@/services/apiProduct";
import TablePagination from "@/components/Shared/TablePagination";
import { usePageState } from "@/hooks/usePageState";

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
  const { showSnackbar } = useSnackbar();
  const {
    startJob,
    registerCompleteListener,
    activeBulkByOrderId,
    refreshActiveBulkOrders,
  } = useBulkStatusJob();
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "ordersTable",
    {
      order: "DESC" as "ASC" | "DESC",
      sortBy: "id",
      page: 1,
      search: initialSearch || "",
      status: "" as OrderStatus | "",
      paymentStatus: "" as PaymentStatus | "",
      startDate: initialStartDate || null,
      endDate: initialEndDate || null,
      selectedProductId: null as number | null,
    }
  );

  // Use pageState values directly
  const { order, sortBy, page, search, status, paymentStatus, startDate, endDate, selectedProductId } = pageState;
  const [limit, setLimit] = useState(100);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [orders, setOrders] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserFiltered, setHasUserFiltered] = useState(false);
  
  // Stable date strings — avoid new dayjs() instances in useMemo deps (prevents SWR refetch loops)
  const startDateStr = useMemo(() => {
    if (startDate) return startDate;
    if (initialStartDate) return initialStartDate;
    return dayjs().subtract(1, "month").format("YYYY-MM-DD");
  }, [startDate, initialStartDate]);

  const endDateStr = useMemo(() => {
    if (endDate) return endDate;
    if (initialEndDate) return initialEndDate;
    return dayjs().format("YYYY-MM-DD");
  }, [endDate, initialEndDate]);

  const startDateFilter = useMemo(() => dayjs(startDateStr), [startDateStr]);
  const endDateFilter = useMemo(() => dayjs(endDateStr), [endDateStr]);
  
  // Helper functions to update pageState
  const setOrder = (value: "ASC" | "DESC") => setPageState(prev => ({ ...prev, order: value }));
  const setSortBy = (value: string) => setPageState(prev => ({ ...prev, sortBy: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setSearch = (value: string) => {
    setPageState(prev => ({ ...prev, search: value }));
    setSearchInput(value);
  };
  const setStatus = (value: OrderStatus | "") => setPageState(prev => ({ ...prev, status: value }));
  const setPaymentStatus = (value: PaymentStatus | "") => setPageState(prev => ({ ...prev, paymentStatus: value }));
  
  const setStartDateFilter = (date: dayjs.Dayjs | null) => {
    setPageState(prev => ({ ...prev, startDate: date ? date.format("YYYY-MM-DD") : null }));
  };
  
  const setEndDateFilter = (date: dayjs.Dayjs | null) => {
    setPageState(prev => ({ ...prev, endDate: date ? date.format("YYYY-MM-DD") : null }));
  };
  
  // Bulk status update state
  // Using order IDs as keys instead of row indices to persist selections across searches/pages
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<OrderStatus | "">("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [statisticsRefreshKey, setStatisticsRefreshKey] = useState(0);

  const selectedOrderCount = useMemo(
    () => Object.keys(rowSelection).filter((key) => rowSelection[key]).length,
    [rowSelection]
  );

  const selectedOrderIds = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((key) => rowSelection[key])
        .map((key) => parseInt(key))
        .filter((id) => !isNaN(id))
        .filter(
          (id) => !isOrderBulkSelectionLocked(activeBulkByOrderId.get(id))
        ) as number[],
    [rowSelection, activeBulkByOrderId]
  );

  const isRowBulkSelectionLocked = useCallback(
    (orderId: number) =>
      isOrderBulkSelectionLocked(activeBulkByOrderId.get(orderId)),
    [activeBulkByOrderId]
  );

  const canSelectRow = useCallback(
    (row: MRT_Row<(typeof orders)[number]>) =>
      !isRowBulkSelectionLocked(row.original.id),
    [isRowBulkSelectionLocked]
  );

  const isBulkBatchTooLarge = selectedOrderCount > BULK_STATUS_BATCH_MAX;

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  // Product filter state
  interface Product { id: number; name: string }
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    selectedProductId ? { id: selectedProductId, name: "" } : null
  );
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const lastProductsFetchKeyRef = useRef<string | null>(null);
  const productsFetchInFlightRef = useRef(false);
  
  // Update selectedProduct when selectedProductId changes
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setSelectedProduct(product);
      }
    } else if (!selectedProductId) {
      setSelectedProduct(null);
    }
  }, [selectedProductId, products]);
  
  // Update selectedProductId when selectedProduct changes
  const handleSelectedProductChange = (product: Product | null) => {
    setSelectedProduct(product);
    setPageState(prev => ({ ...prev, selectedProductId: product ? product.id : null }));
  };

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
      start_date: startDateStr,
      end_date: endDateStr,
      ...(selectedProduct && { product_id: selectedProduct.id }),
    }),
    [
      sortBy,
      order,
      status,
      paymentStatus,
      search, // This will now only change after debounce
      startDateStr,
      endDateStr,
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
    clearPageState(); // Clear session storage
  }, [clearPageState]);

  // Modified clear filters handler to reset interaction flag
  const handleClearFiltersWithInteraction = useCallback(() => {
    clearFiltersLogic();
    setHasUserFiltered(false); // Reset interaction flag
    // Note: We don't clear rowSelection here so selections persist across filter changes
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

  const refreshOrdersList = useCallback(async () => {
    try {
      const freshData = await getOrders(queryParams);

      if (freshData?.data) {
        setOrders(freshData.data.orders || []);
        if (freshData.data.pagination) {
          setTotalRecords(freshData.data.pagination.total || 0);
          setTotalPages(freshData.data.pagination.total_pages || 1);
        }
      }

      await mutate(["orderList", queryParams], freshData, { revalidate: false });
      setStatisticsRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Failed to refresh orders after bulk update:", error);
      await mutate(["orderList", queryParams]);
    }
  }, [queryParams]);

  useEffect(() => {
    void refreshActiveBulkOrders();
  }, [refreshActiveBulkOrders]);

  useEffect(() => {
    if (activeBulkByOrderId.size === 0) return;

    setRowSelection((prev) => {
      const next = { ...prev };
      let changed = false;

      Object.keys(next).forEach((id) => {
        if (next[id] && isRowBulkSelectionLocked(Number(id))) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [activeBulkByOrderId, isRowBulkSelectionLocked]);

  useEffect(() => {
    return registerCompleteListener(() => {
      void refreshOrdersList();
    });
  }, [registerCompleteListener, refreshOrdersList]);

  const handleBulkStatusUpdate = useCallback(async () => {
    if (!selectedBulkStatus) {
      showSnackbar("Please select a status", "warning");
      return;
    }

    if (selectedOrderIds.length === 0) {
      showSnackbar("No orders selected", "warning");
      return;
    }

    const lockedSelected = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => Number(key))
      .filter((id) => isRowBulkSelectionLocked(id));

    if (lockedSelected.length > 0) {
      showSnackbar(
        "Some selected orders are already in a bulk update. Deselect them and try again.",
        "error"
      );
      void refreshActiveBulkOrders();
      return;
    }

    if (isBulkBatchTooLarge) {
      showSnackbar(`Maximum ${BULK_STATUS_BATCH_MAX} orders per batch.`, "error");
      return;
    }

    setIsBulkUpdating(true);

    try {
      const response = await bulkUpdateOrderStatusAsync(
        selectedOrderIds,
        selectedBulkStatus
      );

      const { job_id, job_key, target_status } = response.data;

      if (!response?.success || job_id == null) {
        throw new Error(response?.message || "Failed to queue bulk update");
      }

      setBulkStatusDialogOpen(false);
      setRowSelection({});
      setSelectedBulkStatus("");
      startJob(
        job_id,
        target_status || selectedBulkStatus,
        selectedOrderIds,
        job_key
      );
      showSnackbar(
        selectedBulkStatus === "packed"
          ? "Queued — ShipStation orders created without labels in bulk."
          : "Bulk update queued. Processing in background.",
        "info"
      );
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        const data = error.response.data as { message?: string };
        showSnackbar(
          data?.message ||
            "Some orders are already in an active bulk update. Wait for the current batch to finish.",
          "error"
        );
        void refreshActiveBulkOrders();
        return;
      }

      const err = error as { message?: string; errors?: Array<{ msg?: string }> };
      const errorMessage =
        err?.message ||
        err?.errors?.[0]?.msg ||
        "Failed to update orders. Please check your connection and try again.";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsBulkUpdating(false);
    }
  }, [
    isBulkBatchTooLarge,
    isRowBulkSelectionLocked,
    refreshActiveBulkOrders,
    rowSelection,
    selectedBulkStatus,
    selectedOrderIds,
    showSnackbar,
    startJob,
  ]);

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

  // Fetch products for product filter (single effect — debounced keyword)
  const fetchProducts = useCallback(async (keyword: string) => {
    const fetchKey = keyword.trim();

    if (productsFetchInFlightRef.current) return;
    if (lastProductsFetchKeyRef.current === fetchKey) return;

    productsFetchInFlightRef.current = true;

    try {
      setIsLoadingProducts(true);
      if (!fetchKey) {
        const response = await listProducts({ limit: 50 });
        setProducts(response.data?.products || []);
      } else {
        const response = await listProducts({ keyword: fetchKey, limit: 20 });
        setProducts(response.data?.products || []);
      }
      lastProductsFetchKeyRef.current = fetchKey;
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setIsLoadingProducts(false);
      productsFetchInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchProducts(debouncedProductSearch);
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
      Cell: ({ row }) => {
        const bulk = activeBulkByOrderId.get(row.original.id);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            {row.original.status ? (
              <OrderStatusChip status={row.original.status} />
            ) : (
              "N/A"
            )}
            {bulk && (
              <Chip
                size="small"
                variant="outlined"
                color="info"
                label={`Bulk: ${formatStatusText(bulk.target_status)} (${formatItemStatus(bulk.item_status)})`}
              />
            )}
          </Box>
        );
      },
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
  ], [activeBulkByOrderId]);

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
        refreshTrigger={statisticsRefreshKey}
        externalStartDate={startDateStr}
        externalEndDate={endDateStr}
        className="mb-6"
      />
      
      <div className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          {selectedOrderCount > 0 && (
            <>
              <AppButton
                label={`Update Status (${selectedOrderCount} selected)`}
                variant="contained"
                onClick={() => setBulkStatusDialogOpen(true)}
                disabled={isBulkUpdating}
              />
              <AppButton
                label="Clear Selection"
                variant="outlined"
                onClick={() => setRowSelection({})}
                disabled={isBulkUpdating}
              />
            </>
          )}
        </Box>
        <Box className="flex items-end gap-2">
          <BulkStatusJobsToolbarButton />
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
              onProductChange={(product) => { handleSelectedProductChange(product); setHasUserFiltered(true); }}
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
          enableRowSelection={canSelectRow}
          muiSelectCheckboxProps={({ row }) => {
            const bulk = activeBulkByOrderId.get(row.original.id);
            const locked = isOrderBulkSelectionLocked(bulk);
            return {
              disabled: locked,
              title: locked
                ? `In bulk update (${formatItemStatus(bulk!.item_status)})`
                : undefined,
            };
          }}
          onRowSelectionChange={setRowSelection}
          // Use order ID as row identifier so selections persist across searches/pages
          getRowId={(row) => row.id.toString()}
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
            rowSelection,
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

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={bulkStatusDialogOpen}
        onClose={() => !isBulkUpdating && setBulkStatusDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You have selected {selectedOrderCount} order(s).
              Choose a new status to update all selected orders.
              {selectedOrderCount > 0 && (
                <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.75rem', color: 'text.disabled' }}>
                  Selected orders will be updated regardless of which page they're on.
                </Box>
              )}
            </Typography>

            {/* Selected Orders List */}
            {isBulkBatchTooLarge && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Maximum {BULK_STATUS_BATCH_MAX} orders per batch. Please reduce your selection.
              </Alert>
            )}

            {selectedOrderCount > 0 && (
              <Box sx={{ mb: 3, maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight="medium">
                    Selected Orders ({selectedOrderCount})
                  </Typography>
                </Box>
                <List dense sx={{ p: 0 }}>
                  {Object.keys(rowSelection)
                    .filter(key => rowSelection[key])
                    .map((orderIdStr, index) => {
                      const orderId = parseInt(orderIdStr);
                      // Find order in current page orders
                      const order = orders.find((o: any) => o.id === orderId);
                      const isLast = index === selectedOrderCount - 1;
                      
                      return (
                        <Box key={orderIdStr}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {order?.order_unique_id || `Order #${orderId}`}
                                  </Typography>
                                  {order?.status && (
                                    <OrderStatusChip status={order.status} />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  {order ? (
                                    <>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Customer: {formatCustomerNameSafely(order.user)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Total: {order.total ? formatPounds(parseFloat(order.total)) : 'N/A'}
                                      </Typography>
                                      {order.createdAt && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          Date: {formatDate(order.createdAt)}
                                        </Typography>
                                      )}
                                    </>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                      Order not on current page
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {!isLast && <Divider />}
                        </Box>
                      );
                    })}
                </List>
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel id="bulk-status-label">Status</InputLabel>
              <Select
                labelId="bulk-status-label"
                id="bulk-status-select"
                value={selectedBulkStatus}
                label="Status"
                onChange={(e) => setSelectedBulkStatus(e.target.value as OrderStatus)}
                disabled={isBulkUpdating}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="packed">Packed</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="fail">Failed</MenuItem>
                <MenuItem value="cancel">Cancelled</MenuItem>
                <MenuItem value="return_requested">Return Requested</MenuItem>
                <MenuItem value="return_approved">Return Approved</MenuItem>
                <MenuItem value="return_received">Return Received</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
            {isBulkUpdating && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <AppButton
            label="Cancel"
            variant="outlined"
            onClick={() => setBulkStatusDialogOpen(false)}
            disabled={isBulkUpdating}
          />
          <AppButton
            label="Update"
            variant="contained"
            loading={isBulkUpdating}
            onClick={handleBulkStatusUpdate}
            disabled={!selectedBulkStatus || isBulkUpdating || isBulkBatchTooLarge}
          />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrdersTable;
