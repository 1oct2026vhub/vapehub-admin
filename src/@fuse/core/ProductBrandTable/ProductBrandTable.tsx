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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [sortBy, setSortBy] = useState("createdAt");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandType | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const { showSnackbar } = useSnackbar();
  const [brands, setBrands] = useState<BrandType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

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
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1); // Reset to page 1 first
    setLimit(newLimit); // Then update limit
  }, []);

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
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;
    setOpenDialog(false);

    // Optimistically remove the row immediately
    const previousBrands = [...brands]; // Save the current state for rollback
    setBrands((prev) => prev.filter((brand) => brand.id !== selectedBrand.id));

    try {
      // Perform the API call
      const result = await (selectedBrand.deletedAt
        ? restoreBrand(selectedBrand.id)
        : deleteBrand(selectedBrand.id));

      if (result?.success) {
        // Show success snackbar
        showSnackbar(
          `Brand ${
            selectedBrand.deletedAt ? "restored" : "deleted"
          } successfully`,
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
      // Delete all selected brands in parallel
      await Promise.all(idsToDelete.map((id) => deleteBrand(id)));

      // Optimistically update the UI
      setBrands((prev) =>
        prev.filter((brand) => !idsToDelete.includes(brand.id))
      );

      showSnackbar(
        `${idsToDelete.length} brand(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      await mutate(["productBrandList", queryParams]);
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkDeleteDialog();
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
              stroke-width="1.5"
              stroke="gray"
              className="size-10"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
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

              // Edit MenuItem (conditionally rendered)
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

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm {selectedBrand?.deletedAt ? "Restore" : "Delete"}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to{" "}
              {selectedBrand?.deletedAt ? "restore" : "delete"}{" "}
              <strong>{selectedBrand?.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
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
      </Paper>
    </div>
  );
};

export default ProductBrandTable;
