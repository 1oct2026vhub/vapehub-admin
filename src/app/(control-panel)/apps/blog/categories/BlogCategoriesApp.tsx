"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  Pagination,
  PaginationItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { motion } from "motion/react";
import { MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import SearchIcon from "@mui/icons-material/Search";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import { useRouter } from "next/navigation";
import {
  BlogCategory,
  BlogCategoryResponse,
  getBlogCategories,
  deleteBlogCategory,
  restoreBlogCategory,
  bulkDeleteBlogCategories,
  bulkRestoreBlogCategories,
} from "@/services/apiBlog";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import useColumnOrder from "@/hooks/useColumnOrder";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import { usePageState } from "@/hooks/usePageState";

// Add pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export default function BlogCategoriesApp() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Persist table filters in session storage
  const [pageState, setPageState, clearPageState] = usePageState(
    "blogCategoriesTable",
    {
      search: "",
      showDeleted: false,
      page: 1,
    },
  );

  const { search, showDeleted, page } = pageState;
  const setSearch = (value: string) =>
    setPageState((prev) => ({ ...prev, search: value }));
  const setShowDeleted = (value: boolean) =>
    setPageState((prev) => ({ ...prev, showDeleted: value }));
  const setPage = (value: number) =>
    setPageState((prev) => ({ ...prev, page: value }));

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 100,
  });

  // Add delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    // Define default states for this table
    const defaultShowDeleted = false;

    return (
      search !== "" ||
      showDeleted !== defaultShowDeleted
    );
  }, [search, showDeleted]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setShowDeleted(false);
    setPage(1); // Reset page
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
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        deleted: showDeleted,
      };

      const response: BlogCategoryResponse = await getBlogCategories(params);
      if (response?.data) {
        setCategories(response.data.categories);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      showSnackbar("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect for pagination and filtering
  useEffect(() => {
    fetchCategories();
  }, [page, pagination.limit, showDeleted]);

  // Add useEffect for search debouncing
  useEffect(() => {
    if (page === 1) {
      fetchCategories();
    } else {
      setPage(1);
    }
  }, [debouncedSearch]);

  // Update handlers to use navigation
  const handleAddCategory = () => {
    router.push("/apps/blog/categories/new");
  };

  const handleEditCategory = (category: BlogCategory) => {
    router.push(`/apps/blog/categories/${category.id}/edit`);
  };

  // Handle category deletion
  const handleDeleteCategory = async (category: BlogCategory) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteBlogCategory(categoryToDelete.id);
      showSnackbar("Category deleted successfully", "success");
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      showSnackbar(error?.message || "Failed to delete category", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Handle category restoration
  const handleRestoreCategory = async (category: BlogCategory) => {
    try {
      await restoreBlogCategory(category.id);
      showSnackbar("Category restored successfully", "success");
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to restore category:", error);
      showSnackbar(error?.message || "Failed to restore category", "error");
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
    const selectedCategoriesToDelete = categories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted categories for bulk delete
    const activeCategoriesToDelete = selectedCategoriesToDelete.filter(
      (category) => !category.deletedAt
    );

    if (activeCategoriesToDelete.length === 0) {
      showSnackbar(
        "No active categories selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeCategoriesToDelete.map((category) => category.id);

    try {
      setLoading(true);
      // Use bulk delete API
      await bulkDeleteBlogCategories(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} category(ies) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchCategories();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
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
    const selectedCategoriesToRestore = categories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted categories for bulk restore
    const deletedCategoriesToRestore = selectedCategoriesToRestore.filter(
      (category) => category.deletedAt
    );

    if (deletedCategoriesToRestore.length === 0) {
      showSnackbar(
        "No deleted categories selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedCategoriesToRestore.map((category) => category.id);

    try {
      setLoading(true);
      // Use bulk restore API
      await bulkRestoreBlogCategories(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} category(ies) restored successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchCategories();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      handleCloseBulkRestoreDialog();
    }
  };

  // Table columns - rename to defaultColumns for clarity
  const defaultColumns = useMemo<MRT_ColumnDef<BlogCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "slug",
        header: "Slug",
        size: 150,
      },
      // {
      //   accessorKey: "description",
      //   header: "Description",
      //   size: 300,
      // },
      {
        accessorKey: "parent",
        header: "Parent Category",
        size: 150,
        Cell: ({ row }) => {
          const parent = row.original.parent;
          // Check if parent is an object or string and handle accordingly
          if (parent === null || parent === undefined) {
            return "N/A";
          }
          if (typeof parent === 'object' && parent !== null) {
            // Use type assertion to tell TypeScript this is a valid object with a name property
            return (parent as {name: string}).name || "N/A";
          }
          return String(parent) || "N/A";
        },
      },
      {
  accessorKey: "status",
  header: "Status",
  size: 100,
  Cell: ({ row }) => {
    const status = row.original.status;
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <div className={status === "active" ? "text-green-600" : "text-red-600"}>
        {capitalizedStatus}
      </div>
    );
  },
},

      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 150,
        Cell: ({ row }) => formatDate(row.original.createdAt || "N/A"),
      },
    ],
    []
  );

  // Use the column order hook
  const { columns, columnOrder, onColumnOrderChange } = useColumnOrder('blog-categories', defaultColumns);

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && categories.length === 0) {
    return <FuseLoading />;
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                Blog Categories
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <AppButton label="Add Category" onClick={handleAddCategory} />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper className="overflow-hidden">
              <div className="flex items-center gap-5 p-3">
                <TextField
                  label="Search"
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#2E9970",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#2E9970",
                    },
                  }}
                />

                <FormControl size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={showDeleted ? "deleted" : "active"}
                    onChange={(e) =>
                      setShowDeleted(e.target.value === "deleted")
                    }
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
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
                      backgroundColor: "#2e7d32",
                      "&:hover": {
                        backgroundColor: "#1b5e20",
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

              <DataTable
                columns={columns}
                data={categories}
                enableRowActions
                enableColumnOrdering
                onColumnOrderChange={onColumnOrderChange}
                enableRowSelection={true}
                onRowSelectionChange={setRowSelection}
                state={{ columnOrder, rowSelection }}
                renderRowActionMenuItems={({ closeMenu, row }) => {
                  const isDeleted = !!row.original.deletedAt;

                  if (isDeleted) {
                    return [
                      <MenuItem
                        key="restore"
                        onClick={() => {
                          handleRestoreCategory(row.original);
                          closeMenu();
                        }}
                      >
                        <ListItemIcon>
                          <FuseSvgIcon>
                            heroicons-outline:arrow-path
                          </FuseSvgIcon>
                        </ListItemIcon>
                        Restore
                      </MenuItem>,
                    ];
                  }

                  return [
                    <MenuItem
                      key="view"
                      onClick={() => {
                        router.push(`/apps/blog/categories/${row.original.id}`);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                      </ListItemIcon>
                      View Details
                    </MenuItem>,
                    <MenuItem
                      key="edit"
                      onClick={() => {
                        handleEditCategory(row.original);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        <FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
                      </ListItemIcon>
                      Edit
                    </MenuItem>,
                    <MenuItem
                      key="delete"
                      onClick={() => {
                        handleDeleteCategory(row.original);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        <FuseSvgIcon className="text-red-500">
                          heroicons-outline:trash
                        </FuseSvgIcon>
                      </ListItemIcon>
                      <Typography color="error">Delete</Typography>
                    </MenuItem>,
                  ];
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) =>
                    setPage(value)
                  }
                  shape="rounded"
                  color="primary"
                  renderItem={(item) => (
                    <PaginationItem
                      {...item}
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
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={categoryToDelete?.name || ""}
        loading={deleteLoading}
      />

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
            category(ies)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmBulkDelete}
            color="error"
            variant="contained"
            disabled={loading}
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
            category(ies)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkRestoreDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmBulkRestore}
            color="success"
            variant="contained"
            disabled={loading}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
