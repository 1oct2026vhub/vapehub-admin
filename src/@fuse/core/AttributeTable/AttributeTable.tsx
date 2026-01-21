"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_Updater,
} from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import {
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  InputAdornment,
  MenuItem,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listAttributes,
  deleteAttribute,
  restoreAttribute,
  bulkDeleteAttribute,
  bulkRestoreAttribute,
  type Attribute,
  type AttributeListParams,
} from "@/services/apiAttribute";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import useColumnOrder from "@/hooks/useColumnOrder";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import TablePagination from "@/components/Shared/TablePagination";
import { usePageState } from "@/hooks/usePageState";

const SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "name", label: "Name" },
  { value: "slug", label: "Slug" },
  { value: "type", label: "Type" },
  { value: "sort_order", label: "Sort Order" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
] as const;

interface AttributeTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

const AttributeTable = ({
  refreshData: setExternalRefreshFn,
}: AttributeTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "attributeTable",
    {
      page: 1,
      search: "",
      showDeleted: false,
      sortBy: "created_at" as AttributeListParams["sort_by"],
      order: "DESC" as "ASC" | "DESC",
    }
  );

  // Use pageState values directly
  const { page, search, showDeleted, sortBy, order } = pageState;
  const [limit, setLimit] = useState(100);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Helper functions to update pageState
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setShowDeleted = (value: boolean) => setPageState(prev => ({ ...prev, showDeleted: value }));
  const setSortBy = (value: AttributeListParams["sort_by"]) => setPageState(prev => ({ ...prev, sortBy: value }));
  const setOrder = (value: "ASC" | "DESC") => setPageState(prev => ({ ...prev, order: value }));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null,
  );
  const [localAttributes, setLocalAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortBy, desc: order === "DESC" }],
    [sortBy, order],
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortBy(id as AttributeListParams["sort_by"]);
      setOrder(desc ? "DESC" : "ASC");
    } else {
      setSortBy("created_at");
      setOrder("DESC");
    }
  };

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    // Define default states for this table
    const defaultSortBy = "created_at";
    const defaultOrder = "DESC";
    const defaultShowDeleted = false;

    return (
      search !== "" ||
      sortBy !== defaultSortBy ||
      order !== defaultOrder ||
      showDeleted !== defaultShowDeleted
    );
  }, [search, sortBy, order, showDeleted]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setShowDeleted(false);
    setSortBy("created_at");
    setOrder("DESC");
    setPage(1); // Reset page number
    setRowSelection({}); // Clear row selection when filters are cleared
    clearPageState(); // Clear session storage
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Clear row selection when switching between active/deleted views
  useEffect(() => {
    setRowSelection({});
  }, [showDeleted]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo<AttributeListParams>(
    () => ({
      sort_by: sortBy,
      order,
      limit: limit,
      offset: (page - 1) * limit,
      keyword: debouncedSearch,
      show_deleted: showDeleted,
    }),
    [sortBy, order, limit, page, debouncedSearch, showDeleted]
  );

  const {
    data,
    error,
    isLoading: fetchLoading,
  } = useFetch(
    ["attributeList", queryParams],
    () => listAttributes(queryParams),
    { keepPreviousData: true }
  );

  // Update localAttributes when data changes
  useEffect(() => {
    if (data?.data?.attributes) {
      setLocalAttributes(data.data.attributes);
    }
    setIsLoading(
      (fetchLoading && localAttributes.length === 0) || manuallyRefreshing
    );
  }, [
    data?.data?.attributes,
    fetchLoading,
    localAttributes.length,
    manuallyRefreshing,
  ]);

  // Function to manually refresh data by making a direct API call
  const refreshData = useCallback(async () => {
    try {
      setManuallyRefreshing(true);
      setIsLoading(true);
      // Clear current data to show loading state
      setLocalAttributes([]);

      // Call the API directly
      const freshData = await listAttributes(queryParams);

      // Update the local state with fresh data
      if (freshData?.data?.attributes) {
        setLocalAttributes(freshData.data.attributes);
      }

      // Also update the SWR cache
      await mutate(["attributeList", queryParams]);
    } catch (error) {
      console.error("Failed to refresh attribute data:", error);
      showSnackbar("Failed to refresh attribute data", "error");
    } finally {
      setIsLoading(false);
      setManuallyRefreshing(false);
    }
  }, [queryParams, showSnackbar]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(refreshData);
    }
  }, [setExternalRefreshFn, refreshData]);

  const handleDeleteClick = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAttribute) return;
    setOpenDialog(false);

    // Optimistically remove the item immediately for instant UI feedback
    setLocalAttributes((prev) =>
      prev.filter((attr) => attr.id !== selectedAttribute.id)
    );

    try {
      // Perform the actual API call
      if (selectedAttribute.deleted_at) {
        await restoreAttribute(selectedAttribute.id);
        showSnackbar("Attribute restored successfully!", "success");
      } else {
        await deleteAttribute(selectedAttribute.id);
        showSnackbar("Attribute deleted successfully!", "success");
      }

      // Fetch fresh data immediately after delete/restore to ensure accuracy
      const freshData = await listAttributes(queryParams);
      
      // Update SWR cache with fresh data
      await mutate(["attributeList", queryParams], freshData, { revalidate: false });
      
      // Update local state with fresh data to ensure table is in sync
      if (freshData?.data?.attributes) {
        setLocalAttributes(freshData.data.attributes);
      }

      // Update pagination if needed
      const newTotal = freshData?.data?.total || (data?.data?.total || 0) - 1;
      if (newTotal <= (page - 1) * limit && page > 1) {
        setPage(page - 1);
      }
    } catch (error: any) {
      // On error, refresh data to restore correct state
      const freshData = await listAttributes(queryParams);
      if (freshData?.data?.attributes) {
        setLocalAttributes(freshData.data.attributes);
      }
      await mutate(["attributeList", queryParams], freshData, { revalidate: false });

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
            showSnackbar(` ${message}`, "error");
          }
        });
      }
      return false;
    } finally {
      setSelectedAttribute(null);
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
    const selectedAttributesToDelete = localAttributes.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted attributes for bulk delete
    const activeAttributesToDelete = selectedAttributesToDelete.filter(
      (attr) => !attr.deleted_at
    );

    if (activeAttributesToDelete.length === 0) {
      showSnackbar(
        "No active attributes selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeAttributesToDelete.map((attr) => attr.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      const response = await bulkDeleteAttribute(idsToDelete);

      // Handle response - API may return summary or just success
      const deletedCount = response?.data?.summary?.deleted_count || idsToDelete.length;
      const successMessage = `${deletedCount} attribute(s) deleted successfully!`;
      
      // Fetch fresh data immediately after delete
      const freshData = await listAttributes(queryParams);
      
      // Update SWR cache first - this will trigger useEffect and update data
      await mutate(["attributeList", queryParams], freshData, { revalidate: false });
      
      // Also directly update local state to ensure immediate table update
      if (freshData?.data?.attributes) {
        setLocalAttributes(freshData.data.attributes);
      }
      
      showSnackbar(successMessage, "success");
      setRowSelection({});
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkDeleteDialog();
    }
  };

  // Bulk restore handlers
  const handleOpenBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(true);
  };

  const handleCloseBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(false);
  };

  const handleConfirmBulkRestore = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedAttributesToRestore = localAttributes.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted attributes for bulk restore
    const deletedAttributesToRestore = selectedAttributesToRestore.filter(
      (attr) => attr.deleted_at
    );

    if (deletedAttributesToRestore.length === 0) {
      showSnackbar(
        "No deleted attributes selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedAttributesToRestore.map((attr) => attr.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      const response = await bulkRestoreAttribute(idsToRestore);

      const successMessage = response?.data?.summary?.restored_count
        ? `${response.data.summary.restored_count} attribute(s) restored successfully!`
        : `${idsToRestore.length} attribute(s) restored successfully!`;
      
      // Change filter to active status after restore
      setShowDeleted(false);
      setPage(1);
      
      // Create new query params with active filter
      const activeQueryParams = {
        ...queryParams,
        show_deleted: false,
        offset: 0, // Reset to first page
      };
      
      // Fetch fresh data with active filter
      const freshData = await listAttributes(activeQueryParams);
      
      // Update SWR cache with new query params
      await mutate(["attributeList", activeQueryParams], freshData, { revalidate: false });
      
      // Also update cache for old query params to keep it in sync
      await mutate(["attributeList", queryParams], undefined, { revalidate: true });
      
      // Update local state with fresh data to show restored items
      if (freshData?.data?.attributes) {
        setLocalAttributes(freshData.data.attributes);
      }
      
      showSnackbar(successMessage, "success");
      setRowSelection({});
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkRestoreDialog();
    }
  };

  const handleEdit = (attribute: Attribute) => {
    router.push(`/apps/attribute/attribute-update/${attribute.id}`);
  };

  const columns = useMemo<MRT_ColumnDef<Attribute>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      {
        accessorKey: "type",
        header: "Type",
        Cell: ({ row }) => {
          const typeValue = row.original.type;
          return typeValue
            ? typeValue.charAt(0).toUpperCase() + typeValue.slice(1)
            : "";
        },
      },
      { accessorKey: "sort_order", header: "Sort Order" },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "updated_at",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updated_at),
      },
      ...(showDeleted
        ? [
            {
        accessorKey: "deleted_at",
        header: "Deleted At",
              Cell: ({ row }) => formatDate(row.original.deleted_at || ""),
            },
          ]
        : []),
    ],
    [showDeleted]
  );

  // Use the column order hook
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('attribute-table', columns);

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load attributes</p>;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3">
        <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
          <TextField
            label="Search"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            className="min-w-[200px]"
            InputProps={{
              endAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
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
          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#2E9970", // Thumb color when checked
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#2E9970", // Track color when checked
                  },
                }}
              />
            }
            label="Show Deleted"
          />
        </div>
        <div className="flex items-center gap-4">
          <FormControl size="small" className="min-w-[150px]">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) =>
                setSortBy(e.target.value as AttributeListParams["sort_by"])
              }
            >
              {SORT_FIELDS.map((field) => (
                <MenuItem key={field.value} value={field.value}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" className="min-w-[150px]">
            <InputLabel>Order</InputLabel>
            <Select
              value={order}
              label="Order"
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>
          </FormControl>

          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && !showDeleted && (
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
                height: '40px'
              }}
            >
              Bulk Delete ({Object.keys(rowSelection).length})
            </Button>
          )}

          {/* Bulk Restore Button */}
          {Object.keys(rowSelection).length > 0 && showDeleted && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>}
              onClick={handleOpenBulkRestoreDialog}
              sx={{
                backgroundColor: "#2E9970",
                "&:hover": {
                  backgroundColor: "#247C5C",
                },
                height: '40px'
              }}
            >
              Bulk Restore ({Object.keys(rowSelection).length})
            </Button>
          )}

          {/* --- START ADD: Clear Filters Button --- */}
          {areFiltersActive && (
            <ClearFiltersButton 
              onClick={clearFilters}
              sx={{ height: '40px' }} // Match height of other controls
            />
          )}
          {/* --- END ADD --- */}
        </div>
      </div>

      <DataTable
        data={localAttributes}
        columns={orderedColumns}
        manualSorting
        onSortingChange={handleSortingChange}
        onColumnOrderChange={onColumnOrderChange}
        manualPagination={true}
        enableRowSelection={true}
        onRowSelectionChange={setRowSelection}
        state={{
          columnOrder,
          sorting,
          rowSelection,
          pagination: {
            pageIndex: 0,
            pageSize: localAttributes.length || limit || 1000
          }
        }}
        rowCount={data?.data?.total || 0}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          !row.original.deleted_at && (
            <MenuItem
              key="view-details"
              onClick={() => {
                router.push(
                  `/apps/attribute/attribute-detail/${row.original.id}`
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

          !row.original.deleted_at && (
            <MenuItem
              key="edit"
              onClick={() => {
                handleEdit(row.original);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
              </ListItemIcon>
              Edit
            </MenuItem>
          ),

          <MenuItem
            key="delete"
            onClick={() => {
              handleDeleteClick(row.original);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <FuseSvgIcon>
                {row.original.deleted_at
                  ? "heroicons-outline:arrow-path"
                  : "heroicons-outline:trash"}
              </FuseSvgIcon>
            </ListItemIcon>
            {row.original.deleted_at ? "Restore" : "Delete"}
          </MenuItem>,
        ]}
      />

      <TablePagination
        page={page}
        totalPages={Math.ceil((data?.data?.total || 0) / limit)}
        limit={limit}
        totalRecords={data?.data?.total || 0}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
      />

      <Dialog open={openDialog} onClose={() => {
        setOpenDialog(false);
        setSelectedAttribute(null);
      }}>
        <DialogTitle>
          {selectedAttribute?.deleted_at ? "Confirm Restore" : "Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedAttribute?.deleted_at ? "restore" : "delete"}{" "}
            <strong>{selectedAttribute?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setSelectedAttribute(null);
          }}>Cancel</Button>
          <AppButton
            label={selectedAttribute?.deleted_at ? "Restore" : "Delete"}
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={isBulkDeleteDialogOpen}
        onClose={handleCloseBulkDeleteDialog}
      >
        <DialogTitle>Bulk Delete Attributes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            attribute(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmBulkDelete}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Restore Dialog */}
      <Dialog
        open={isBulkRestoreDialogOpen}
        onClose={handleCloseBulkRestoreDialog}
      >
        <DialogTitle>Bulk Restore Attributes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            attribute(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkRestoreDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmBulkRestore}
            color="success"
            variant="contained"
            disabled={isLoading}
            sx={{
              backgroundColor: "#2E9970",
              "&:hover": {
                backgroundColor: "#247C5C",
              },
            }}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AttributeTable;
