"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_Updater,
} from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import useColumnOrder from "@/hooks/useColumnOrder";
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
  IconButton,
  MenuItem,
  ListItemIcon,
  Select,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listProductCategory,
  deleteCategory,
  restoreCategory,
  bulkDeleteCategory,
  bulkRestoreCategory,
} from "@/services/apiProductCategory";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "../FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import TablePagination from "@/components/Shared/TablePagination";
import { usePageState } from "@/hooks/usePageState";
import { z } from "zod";

export type CategoryType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  updatedAt: string;
  deletedAt: string | null;
};

interface ProductCategoryTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

const ProductCategoryTable = ({
  refreshData: setExternalRefreshFn,
}: ProductCategoryTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "productCategoryTable",
    {
      search: "",
      deleted: null as boolean | null,
      order: "DESC" as "ASC" | "DESC",
      sortBy: "createdAt",
      page: 1,
    }
  );

  // Use pageState values directly
  const { search, deleted, order, sortBy, page } = pageState;
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Helper functions to update pageState
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setDeleted = (value: boolean | null) => setPageState(prev => ({ ...prev, deleted: value }));
  const setOrder = (value: "ASC" | "DESC") => setPageState(prev => ({ ...prev, order: value }));
  const setSortBy = (value: string) => setPageState(prev => ({ ...prev, sortBy: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  
  const [limit, setLimit] = useState(100);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const [localCategories, setLocalCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);

  // Optional redirect URL when deleting category (same validation as ProductListTable: empty or valid URL)
  const [deleteRedirectUrl, setDeleteRedirectUrl] = useState("");
  const [deleteRedirectUrlError, setDeleteRedirectUrlError] = useState("");
  const redirectUrlSchema = z.string().url("Invalid URL format").optional().or(z.literal(""));

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    return (
      search !== "" ||
      deleted !== null ||
      sortBy !== "createdAt" ||
      order !== "DESC"
    );
  }, [search, deleted, sortBy, order]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDeleted(null);
    setSortBy("createdAt");
    setOrder("DESC");
    setPage(1); // Reset page to 1
    setRowSelection({}); // Clear row selection when filters are cleared
    clearPageState(); // Clear session storage
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  // Clear row selection when switching between active/deleted views
  useEffect(() => {
    setRowSelection({});
  }, [deleted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      page,
      limit,
      sortBy,
      order,
      ...(deleted !== null && { deleted }),
    }),
    [debouncedSearch, deleted, page, limit, sortBy, order],
  );

  const {
    data,
    error,
    isLoading: apiLoading,
  } = useFetch(
    ["productCategoryList", queryParams],
    listProductCategory,
    queryParams
  );

  // Function to manually refresh data by making a direct API call
  const refreshData = useCallback(async () => {
    try {
      // Show loading state
      setLocalCategories([]); // Clear current data to show loading state
      setIsLoading(true); // Set loading state to true
      setManuallyRefreshing(true); // Set manual refresh indicator

      // Call the API directly
      const freshData = await listProductCategory(queryParams);

      // Update the local state with fresh data
      if (freshData?.data?.categories) {
        setLocalCategories(freshData.data.categories);
      }

      // Also update the SWR cache
      await mutate(["productCategoryList", queryParams]);
    } catch (error) {
      console.error("Failed to refresh category data:", error);
      showSnackbar("Failed to refresh categories", "error");
    } finally {
      setIsLoading(false); // Reset loading state
      setManuallyRefreshing(false); // Reset manual refresh indicator
    }
  }, [queryParams, showSnackbar]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(refreshData);
    }
  }, [setExternalRefreshFn, refreshData]);

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortBy, desc: order === "DESC" }],
    [sortBy, order],
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting = typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortBy(id);
      setOrder(desc ? "DESC" : "ASC");
    } else {
      setSortBy("createdAt");
      setOrder("DESC");
    }
  };

  useEffect(() => {
    if (data?.data?.categories) {
      setLocalCategories(data.data.categories);
    }
  }, [data?.data?.categories]);

  const handleDeleteClick = (category: CategoryType) => {
    setSelectedCategory(category);
    setDeleteRedirectUrl("");
    setDeleteRedirectUrlError("");
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    // Only validate redirect URL if deleting (not restoring)
    if (!selectedCategory.deletedAt) {
      const redirectUrl = deleteRedirectUrl.trim();
      if (redirectUrl) {
        const parsed = redirectUrlSchema.safeParse(redirectUrl);
        if (!parsed.success) {
          setDeleteRedirectUrlError(parsed.error.errors[0]?.message ?? "Invalid URL format");
          return;
        }
      }
    }

    setOpenDialog(false);

    // Save previous state for rollback on error
    const previousCategories = [...localCategories];

    try {
      const updatedCategories = localCategories.filter(
        (cat) => cat.id !== selectedCategory.id
      );
      setLocalCategories(updatedCategories);

      const newTotal = (data?.data?.total || 0) - 1;
      if (newTotal <= (page - 1) * limit && page > 1) {
        setPage(page - 1);
      }

      const redirectUrl = deleteRedirectUrl.trim();
      const normalizedRedirectUrl = redirectUrl || undefined;

      if (selectedCategory.deletedAt) {
        await restoreCategory(selectedCategory.id);
        showSnackbar("Category restored successfully!", "success");
      } else {
        await deleteCategory(selectedCategory.id, normalizedRedirectUrl);
        showSnackbar("Category deleted successfully" + (normalizedRedirectUrl ? " (redirect created)" : "") + "!", "success");
      }

      await mutate(["productCategoryList", queryParams]);
    } catch (error: any) {
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
    const selectedCategoriesToDelete = localCategories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted categories for bulk delete
    const activeCategoriesToDelete = selectedCategoriesToDelete.filter(
      (cat) => !cat.deletedAt
    );

    if (activeCategoriesToDelete.length === 0) {
      showSnackbar(
        "No active categories selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeCategoriesToDelete.map((cat) => cat.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      const response = await bulkDeleteCategory(idsToDelete);

      // Handle response - API may return summary or just success
      const deletedCount = response?.data?.summary?.deleted_count || idsToDelete.length;
      const successMessage = `${deletedCount} category(s) deleted successfully!`;
      
      // Fetch fresh data immediately after delete
      const freshData = await listProductCategory(queryParams);
      
      // Update SWR cache first - this will trigger useEffect and update data
      await mutate(["productCategoryList", queryParams], freshData, { revalidate: false });
      
      // Also directly update local state to ensure immediate table update
      if (freshData?.data?.categories) {
        setLocalCategories(freshData.data.categories);
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
    const selectedCategoriesToRestore = localCategories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted categories for bulk restore
    const deletedCategoriesToRestore = selectedCategoriesToRestore.filter(
      (cat) => cat.deletedAt
    );

    if (deletedCategoriesToRestore.length === 0) {
      showSnackbar(
        "No deleted categories selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedCategoriesToRestore.map((cat) => cat.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      const response = await bulkRestoreCategory(idsToRestore);

      const successMessage = response?.data?.summary?.restored_count
        ? `${response.data.summary.restored_count} category(s) restored successfully!`
        : `${idsToRestore.length} category(s) restored successfully!`;
      
      // Change filter to active status after restore
      setDeleted(null);
      setPage(1);
      
      // Create new query params with active filter
      const activeQueryParams = {
        ...queryParams,
        deleted: null,
        page: 1,
      };
      
      // Fetch fresh data with active filter
      const freshData = await listProductCategory(activeQueryParams);
      
      // Update SWR cache with new query params
      await mutate(["productCategoryList", activeQueryParams], freshData, { revalidate: false });
      
      // Also update cache for old query params to keep it in sync
      await mutate(["productCategoryList", queryParams], undefined, { revalidate: true });
      
      // Update local state with fresh data to show restored items
      if (freshData?.data?.categories) {
        setLocalCategories(freshData.data.categories);
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

  const handleEdit = (category: CategoryType) => {
    router.push(
      `/apps/product-category/category-update/${category.id}`
    );
  };

  const columns = useMemo<MRT_ColumnDef<CategoryType>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Category Name" },
      { accessorKey: "slug", header: "Slug" },
      // { accessorKey: "description", header: "Description" },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        accessorKey: "logo_url",
        header: "Logo",
        Cell: ({ row }) =>
          row.original.logo_url ? (
            <img
              src={row.original.logo_url}
              alt={row.original.name}
              width={50}
              height={50}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="gray"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          ),
      },
      ...(deleted
        ? [
            {
              accessorKey: "deletedAt",
              header: "Deleted At",
              Cell: ({ row }) => formatDate(row.original.deletedAt || ""),
            },
          ]
        : []),
    ],
    [deleted]
  );

  // Use the column order hook
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('product-category-table', columns);

  if (
    isLoading ||
    manuallyRefreshing ||
    (apiLoading && localCategories.length === 0)
  )
    return <FuseLoading />;
  if (error) return <p>Failed to load categories</p>;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex items-center justify-between p-3">
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

        <div className="flex gap-2">
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="small"
          >
            <MenuItem value="id">Id</MenuItem>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="slug">Slug</MenuItem>
            <MenuItem value="description">Description</MenuItem>
            <MenuItem value="createdAt">Created At</MenuItem>
            <MenuItem value="updatedAt">Updated At</MenuItem>
          </Select>
          <Select
            value={order}
            onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
            size="small"
          >
            <MenuItem value="DESC">Descending</MenuItem>
            <MenuItem value="ASC">Ascending</MenuItem>
          </Select>
          <Select
            value={deleted === null ? "active" : deleted ? "deleted" : "active"}
            onChange={(e) =>
              setDeleted(
                e.target.value === "active"
                  ? null
                  : e.target.value === "deleted"
              )
            }
            size="small"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
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
                height: '40px'
              }}
            >
              Bulk Delete ({Object.keys(rowSelection).length})
            </Button>
          )}

          {/* Bulk Restore Button */}
          {Object.keys(rowSelection).length > 0 && deleted === true && (
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

          {/* --- EDIT: Conditionally render and remove isVisible prop --- */}
          {areFiltersActive && (
            <ClearFiltersButton 
              onClick={clearFilters}
              sx={{ height: '40px' }} // Match height of other controls
            />
          )}
          {/* --- END EDIT --- */}
        </div>
      </div>

      <DataTable
        data={localCategories}
        columns={orderedColumns}
        manualSorting
        onSortingChange={handleSortingChange}
        onColumnOrderChange={onColumnOrderChange}
        enablePagination
        manualPagination
        enableRowSelection={true}
        onRowSelectionChange={setRowSelection}
        state={{
          columnOrder,
          sorting,
          rowSelection,
          pagination: { pageIndex: page - 1, pageSize: limit },
        }}
        onPaginationChange={(updater: any) => {
          const newPagination = updater({
            pageIndex: page - 1,
            pageSize: limit,
          });
          setPage(newPagination.pageIndex + 1);
          setLimit(newPagination.pageSize);
        }}
        rowCount={data?.data?.total || 0}
        renderRowActionMenuItems={({ closeMenu, row }) => {
          return [
            !row.original.deletedAt && (
              <MenuItem
                key="view-details"
                onClick={() => {
                  router.push(
                    `/apps/product-category/category-detail/${row.original.id}`
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

            !row.original.deletedAt && (
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
                  {row.original.deletedAt
                    ? "heroicons-outline:arrow-path"
                    : "heroicons-outline:trash"}
                </FuseSvgIcon>
              </ListItemIcon>
              {row.original.deletedAt ? "Restore" : "Delete"}
            </MenuItem>,
          ].filter(Boolean);
        }}
      />

      <TablePagination
        page={page}
        totalPages={Math.ceil((data?.data?.total || 0) / limit)}
        limit={limit}
        totalRecords={data?.data?.total || 0}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
      />

      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setDeleteRedirectUrl("");
          setDeleteRedirectUrlError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm {selectedCategory?.deletedAt ? "Restore" : "Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: selectedCategory?.deletedAt ? 0 : 2 }}>
            Are you sure you want to{" "}
            {selectedCategory?.deletedAt ? "restore" : "delete"}{" "}
            <strong>{selectedCategory?.name}</strong>?
            {!selectedCategory?.deletedAt && " This action cannot be undone."}
          </Typography>
          {!selectedCategory?.deletedAt && (
            <TextField
              fullWidth
              label="Redirect URL (optional)"
              placeholder="https://example.com"
              value={deleteRedirectUrl}
              onChange={(e) => {
                const value = e.target.value;
                setDeleteRedirectUrl(value);
                const trimmed = value.trim();
                if (!trimmed) {
                  setDeleteRedirectUrlError("");
                } else {
                  const parsed = redirectUrlSchema.safeParse(trimmed);
                  setDeleteRedirectUrlError(parsed.success ? "" : (parsed.error.errors[0]?.message ?? "Invalid URL format"));
                }
              }}
              size="small"
              error={!!deleteRedirectUrlError}
              helperText={deleteRedirectUrlError || "Leave empty to skip. Enter a valid URL (e.g. https://example.com)."}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setDeleteRedirectUrl("");
            setDeleteRedirectUrlError("");
          }}>Cancel</Button>
          <AppButton
            label={selectedCategory?.deletedAt ? "Restore" : "Delete"}
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
        <DialogTitle>Bulk Delete Categories</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            category(s)? This action cannot be undone.
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
        <DialogTitle>Bulk Restore Categories</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            category(s)?
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

export default ProductCategoryTable;
