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
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { motion } from "motion/react";
import {
  MRT_ColumnDef,
  MRT_SortingState,
  MRT_Updater,
} from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import SearchIcon from "@mui/icons-material/Search";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import { BlogTag, BlogTagResponse, getBlogTags, createBlogTag, updateBlogTag, deleteBlogTag, restoreBlogTag } from "@/services/apiBlog";
import { useRouter } from "next/navigation";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import useColumnOrder from "@/hooks/useColumnOrder";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";

// Add pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export default function BlogTagsApp() {
  const { showSnackbar } = useSnackbar();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);

  // Add search state with debouncing
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 100,
  });

  // Add sorting state
  const [sortField, setSortField] = useState<'name' | 'slug' | 'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Add deleted filter state
  const [showDeleted, setShowDeleted] = useState(false);

  // Add dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTag, setCurrentTag] = useState<BlogTag | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<BlogTag | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const router = useRouter();

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortField, desc: sortOrder === "DESC" }],
    [sortField, sortOrder],
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortField(
        id as "name" | "slug" | "created_at" | "updated_at",
      );
      setSortOrder(desc ? "DESC" : "ASC");
    } else {
      setSortField("created_at");
      setSortOrder("DESC");
    }
  };

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    // Define default states for this table
    const defaultSortField: typeof sortField = 'created_at';
    const defaultSortOrder: typeof sortOrder = 'DESC';
    const defaultShowDeleted = false;

    return (
      search !== "" ||
      sortField !== defaultSortField ||
      sortOrder !== defaultSortOrder ||
      showDeleted !== defaultShowDeleted
    );
  }, [search, sortField, sortOrder, showDeleted]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSortField("created_at");
    setSortOrder("DESC");
    setShowDeleted(false);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset page
    setRowSelection({}); // Clear row selection when filters are cleared
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch tags
  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        sort: sortField,
        order: sortOrder,
        deleted: showDeleted,
      };

      const response: BlogTagResponse = await getBlogTags(params);
      if (response?.data) {
        setTags(response.data.tags);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      // showSnackbar("Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect for pagination, sorting, and filtering
  useEffect(() => {
    fetchTags();
  }, [pagination.page, pagination.limit, sortField, sortOrder, showDeleted]);

  // Add useEffect for search debouncing
  useEffect(() => {
    if (pagination.page === 1) {
      fetchTags();
    } else {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch]);

  // Table columns - rename to defaultColumns
  const defaultColumns = useMemo<MRT_ColumnDef<BlogTag>[]>(
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
      {
        accessorKey: "created_at",
        header: "Created At",
        size: 150,
        Cell: ({ row }) => formatDate(row.original.created_at || ""),
      },
      {
        accessorKey: "updated_at",
        header: "Updated At",
        size: 150,
        Cell: ({ row }) => formatDate(row.original.updated_at || ""),
      },
    ],
    [router]
  );

  // Use the column order hook
  const { columns, columnOrder, onColumnOrderChange } = useColumnOrder('blog-tags', defaultColumns);

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Handle tag deletion
  const handleDeleteTag = async (tag: BlogTag) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteBlogTag(tagToDelete.id);
      showSnackbar("Tag deleted successfully", "success");
      fetchTags();
    } catch (error: any) {
      console.error("Failed to delete tag:", error);
      showSnackbar(
        error?.message || "Failed to delete tag",
        "error"
      );
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  // Add the restore tag handler function near the other handlers
  const handleRestoreTag = async (tag: BlogTag) => {
    try {
      await restoreBlogTag(tag.id);
      showSnackbar("Tag restored successfully", "success");
      
      // If we're viewing deleted tags, remove the restored tag from the list
      if (showDeleted) {
        setTags(currentTags => currentTags.filter(t => t.id !== tag.id));
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
      }
    } catch (error: any) {
      console.error("Failed to restore tag:", error);
      showSnackbar(error?.message || "Failed to restore tag", "error");
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
    const selectedTagsToDelete = tags.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted tags for bulk delete
    const activeTagsToDelete = selectedTagsToDelete.filter(
      (tag) => !tag.deleted_at
    );

    if (activeTagsToDelete.length === 0) {
      showSnackbar(
        "No active tags selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeTagsToDelete.map((tag) => tag.id);

    try {
      setLoading(true);
      // Delete all selected tags in parallel
      await Promise.all(idsToDelete.map((id) => deleteBlogTag(id)));

      showSnackbar(
        `${idsToDelete.length} tag(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchTags();
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      handleCloseBulkDeleteDialog();
    }
  };

  if (loading && tags.length === 0) {
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
                Blog Tags
              </Typography>
              <AppButton
                label="Add Tag"
                onClick={() => router.push("/apps/blog/tags/new")}
              />
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
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as typeof sortField)}
                    label="Sort By"
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="slug">Slug</MenuItem>
                    <MenuItem value="created_at">Created At</MenuItem>
                    <MenuItem value="updated_at">Updated At</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small">
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                    label="Order"
                  >
                    <MenuItem value="ASC">Ascending</MenuItem>
                    <MenuItem value="DESC">Descending</MenuItem>
                  </Select>
                </FormControl>

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
                data={tags}
                enableRowActions
                manualSorting
                onSortingChange={handleSortingChange}
                onColumnOrderChange={onColumnOrderChange}
                enableRowSelection={true}
                onRowSelectionChange={setRowSelection}
                state={{ columnOrder, sorting, rowSelection }}
                renderRowActionMenuItems={({ closeMenu, row }) => [
                  ...(row.original.deleted_at
                    ? [
                        <MenuItem
                          key="restore"
                          onClick={() => {
                            handleRestoreTag(row.original);
                            closeMenu();
                          }}
                        >
                          <ListItemIcon>
                            <FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>
                          </ListItemIcon>
                          Restore
                        </MenuItem>
                      ] : [
                        <MenuItem
                          key="view"
                          onClick={() => {
                            router.push(`/apps/blog/tags/${row.original.id}`);
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
                            router.push(`/apps/blog/tags/${row.original.id}/edit`);
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
                            handleDeleteTag(row.original);
                            closeMenu();
                          }}
                        >
                          <ListItemIcon>
                            <FuseSvgIcon className="text-red-500">
                              heroicons-outline:trash
                            </FuseSvgIcon>
                          </ListItemIcon>
                          <Typography color="error">Delete</Typography>
                        </MenuItem>
                      ])
                ]}
              />

              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={pagination.page}
                  onChange={(event, value) =>
                    setPagination((prev) => ({ ...prev, page: value }))
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

        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setTagToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title={tagToDelete?.name || ""}
          loading={deleteLoading}
        />

        {/* Bulk Delete Dialog */}
        <Dialog
          open={isBulkDeleteDialogOpen}
          onClose={handleCloseBulkDeleteDialog}
        >
          <DialogTitle>Bulk Delete Tags</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              tag(s)? This action cannot be undone.
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
      </motion.div>
    </Container>
  );
}