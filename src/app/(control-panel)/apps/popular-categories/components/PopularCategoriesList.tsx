"use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { formatDate } from "@/utils/actions";
import FuseLoading from '@fuse/core/FuseLoading';
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
  Select,
  ListItemIcon,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import {
  listPopularCategory,
  deletePopularCategory,
  restorePopularCategory,
  bulkDeletePopularCategory,
  bulkRestorePopularCategory,
  PopularCategory,
  FetchPopularCategoryParams,
} from '@/services/apiPopularCategory';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from '@/contexts/SnackbarContext';
import TablePagination from '@/components/Shared/TablePagination';
import PopularCategoryForm from './PopularCategoryForm';

interface PopularCategoriesListProps {
  refreshTrigger?: number;
  openCreate?: boolean;
  onCreateClosed?: () => void;
}

const PopularCategoriesList: React.FC<PopularCategoriesListProps> = ({ refreshTrigger = 0, openCreate, onCreateClosed }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleted, setDeleted] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PopularCategory | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'description' | 'status' | 'order' | 'createdAt' | 'updatedAt'>('order');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<PopularCategory | null>(null);

  useEffect(() => {
    if (openCreate !== undefined) {
      setIsCreateOpen(openCreate);
    }
  }, [openCreate]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const { showSnackbar } = useSnackbar();

  const areFiltersActive = useMemo(() => {
    return search !== '' || deleted || sortBy !== 'order' || sortOrder !== 'ASC';
  }, [search, deleted, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDeleted(false);
    setSortBy('order');
    setSortOrder('ASC');
    setPage(1);
    setRowSelection({});
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchPopularCategoryParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
        deleted: deleted ?? undefined,
      };
      const res = await listPopularCategory(params);
      setPopularCategories(res.data?.popularCategories || []);
      setTotal(res.data?.pagination?.totalItems || 0);
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to fetch popular categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder, deleted, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (category: PopularCategory) => {
    setSelectedCategory(category);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedCategory) return;
    try {
      if (selectedCategory.deletedAt) {
        await restorePopularCategory(selectedCategory.id);
        showSnackbar('Popular category restored successfully!', 'success');
      } else {
        await deletePopularCategory(selectedCategory.id);
        showSnackbar('Popular category deleted successfully!', 'success');
      }
      fetchData();
      setSelectedCategory(null);
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
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
    const selectedCategoriesToDelete = popularCategories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted items for bulk delete
    const activeCategoriesToDelete = selectedCategoriesToDelete.filter(
      (category) => !category.deletedAt
    );

    if (activeCategoriesToDelete.length === 0) {
      showSnackbar(
        "No active popular categories selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeCategoriesToDelete.map((category) => category.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      await bulkDeletePopularCategory(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} popular categor${idsToDelete.length > 1 ? 'ies' : 'y'} deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
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
    const selectedCategoriesToRestore = popularCategories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter for deleted items only for bulk restore
    const deletedCategoriesToRestore = selectedCategoriesToRestore.filter(
      (category) => category.deletedAt
    );

    if (deletedCategoriesToRestore.length === 0) {
      showSnackbar(
        "No deleted popular categories selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedCategoriesToRestore.map((category) => category.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      await bulkRestorePopularCategory(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} popular categor${idsToRestore.length > 1 ? 'ies' : 'y'} restored successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkRestoreDialog();
    }
  };

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  const columns = useMemo<MRT_ColumnDef<PopularCategory>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'order',
        header: 'Order',
        Cell: ({ row }) => row.original.order ?? '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => {
          const status = row.original.status;
          if (status === undefined || status === null) {
            return '-';
          }
          // Handle boolean status
          if (typeof status === 'boolean') {
            return status ? 'Active' : 'Inactive';
          }
          // Handle string status (for backward compatibility)
          if (typeof status === 'string') {
            return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
          }
          return '-';
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updatedAt),
      },
    ],
    []
  );

  if (isLoading && popularCategories.length === 0) return <FuseLoading />;

  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <div className="flex items-center p-3 flex-wrap gap-2">
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
            sx={{ minWidth: 180 }}
          />
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            displayEmpty
            size="small"
            sx={{ minWidth: 140, mx: 1 }}
          >
            <MenuItem value="order">Order</MenuItem>
            <MenuItem value="id">ID</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="description">Description</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="createdAt">Created At</MenuItem>
            <MenuItem value="updatedAt">Updated At</MenuItem>
          </Select>
          <Select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'ASC' | 'DESC')}
            size="small"
            sx={{ minWidth: 100, mx: 1 }}
          >
            <MenuItem value="ASC">ASC</MenuItem>
            <MenuItem value="DESC">DESC</MenuItem>
          </Select>
          <Select
            value={deleted ? 'true' : 'false'}
            onChange={e => setDeleted(e.target.value === 'true')}
            size="small"
            sx={{ minWidth: 140, mx: 1 }}
          >
            <MenuItem value="false">Active</MenuItem>
            <MenuItem value="true">Deleted</MenuItem>
          </Select>

          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && !deleted && (
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
          {Object.keys(rowSelection).length > 0 && deleted && (
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
              }}
            >
              Bulk Restore ({Object.keys(rowSelection).length})
            </Button>
          )}

          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={popularCategories}
          columns={columns}
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
          // hideRowSelectionCheckboxes={true}
          renderRowActionMenuItems={({ closeMenu, row }) => [
            !row.original.deletedAt && 
            <MenuItem key="edit" onClick={() => { setEditItem(row.original); setIsCreateOpen(true); closeMenu(); }}>
              <ListItemIcon>
                <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
              </ListItemIcon>
              Edit
            </MenuItem>,
            <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
              <ListItemIcon>
                <FuseSvgIcon>
                  {row.original.deletedAt ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}
                </FuseSvgIcon>
              </ListItemIcon>
              {row.original.deletedAt ? "Restore" : "Delete"}
            </MenuItem>,
          ]}
        />
        <TablePagination
          page={page}
          totalPages={totalPages}
          limit={limit}
          totalRecords={total}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
        {/* Delete/Restore Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm {selectedCategory?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {selectedCategory?.deletedAt ? 'restore' : 'delete'} <strong>{selectedCategory?.title}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedCategory?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen} onClose={() => { setIsCreateOpen(false); setEditItem(null); onCreateClosed?.(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: 'white' } }}>
          <DialogTitle>{editItem ? 'Edit Popular Category' : 'Create Popular Category'}</DialogTitle>
          <DialogContent dividers>
            <PopularCategoryForm
              item={editItem}
              onSuccess={() => {
                setIsCreateOpen(false);
                setEditItem(null);
                onCreateClosed?.();
                fetchData();
              }}
              onCancel={() => { setIsCreateOpen(false); setEditItem(null); onCreateClosed?.(); }}
            />
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onClose={handleCloseBulkDeleteDialog}>
          <DialogTitle>Bulk Delete Popular Categories</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              popular categor{Object.keys(rowSelection).length > 1 ? 'ies' : 'y'}? This action cannot be undone.
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
        <Dialog open={isBulkRestoreDialogOpen} onClose={handleCloseBulkRestoreDialog}>
          <DialogTitle>Bulk Restore Popular Categories</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              popular categor{Object.keys(rowSelection).length > 1 ? 'ies' : 'y'}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkRestoreDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkRestore}
              color="success"
              variant="contained"
              disabled={isLoading}
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default PopularCategoriesList;

