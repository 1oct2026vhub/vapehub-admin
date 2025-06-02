'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Paper, TextField, MenuItem, Select, InputAdornment, Pagination, PaginationItem, ListItemIcon, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '@/components/data-table/DataTable';
import { getFlashNews, deleteFlashNews, restoreFlashNews, FlashNews } from '@/services/apiFlashNews';
import AppButton from '@/components/Shared/AppButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';

const FlashNewsTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [flashNews, setFlashNews] = useState<FlashNews[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFlashNews, setSelectedFlashNews] = useState<FlashNews | null>(null);
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
            onChange={e => setDeleted(e.target.value === 'active' ? null : true)}
            size="small"
            sx={{ minWidth: 120, mx: 1 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>
          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={flashNews}
          columns={columns}
          enableColumnOrdering
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
    </div>
  );
};

export default FlashNewsTable; 