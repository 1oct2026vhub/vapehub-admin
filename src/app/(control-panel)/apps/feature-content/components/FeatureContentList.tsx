
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
  Pagination,
  PaginationItem,
  ListItemIcon,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { getFeatureContent, FeatureContent, FetchFeatureContentParams, deleteFeatureContent, restoreFeatureContent } from '@/services/apiFeatureContent';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from '@/contexts/SnackbarContext';
import CreateFeatureContentForm from './CreateFeatureContentForm';
import { usePageState } from '@/hooks/usePageState';

interface FeatureContentListProps {
  openCreate?: boolean;
  onCreateClosed?: () => void;
}

const FeatureContentList: React.FC<FeatureContentListProps> = ({ openCreate, onCreateClosed }) => {
  // Persist table filters in session storage
  const [pageState, setPageState, clearPageState] = usePageState(
    "featureContentList",
    {
      search: '',
      deleted: false,
      status: '',
      page: 1,
      limit: 100,
    }
  );

  const { search, deleted, status, page, limit } = pageState;
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setDeleted = (value: boolean) => setPageState(prev => ({ ...prev, deleted: value }));
  const setStatus = (value: string) => setPageState(prev => ({ ...prev, status: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setLimit = (value: number) => setPageState(prev => ({ ...prev, limit: value }));

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [featureContents, setFeatureContents] = useState<FeatureContent[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<FeatureContent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<FeatureContent | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    setIsCreateOpen(!!openCreate);
  }, [openCreate]);

  const areFiltersActive = useMemo(() => {
    return search !== '' || deleted || status !== '';
  }, [search, deleted, status]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setDeleted(false);
    setPage(1);
    setRowSelection({});
    clearPageState(); // Clear session storage
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
      const params: FetchFeatureContentParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
        deleted: deleted ?? undefined,
      };
      const res = await getFeatureContent(params);
      setFeatureContents(res.data?.featureContents || []);
      setTotal(res.data?.pagination?.totalItems || 0);
      setPage(res.data?.pagination?.currentPage || 1);
      setLimit(res.data?.pagination?.itemsPerPage || 10);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status, deleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (content: FeatureContent) => {
    setSelectedContent(content);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedContent) return;
    try {
      if (selectedContent.deletedAt) {
        await restoreFeatureContent(selectedContent.id);
        showSnackbar('Feature content restored successfully!', 'success');
      } else {
        await deleteFeatureContent(selectedContent.id);
        showSnackbar('Feature content deleted successfully!', 'success');
      }
      fetchData();
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
    const selectedContentsToDelete = featureContents.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted items for bulk delete
    const activeContentsToDelete = selectedContentsToDelete.filter(
      (content) => !content.deletedAt
    );

    if (activeContentsToDelete.length === 0) {
      showSnackbar(
        "No active feature content selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeContentsToDelete.map((content) => content.id);

    try {
      setIsLoading(true);
      // Delete all selected items in parallel
      await Promise.all(idsToDelete.map((id) => deleteFeatureContent(id)));

      showSnackbar(
        `${idsToDelete.length} feature content item(s) deleted successfully!`,
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

  const columns = useMemo<MRT_ColumnDef<FeatureContent>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'subtitle', header: 'Subtitle' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => {
          const status = row.original.status || '';
          return status.charAt(0).toUpperCase() + status.slice(1);
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

  if (isLoading) return <FuseLoading />;

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
            value={status}
            onChange={e => setStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 120, mx: 1 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
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

          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={featureContents}
          columns={columns}
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
          hideRowSelectionCheckboxes={true}
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
        <div className="flex justify-center p-4">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            shape="rounded"
            color="primary"
          />
        </div>
        {/* Delete/Restore Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm {selectedContent?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {selectedContent?.deletedAt ? 'restore' : 'delete'} <strong>{selectedContent?.title}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedContent?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Create Dialog */}
        <Dialog open={!!isCreateOpen} onClose={() => { setIsCreateOpen(false); setEditItem(null); onCreateClosed?.(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: 'white' } }}>
          <DialogTitle>{editItem ? 'Edit Feature Content' : 'Create Feature Content'}</DialogTitle>
          <DialogContent dividers>
            <CreateFeatureContentForm
              item={editItem as any}
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
          <DialogTitle>Bulk Delete Feature Content</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              feature content item(s)? This action cannot be undone.
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

export default FeatureContentList;
