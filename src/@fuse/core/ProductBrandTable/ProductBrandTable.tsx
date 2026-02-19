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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listProductBrand,
  deleteBrand,
  restoreBrand,
  bulkDeleteBrand,
  bulkRestoreBrand,
} from "@/services/apiProductBrand";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "../FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import useColumnOrder from "@/hooks/useColumnOrder";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import TablePagination from "@/components/Shared/TablePagination";
import { usePageState } from "@/hooks/usePageState";
import { z } from "zod";

export type BrandType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  updatedAt: string;
  deletedAt: string | null;
};

interface ProductBrandTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

const ProductBrandTable = ({ refreshData }: ProductBrandTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "productBrandTable",
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
  const [selectedBrand, setSelectedBrand] = useState<BrandType | null>(null);
  const [brands, setBrands] = useState<BrandType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);

  // Optional redirect URL when deleting brand (same validation as ProductListTable: empty or valid URL)
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
    setPage(1); // Reset to page 1 first
    setLimit(newLimit); // Then update limit
  }, []);

  // Clear row selection when switching between active/deleted views
  useEffect(() => {
    setRowSelection({});
  }, [deleted]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      offset: (page - 1) * limit,
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
    isLoading: fetchLoading,
  } = useFetch(
    ["productBrandList", queryParams],
    listProductBrand,
    queryParams
  );

  // Update brands when data changes
  useEffect(() => {
    if (data?.data?.brands) {
      setBrands(data.data.brands);
    }
  }, [data]);

  // Function to manually refresh data by making a direct API call
  const refreshDataFn = useCallback(async () => {
    try {
      // Show loading state
      setBrands([]); // Clear current data to show loading state
      setIsLoading(true);

      // Call the API directly
      const freshData = await listProductBrand(queryParams);

      // Update the local state with fresh data
      if (freshData?.data?.brands) {
        setBrands(freshData.data.brands);
      }

      // Also update the SWR cache
      await mutate(["productBrandList", queryParams]);
    } catch (error) {
      console.error("Failed to refresh brand data:", error);
      showSnackbar("Failed to refresh brands", "error");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, showSnackbar]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (refreshData) {
      refreshData(refreshDataFn);
    }
  }, [refreshData, refreshDataFn]);

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

  const totalRecords = data?.data?.total || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  const handleDeleteClick = (brand: BrandType) => {
    setSelectedBrand(brand);
    setDeleteRedirectUrl("");
    setDeleteRedirectUrlError("");
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;

    // Only validate redirect URL if deleting (not restoring)
    if (!selectedBrand.deletedAt) {
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

    // Optimistically remove the row immediately
    const previousBrands = [...brands]; // Save the current state for rollback
    setBrands((prev) => prev.filter((brand) => brand.id !== selectedBrand.id));

    try {
      // Perform the API call
      const redirectUrl = deleteRedirectUrl.trim();
      const normalizedRedirectUrl = redirectUrl || undefined;
      const result = await (selectedBrand.deletedAt
        ? restoreBrand(selectedBrand.id)
        : deleteBrand(selectedBrand.id, normalizedRedirectUrl));

      if (result?.success) {
        // Show success snackbar
        showSnackbar(
          `Brand ${
            selectedBrand.deletedAt ? "restored" : "deleted"
          } successfully${!selectedBrand.deletedAt && normalizedRedirectUrl ? " (redirect created)" : ""}`,
          "success"
        );

        // Sync with the server data only if the API call is successful
        mutate(["productBrandList", queryParams]);
      } else {
        throw new Error(result?.message || "Unexpected server response");
      }
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
      // Restore the previous state on error
      setBrands(previousBrands);
      return false;
    } finally {
      setSelectedBrand(null);
      setDeleteRedirectUrl("");
      setDeleteRedirectUrlError("");
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
    const selectedBrandsToDelete = brands.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted brands for bulk delete
    const activeBrandsToDelete = selectedBrandsToDelete.filter(
      (brand) => !brand.deletedAt
    );

    if (activeBrandsToDelete.length === 0) {
      showSnackbar(
        "No active brands selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeBrandsToDelete.map((brand) => brand.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      const response = await bulkDeleteBrand(idsToDelete);

      // Handle response - API may return summary or just success
      const deletedCount = response?.data?.summary?.deleted_count || idsToDelete.length;
      const successMessage = `${deletedCount} brand(s) deleted successfully!`;
      
      // Fetch fresh data immediately after delete
      const freshData = await listProductBrand(queryParams);
      
      // Update SWR cache first - this will trigger useEffect and update data
      await mutate(["productBrandList", queryParams], freshData, { revalidate: false });
      
      // Also directly update local state to ensure immediate table update
      if (freshData?.data?.brands) {
        setBrands(freshData.data.brands);
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
    const selectedBrandsToRestore = brands.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted brands for bulk restore
    const deletedBrandsToRestore = selectedBrandsToRestore.filter(
      (brand) => brand.deletedAt
    );

    if (deletedBrandsToRestore.length === 0) {
      showSnackbar(
        "No deleted brands selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedBrandsToRestore.map((brand) => brand.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      const response = await bulkRestoreBrand(idsToRestore);

      const successMessage = response?.data?.summary?.restored_count
        ? `${response.data.summary.restored_count} brand(s) restored successfully!`
        : `${idsToRestore.length} brand(s) restored successfully!`;
      
      // Change filter to active status after restore
      setDeleted(null);
      setPage(1);
      
      // Create new query params with active filter
      const activeQueryParams = {
        ...queryParams,
        deleted: null,
        offset: 0, // Reset to first page
      };
      
      // Fetch fresh data with active filter
      const freshData = await listProductBrand(activeQueryParams);
      
      // Update SWR cache with new query params
      await mutate(["productBrandList", activeQueryParams], freshData, { revalidate: false });
      
      // Also update cache for old query params to keep it in sync
      await mutate(["productBrandList", queryParams], undefined, { revalidate: true });
      
      // Update local state with fresh data to show restored items
      if (freshData?.data?.brands) {
        setBrands(freshData.data.brands);
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

  const handleEdit = (brand: BrandType) => {
    router.push(
      `/apps/product-brand/brand-update/${brand.id}`
    );
  };

  const columns = useMemo<MRT_ColumnDef<BrandType>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Brand Name" },
      { accessorKey: "slug", header: "Slug" },
      // { accessorKey: "description", header: "Description" },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      // { accessorKey: "updatedAt", header: "Last Updated" },
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
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('product-brand-table', columns);

  if (isLoading || (fetchLoading && brands.length === 0))
    return <FuseLoading />;
  if (error) return <p>Failed to load brands</p>;

  return (
    <div>
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
              value={
                deleted === null ? "active" : deleted ? "deleted" : "active"
              }
              onChange={(e) =>
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted"
                )
              }
              size="small"
            >
              {/* <MenuItem value="all">All Brands</MenuItem> */}
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
                }}
              >
                Bulk Restore ({Object.keys(rowSelection).length})
              </Button>
            )}

            {/* --- EDIT: Conditionally render and remove isVisible prop --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={clearFilters}
              />
            )}
            {/* --- END EDIT --- */}
          </div>
        </div>

        <DataTable
          data={brands}
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
              pageSize: brands.length || limit || 1000
            }
          }}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              // View Details MenuItem
              !row.original.deletedAt && (
                <MenuItem
                  key="view-details"
                  onClick={() => {
                    router.push(
                      `/apps/product-brand/brand-detail/${row.original.id}`
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

              // Edit MenuItem (allow editing deleted brands as well)
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
              </MenuItem>,

              // Delete/Restore MenuItem
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
            ];

            // Filter out `false` values from the array (to handle the conditional rendering of Edit button)
            return menuItems.filter(Boolean);
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
            Confirm {selectedBrand?.deletedAt ? "Restore" : "Delete"}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: selectedBrand?.deletedAt ? 0 : 2 }}>
              Are you sure you want to{" "}
              {selectedBrand?.deletedAt ? "restore" : "delete"}{" "}
              <strong>{selectedBrand?.name}</strong>?
              {!selectedBrand?.deletedAt && " This action cannot be undone."}
            </Typography>
            {!selectedBrand?.deletedAt && (
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
              label={selectedBrand?.deletedAt ? "Restore" : "Delete"}
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
          <DialogTitle>Bulk Delete Brands</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              brand(s)? This action cannot be undone.
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
          <DialogTitle>Bulk Restore Brands</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              brand(s)?
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
    </div>
  );
};

export default ProductBrandTable;
