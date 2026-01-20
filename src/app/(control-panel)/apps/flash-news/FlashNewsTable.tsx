'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Paper, TextField, MenuItem, Select, InputAdornment, Pagination, PaginationItem, ListItemIcon, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '@/components/data-table/DataTable';
import { getFlashNews, deleteFlashNews, restoreFlashNews, FlashNews, bulkDeleteFlashNews, bulkRestoreFlashNews } from '@/services/apiFlashNews';
import AppButton from '@/components/Shared/AppButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { usePageState } from '@/hooks/usePageState';

const FlashNewsTable: React.FC = () => {
  // Persist table filters in session storage
  const [pageState, setPageState, clearPageState] = usePageState(
    "flashNewsTable",
    {
      search: '',
      deleted: null as boolean | null,
      page: 1,
      limit: 10,
    }
  );

  const { search, deleted, page, limit } = pageState;
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setDeleted = (value: boolean | null) => setPageState(prev => ({ ...prev, deleted: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setLimit = (value: number) => setPageState(prev => ({ ...prev, limit: value }));

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [flashNews, setFlashNews] = useState<FlashNews[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFlashNews, setSelectedFlashNews] = useState<FlashNews | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const areFiltersActive = useMemo(() => {
    return search !== '' || deleted !== null;
  }, [search, deleted]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDeleted(null);
    setPage(1);
    setRowSelection({});
    clearPageState(); // Clear session storage
  };

  // Clear row selection when switching between active/deleted views
  useEffect(() => {
    setRowSelection({});
  }, [deleted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        deleted: deleted !== null ? deleted : undefined,
      };
      const res = await getFlashNews(params);
      setFlashNews(res.data?.flashNews || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
      setLimit(res.data?.pagination?.limit || 10);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, deleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

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
    const selectedFlashNewsToDelete = flashNews.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted flash news for bulk delete
    const activeFlashNewsToDelete = selectedFlashNewsToDelete.filter(
      (item) => !item.deleted_at
    );

    if (activeFlashNewsToDelete.length === 0) {
      showSnackbar(
        "No active flash news selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeFlashNewsToDelete.map((item) => item.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      await bulkDeleteFlashNews(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} flash news item(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk delete failed";
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
    const selectedFlashNewsToRestore = flashNews.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted flash news for bulk restore
    const deletedFlashNewsToRestore = selectedFlashNewsToRestore.filter(
      (item) => item.deleted_at
    );

    if (deletedFlashNewsToRestore.length === 0) {
      showSnackbar(
        "No deleted flash news selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedFlashNewsToRestore.map((item) => item.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      await bulkRestoreFlashNews(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} flash news item(s) restored successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkRestoreDialog();
    }
  };

  const handleDeleteClick = (item: FlashNews) => {
    setSelectedFlashNews(item);
    setOpenDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedFlashNews) return;
    
    try {
      if (selectedFlashNews.deleted_at) {
        await restoreFlashNews(selectedFlashNews.id);
        showSnackbar('Flash news restored successfully!', 'success');
      } else {
        await deleteFlashNews(selectedFlashNews.id);
        showSnackbar('Flash news deleted successfully!', 'success');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'label', header: 'Label' },
    { accessorKey: 'url', header: 'URL' },
    { accessorKey: 'status', header: 'Status', Cell: ({ cell }) => cell.getValue() ? 'Active' : 'Inactive' },
  ], []);

  if (isLoading) return <div>Loading...</div>;

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
            value={deleted === null ? 'active' : 'deleted'}
            onChange={e => {
              setDeleted(e.target.value === 'active' ? null : true);
              setRowSelection({}); // Clear selection immediately when switching views
            }}
            size="small"
            sx={{ minWidth: 120, mx: 1 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Inactive</MenuItem>
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

          {/* Bulk Restore Button - Only show if selected rows are actually deleted items */}
          {(() => {
            if (Object.keys(rowSelection).length === 0 || deleted !== true) return null;
            
            // Verify that selected rows are actually deleted items
            const selectedIndices = Object.keys(rowSelection).filter(
              (key) => rowSelection[key]
            );
            const selectedFlashNewsToRestore = flashNews.filter((_, index) =>
              selectedIndices.includes(index.toString())
            );
            const deletedFlashNewsToRestore = selectedFlashNewsToRestore.filter(
              (item) => item.deleted_at
            );
            
            // Only show restore button if there are actually deleted items selected
            if (deletedFlashNewsToRestore.length === 0) return null;
            
            return (
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
                Bulk Restore ({deletedFlashNewsToRestore.length})
              </Button>
            );
          })()}

          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          key={`flash-news-${deleted}`}
          data={flashNews}
          columns={columns}
          enableColumnOrdering
          enableRowSelection
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              <MenuItem key="edit" onClick={() => { router.push(`/apps/flash-news/flash-news-edit/${row.original.id}`); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                </ListItemIcon>
                Edit
              </MenuItem>,
              row.original.deleted_at ? (
                <MenuItem key="restore" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
                  <ListItemIcon>
                    <FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>
                  </ListItemIcon>
                  Restore
                </MenuItem>
              ) : (
                <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
                  <ListItemIcon>
                    <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                  </ListItemIcon>
                  Delete
                </MenuItem>
              )
            ];
            return menuItems;
          }}
        />
        <div className="flex justify-center p-4">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            shape="rounded"
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                className="text-gray-600 hover:text-[#2E9970]"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#2E9970',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#247C5C',
                    },
                  },
                }}
              />
            )}
          />
        </div>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedFlashNews?.deleted_at ? 'Restore Flash News' : 'Delete Flash News'}
        </DialogTitle>
        <DialogContent>
          Are you sure you want to {selectedFlashNews?.deleted_at ? 'restore' : 'delete'} this flash news?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction}
            color={selectedFlashNews?.deleted_at ? 'success' : 'error'}
            variant="contained"
          >
            {selectedFlashNews?.deleted_at ? 'Restore' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onClose={handleCloseBulkDeleteDialog}>
        <DialogTitle>Bulk Delete Flash News</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            flash news item(s)? This action cannot be undone.
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

      {/* Bulk Restore Confirmation Dialog */}
      <Dialog open={isBulkRestoreDialogOpen} onClose={handleCloseBulkRestoreDialog}>
        <DialogTitle>Bulk Restore Flash News</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            flash news item(s)?
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
    </div>
  );
};

export default FlashNewsTable; 