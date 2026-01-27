import { useMemo, useState, useEffect, useRef } from "react";
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_Updater,
} from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Chip,
  ListItemIcon,
  MenuItem,
  Paper,
  Button,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  InputAdornment,
  IconButton,
  Drawer,
  List,
  ListItem,
  Pagination,
  PaginationItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  listCustomer,
  deleteCustomer,
  blockCustomer,
  unBlockCustomer,
  restoreCustomer,
  exportCustomerInitiate,
  exportCustomerStatus,
} from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import { formatCustomerNameSafely } from "@/utils/actions";
import { usePageState } from "@/hooks/usePageState";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
  blocked: boolean;
  deletedAt: string | null;
  email_verified_at: string | null;
  createdAt: string | null;
  last_ordered_at?: string | null;
  aov: number | null;
  total_order_count: number | null;
  total_spend: number | null;
};

const CustomerTable = () => {
  const router = useRouter();
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "customerTable",
    {
      search: "",
      order: "DESC" as "ASC" | "DESC",
      sortBy: "",
      deleted: null as boolean | null,
      verified: null as boolean | null,
      blocked: null as boolean | null,
      page: 1,
    }
  );

  // Use pageState values directly
  const { search, order, sortBy, deleted, verified, blocked, page } = pageState;
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Helper functions to update pageState
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setOrder = (value: "ASC" | "DESC") => setPageState(prev => ({ ...prev, order: value }));
  const setSortBy = (value: string) => setPageState(prev => ({ ...prev, sortBy: value }));
  const setDeleted = (value: boolean | null) => setPageState(prev => ({ ...prev, deleted: value }));
  const setVerified = (value: boolean | null) => setPageState(prev => ({ ...prev, verified: value }));
  const setBlocked = (value: boolean | null) => setPageState(prev => ({ ...prev, blocked: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));

  const [customers, setCustomers] = useState<UserType[]>([]);
  const [limit] = useState(100); // Number of records per page

  // State for confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "delete" | "restore" | "block" | null
  >(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false); // Mobile filter drawer state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportJobStatus, setExportJobStatus] = useState<string | null>(null);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { showSnackbar } = useSnackbar();

  const sorting = useMemo<MRT_SortingState>(
    () => sortBy ? [{ id: sortBy, desc: order === "DESC" }] : [],
    [sortBy, order],
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting = typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortBy(id);
      setOrder(desc ? "DESC" : "ASC");
    } else {
      // Clear sorting when no sort is applied
      setSortBy("");
      setOrder("DESC");
    }
  };

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    // Define default states for this table
    const defaultOrder = "DESC";
    const defaultDeleted = null;
    const defaultVerified = null;
    const defaultBlocked = null;

    return (
      search !== "" ||
      sortBy !== "" ||
      deleted !== defaultDeleted ||
      verified !== defaultVerified ||
      blocked !== defaultBlocked
    );
  }, [search, sortBy, deleted, verified, blocked]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setOrder("DESC");
    setSortBy("");
    setDeleted(null);
    setVerified(null);
    setBlocked(null);
    setPage(1); // Reset page number
    setRowSelection({});
    clearPageState(); // Clear session storage
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Poll export job status
  const pollExportStatus = async (jobId: string) => {
    try {
      const response = await exportCustomerStatus(jobId);
      
      if (response?.success && response?.data) {
        const status = response.data.status;
        setExportJobStatus(status);

        if (status === "completed") {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Download the file
          const downloadUrl = response.data.downloadUrl;
          if (downloadUrl) {
            setExportDownloadUrl(downloadUrl);
            // Trigger download
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `customers-export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showSnackbar("Export completed and downloaded successfully!", "success");
            setIsExporting(false);
            // Keep dialog open to show completion status
          } else {
            showSnackbar("Export completed but download URL not available", "warning");
            setIsExporting(false);
          }
        } else if (status === "processing") {
          // Continue polling - interval is already set
        } else if (response.data.error) {
          // Job failed
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          showSnackbar(`Export failed: ${response.data.error}`, "error");
          setIsExporting(false);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.errors?.[0]?.msg || "Failed to check export status";
      showSnackbar(errorMessage, "error");
      // Stop polling on error
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsExporting(false);
    }
  };

  // Export handler
  const handleExport = async () => {
    setIsExporting(true);
    setExportJobId(null);
    setExportJobStatus(null);
    setExportDownloadUrl(null);

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    try {
      // Build export params from current filters
      // API expects: blocked/verified as "all", "true", or "false" (strings)
      // deleted as "false" (string) or omitted
      const exportParams: any = {
        format: exportFormat,
        ...(deleted !== null && { deleted: deleted.toString() }),
        ...(blocked !== null ? { blocked: blocked ? "true" : "false" } : { blocked: "all" }),
        ...(verified !== null ? { verified: verified ? "true" : "false" } : { verified: "all" }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };

      // Always use background job
      const response = await exportCustomerInitiate(exportParams);
      
      if (response?.success && response?.data?.jobId) {
        const jobId = response.data.jobId;
        const initialStatus = response.data.status || "processing";
        setExportJobId(jobId);
        setExportJobStatus(initialStatus);
        showSnackbar(
          `Export job started. ${response.data.message || "File will be available for download when ready."}`,
          "info"
        );
        
        // Check status immediately
        await pollExportStatus(jobId);
        
        // Set up interval for polling every 5 seconds
        // The pollExportStatus function will stop polling when status is "completed"
        // We set it up regardless, and pollExportStatus will clear it if already completed
        pollingIntervalRef.current = setInterval(() => {
          pollExportStatus(jobId);
        }, 5000);
      } else {
        throw new Error(response?.message || "Failed to initiate export");
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.errors?.[0]?.msg || "Export failed";
      showSnackbar(errorMessage, "error");
      setIsExporting(false);
    }
  };

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [deleted, verified, blocked, debouncedSearch]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      page,
      limit,
      order,
      ...(sortBy && { sort_by: sortBy }),
      ...(verified !== null && { verified }),
      ...(deleted !== null && { deleted }),
      ...(blocked !== null && { blocked }),
    }),
    [debouncedSearch, order, sortBy, deleted, verified, blocked, page, limit],
  );

  const { data, error, isLoading } = useFetch(
    ["customerList", queryParams],
    listCustomer,
    queryParams,
  );

  useEffect(() => {
    if (data?.data?.users) {
      setCustomers(data.data.users);
    }
  }, [data]);

  //  Open confirmation dialog
  const openDialog = (type: "delete" | "block", user: UserType) => {
    setDialogType(type);
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const totalRecords = data?.data?.total || 0; // Get total users from API
  const totalPages = Math.ceil(totalRecords / limit); // Total pages
  const deletedCustomer = customers?.find((user) => user.deletedAt !== null);

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    setDialogOpen(false);

    try {
      if (dialogType === "delete") {
        // Optimistically update UI for delete/restore
        setCustomers((prev) =>
          prev.filter((user) => user.id !== selectedUser.id),
        );

        await (deletedCustomer
          ? restoreCustomer(selectedUser.id)
          : deleteCustomer(selectedUser.id));

        // Show success message
        showSnackbar(
          deletedCustomer
            ? "Customer restored successfully!"
            : "Customer deleted successfully!",
          "success",
        );
      } else if (dialogType === "block") {
        // Always remove the customer from the current view
        setCustomers((prev) => 
          prev.filter((user) => user.id !== selectedUser.id)
        );

        await (selectedUser.blocked
          ? unBlockCustomer(selectedUser.id)
          : blockCustomer(selectedUser.id));

        // Show success message
        showSnackbar(
          selectedUser.blocked
            ? "Customer unblocked successfully!"
            : "Customer blocked successfully!",
          "success",
        );
      }

      // Refresh data in the background without forcing a reload
      await mutate(["customerList", queryParams], true);
    } catch (error) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      const errorData = error || error; // Handle both API and unexpected errors
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            // setError(field, { type: 'manual', message });
            showSnackbar(` ${message}`, "error");
          }
        });
      } else {
        // setError('root', { type: 'manual', message: errorMessage });
      }
      return false;
    }
  };

  // Bulk delete handlers
  const handleOpenBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const handleCloseBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(false);
  };

  const handleConfirmBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedCustomersToDelete = customers.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted customers for bulk delete
    const activeCustomersToDelete = selectedCustomersToDelete.filter(
      (customer) => !customer.deletedAt
    );

    if (activeCustomersToDelete.length === 0) {
      showSnackbar(
        "No active customers selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeCustomersToDelete.map((customer) => customer.id);

    try {
      // Delete all selected customers in parallel
      await Promise.all(idsToDelete.map((id) => deleteCustomer(id)));

      showSnackbar(
        `${idsToDelete.length} customer(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      await mutate(["customerList", queryParams], true);
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      handleCloseBulkDeleteDialog();
    }
  };

  const columns = useMemo<MRT_ColumnDef<UserType>[]>(
    () => [
      { accessorKey: "id", header: "Id" },
      { accessorKey: "first_name", header: "First Name" },
      { accessorKey: "last_name", header: "Last Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "aov",
        header: "AOV",
        Cell: ({ row }) => {
          const aov = row.original.aov;
          return aov != null ? `£${aov.toFixed(2)}` : 'N/A';
        },
      },
      {
        accessorKey: "total_order_count",
        header: "Total Order Count",
        Cell: ({ row }) => {
          const count = row.original.total_order_count;
          return count != null ? count : 'N/A';
        },
      },
      {
        accessorKey: "total_spend",
        header: "Total Spend",
        Cell: ({ row }) => {
          const spend = row.original.total_spend;
          return spend != null ? `£${spend.toFixed(2)}` : 'N/A';
        },
      },
      {
        accessorKey: "last_ordered_at",
        header: "Last Order At",
        Cell: ({ row }) =>
          row.original.last_ordered_at
            ? formatDate(row.original.last_ordered_at)
            : "N/A",
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          // Determine status based on both deletedAt and blocked fields
          let status = "Active";
          let color: "success" | "error" | "warning" = "success";
          
          if (row.original.deletedAt) {
            status = "Inactive";
            color = "error";
          } else if (row.original.blocked) {
            status = "Blocked";
            color = "warning";
          }
          
          return (
            <Chip
              label={status}
              color={color}
            />
          );
        },
      },
      ...(deleted ? [{
        accessorKey: "deletedAt",
        header: "Deleted At",
        Cell: ({ row }) => row.original.deletedAt ? formatDate(row.original.deletedAt) : 'N/A',
      }] : []),
    ],
    [deleted],
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load customers</p>;

  const customerData: UserType[] = customers?.map((user: any) => ({
    ...user,
    first_name: formatCustomerNameSafely(user.first_name || null),
    last_name: formatCustomerNameSafely(user.last_name || null),
    email: user.email || "N/A",
    phone: user.phone || "N/A",
    gender: user.gender || "N/A",
    // API field can vary; prefer last_ordered_at but fall back to last_order_at
    last_ordered_at: user.last_ordered_at ?? user.last_order_at ?? null,
  }));

  console.log("customers", customers);

  return (
    <>
      {/* Table */}
      <Paper
        className="flex flex-col flex-auto shadow-1 overflow-hidden"
        elevation={0}
      >
        {/* Search & Filters */}
        <div className="flex items-center justify-between p-3">
          <IconButton className="md:hidden" onClick={() => setOpenDrawer(true)}>
            <MenuIcon />
          </IconButton>

          <TextField
            label="Search"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            className="hidden md:block"
            sx={{
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "#2E9970", // Border color on focus (click)
                  borderWidth: "2px", // Optional: increase border thickness on focus
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#2E9970", // Label color on focus
              },
            }}
          />

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2">
            <Select
              value={sortBy || "none"}
              onChange={(e) => setSortBy(e.target.value === "none" ? "" : e.target.value)}
              size="small"
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="id">Id</MenuItem>
              <MenuItem value="first_name">First Name</MenuItem>
              <MenuItem value="last_name">Last Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="phone">Phone</MenuItem>
              <MenuItem value="gender">Gender</MenuItem>
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="updatedAt">Updated At</MenuItem>
              <MenuItem value="deletedAt">Deleted At</MenuItem>
              <MenuItem value="email_verified_at">Email Verified At</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="dob">Date of Birth</MenuItem>
            </Select>
            <Select
              value={
                verified === null ? "all" : verified ? "verified" : "pending"
              }
              onChange={(e) =>
                setVerified(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "verified",
                )
              }
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
            <Select
              value={deleted === null ? "active" : deleted ? "deleted" : "active"}
              onChange={(e) =>
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted",
                )
              }
              size="small"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
            <Select
              value={blocked === null ? "all" : blocked ? "blocked" : "not-blocked"}
              onChange={(e) => {
                if (e.target.value === "all") {
                  setBlocked(null);
                } else if (e.target.value === "blocked") {
                  setBlocked(true);
                } else if (e.target.value === "not-blocked") {
                  setBlocked(false);
                }
              }}
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="not-blocked">Not Blocked</MenuItem>
            </Select>
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>

            {/* Bulk Delete Button */}
            {Object.keys(rowSelection).length > 0 && deleted !== true && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>}
                onClick={handleOpenBulkDeleteDialog}
                sx={{
                  backgroundColor: "#d32f2f",
                  "&:hover": {
                    backgroundColor: "#b71c1c",
                  },
                }}
              >
                Bulk Delete ({Object.keys(rowSelection).length})
              </Button>
            )}

            {/* Export Button */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<FuseSvgIcon>heroicons-outline:arrow-down-tray</FuseSvgIcon>}
              onClick={() => setIsExportDialogOpen(true)}
              sx={{
                backgroundColor: "#2E9970",
                "&:hover": {
                  backgroundColor: "#247C5C",
                },
              }}
            >
              Export
            </Button>

            {/* --- START ADD: Clear Filters Button (Desktop) --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={clearFilters}
              />
            )}
            {/* --- END ADD --- */}
          </div>
        </div>
        <DataTable
          data={customerData}
          columns={columns}
          manualSorting
          onSortingChange={handleSortingChange}
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection}
          state={{
            sorting,
            rowSelection,
          }}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const isDeleted = row.original.deletedAt !== null;

            // Prepare menu items first
            const menuItems = [
              !isDeleted && (
                <MenuItem
                  key="view-details"
                  onClick={() => {
                    router.push(
                      `/apps/customer/customer-detail/${row.original.id}`,
                    );
                    closeMenu();
                  }}
                >
                  <ListItemIcon>
                    <FuseSvgIcon>
                      heroicons-outline:arrow-top-right-on-square
                    </FuseSvgIcon>
                  </ListItemIcon>
                  View Details
                </MenuItem>
              ),
              <MenuItem
                key="delete"
                onClick={() => {
                  openDialog("delete", row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>
                    {isDeleted
                      ? "heroicons-outline:arrow-path"
                      : "heroicons-outline:trash"}
                  </FuseSvgIcon>
                </ListItemIcon>
                {isDeleted ? "Restore" : "Delete"}
              </MenuItem>,
              !isDeleted && (
                <MenuItem
                  key="block-unblock"
                  onClick={() => {
                    openDialog("block", row.original);
                    closeMenu();
                  }}
                >
                  <ListItemIcon>
                    <FuseSvgIcon>
                      {row.original.blocked
                        ? "heroicons-outline:lock-open"
                        : "heroicons-outline:lock-closed"}
                    </FuseSvgIcon>
                  </ListItemIcon>
                  {row.original.blocked ? "Unblock" : "Block"}
                </MenuItem>
              ),
            ];

            // Filter out falsy values before returning
            return menuItems.filter(Boolean);
          }}
        />

        {/* Pagination Component */}
        <div className="flex justify-center mb-6">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            shape="rounded"
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                className="text-gray-600 hover:text-[#2E9970]"
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "#2E9970", // Active page background
                    color: "#fff", // Text color
                    "&:hover": {
                      backgroundColor: "#247C5C", // Darker shade on hover
                    },
                  },
                }}
              />
            )}
          />
        </div>
      </Paper>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <List>
          <ListItem>
            <Select
              value={sortBy || "none"}
              onChange={(e) => setSortBy(e.target.value === "none" ? "" : e.target.value)}
              size="small"
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="id">Id</MenuItem>
              <MenuItem value="first_name">First Name</MenuItem>
              <MenuItem value="last_name">Last Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="phone">Phone</MenuItem>
              <MenuItem value="gender">Gender</MenuItem>
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="updatedAt">Updated At</MenuItem>
              <MenuItem value="deletedAt">Deleted At</MenuItem>
              <MenuItem value="email_verified_at">Email Verified At</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="dob">Date of Birth</MenuItem>
            </Select>
            <Select
              value={
                verified === null ? "all" : verified ? "verified" : "pending"
              }
              onChange={(e) =>
                setVerified(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "verified",
                )
              }
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
            <Select
              value={deleted === null ? "active" : deleted ? "deleted" : "active"}
              onChange={(e) =>
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted",
                )
              }
              size="small"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={blocked === null ? "all" : blocked ? "blocked" : "not-blocked"}
              onChange={(e) => {
                if (e.target.value === "all") {
                  setBlocked(null);
                } else if (e.target.value === "blocked") {
                  setBlocked(true);
                } else if (e.target.value === "not-blocked") {
                  setBlocked(false);
                }
              }}
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="not-blocked">Not Blocked</MenuItem>
            </Select>
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
              fullWidth
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => setOpenDrawer(false)}
              sx={{ mb: 1 }} // Add margin bottom
            >
              Apply Filters
            </Button>
            {/* --- START ADD: Clear Filters Button (Mobile Drawer) --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={() => {
                  clearFilters();
                  setOpenDrawer(false); // Close drawer after clearing
                }}
                fullWidth // Keep fullWidth for drawer
              />
            )}
            {/* --- END ADD --- */}
          </ListItem>
        </List>
      </Drawer>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogType === "delete" ? (
              <>
                Are you sure you want to{" "}
                {deletedCustomer ? "Restore" : "Delete"}{" "}
                <strong>
                  {selectedUser?.first_name || ""}{" "}
                  {selectedUser?.last_name || ""}
                </strong>
                ?
              </>
            ) : (
              `Are you sure you want to ${selectedUser?.blocked ? "unblock" : "block"} this customer?`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <AppButton
            label={
              dialogType === "delete"
                ? selectedUser?.deletedAt
                  ? "Restore"
                  : "Delete"
                : selectedUser?.blocked
                  ? "Unblock"
                  : "Block"
            }
            onClick={handleConfirmAction}
          />
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onClose={handleCloseBulkDeleteDialog}>
        <DialogTitle>Bulk Delete Customers</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            customer(s)? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
          <AppButton
            label="Delete"
            type="button"
            onClick={handleConfirmBulkDelete}
          />
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog 
        open={isExportDialogOpen} 
        onClose={() => {
          // Stop polling if active
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsExportDialogOpen(false);
          setExportJobId(null);
          setExportJobStatus(null);
          setExportDownloadUrl(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Customers</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Export Format</Typography>
              <Select
                fullWidth
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as "csv" | "excel")}
                size="small"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </Box>

            <Typography variant="body2" color="text.secondary">
              <strong>Exported Fields:</strong> First Name, Last Name, Email, Phone
            </Typography>

            <Alert severity="info">
              Exports use background processing. The file will be available for download when ready.
              Files are automatically deleted after 24 hours.
            </Alert>

            {exportJobId && (
              <Alert severity={exportJobStatus === "completed" ? "success" : "info"}>
                <Typography variant="body2">
                  <strong>Status:</strong> {exportJobStatus || "processing"}
                </Typography>
                {exportJobStatus === "processing" && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">
                      Processing export... Checking status every 5 seconds.
                    </Typography>
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              // Stop polling if active
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              setIsExportDialogOpen(false);
              setExportJobId(null);
              setExportJobStatus(null);
              setExportDownloadUrl(null);
            }}
            disabled={isExporting && exportJobStatus === "processing"}
          >
            {exportJobId ? "Close" : "Cancel"}
          </Button>
          {!exportJobId && (
            <AppButton
              label={isExporting ? "Exporting..." : "Export"}
              type="button"
              onClick={handleExport}
              disabled={isExporting}
            />
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomerTable;
