'use client';
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { formatDate } from "@/utils/actions";
import FuseLoading from '@fuse/core/FuseLoading';
import {
  Paper,
  Pagination,
  PaginationItem,
  MenuItem,
  Chip,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListItemIcon,
  Typography,
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { getSubscribers, unsubscribeSubscriber, deleteSubscriber, Subscriber, FetchSubscribersParams } from '@/services/apiSubscribers';
import { useSnackbar } from '@/contexts/SnackbarContext';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { usePageState } from '@/hooks/usePageState';

const SubscribersTable: React.FC = () => {
  // Persist table filters in session storage
  const [pageState, setPageState, clearPageState] = usePageState(
    "subscribersTable",
    {
      page: 1,
      limit: 10,
      subscribed: true,
      search: '',
    }
  );

  const { page, limit, subscribed, search } = pageState;
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setLimit = (value: number) => setPageState(prev => ({ ...prev, limit: value }));
  const setSubscribed = (value: boolean) => setPageState(prev => ({ ...prev, subscribed: value }));
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value, page: 1 }));

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null);
  const [searchInput, setSearchInput] = useState(search ?? '');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showSnackbar } = useSnackbar();

  // Sync search input when page state search is cleared (e.g. Clear filters)
  useEffect(() => {
    setSearchInput(search ?? '');
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchSubscribersParams = { page, limit, subscribed };
      if (search?.trim()) params.search = search.trim();
      const res = await getSubscribers(params);
      setSubscribers(res.data?.subscribers || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
    } catch (error) {
        showSnackbar('Failed to fetch subscribers', 'error');
    }
    finally {
      setIsLoading(false);
    }
  }, [page, limit, subscribed, search, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleUnsubscribe = useCallback(async (subscriber: Subscriber) => {
    try {
      await unsubscribeSubscriber(subscriber.id);
      showSnackbar('Subscriber unsubscribed successfully', 'success');
      fetchData();
    } catch {
      showSnackbar('Failed to unsubscribe', 'error');
    }
  }, [showSnackbar, fetchData]);

  const handleDeleteClick = useCallback((subscriber: Subscriber) => {
    setSubscriberToDelete(subscriber);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!subscriberToDelete) return;
    setDeleteDialogOpen(false);
    try {
      await deleteSubscriber(subscriberToDelete.id);
      showSnackbar('Subscriber deleted successfully', 'success');
      setSubscriberToDelete(null);
      fetchData();
    } catch {
      showSnackbar('Failed to delete subscriber', 'error');
      setSubscriberToDelete(null);
    }
  }, [subscriberToDelete, showSnackbar, fetchData]);

  
  const columns = useMemo<MRT_ColumnDef<Subscriber>[]>(
    () => [
      { 
        accessorKey: 'id', 
        header: 'ID'
      },
    
      { 
        accessorKey: 'user_id', 
        header: 'User ID',
        Cell: ({ row }) => row.original.user_id || 'N/A',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        Cell: ({ row }) => row.original.email || 'N/A',
      },
      {
        accessorKey: 'subscribed',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            label={row.original.subscribed ? 'Subscribed' : 'Unsubscribed'}
            color={row.original.subscribed ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Subscribed At",
        Cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    []
  );

  const handleSubscribedFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setSubscribed(value === 'true');
    setPage(1); // Reset to first page when filter changes
  };

  const areFiltersActive = useMemo(() => {
    return subscribed !== true || (search?.trim() ?? '') !== '';
  }, [subscribed, search]);

  if (isLoading) return <FuseLoading />;
  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <Box className="flex items-center gap-2 p-4 border-b flex-wrap">
          <TextField
            size="small"
            label="Search by email"
            placeholder="Search by email"
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => setSearch(value), 400);
            }}
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label="Subscription Status"
            value={subscribed.toString()}
            onChange={handleSubscribedFilterChange}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="true">Subscribed</MenuItem>
            <MenuItem value="false">Unsubscribed</MenuItem>
          </TextField>

          {areFiltersActive && (
            <ClearFiltersButton
              onClick={() => {
                setSubscribed(true);
                setSearchInput('');
                setSearch('');
                setPage(1);
                clearPageState(); // Clear session storage
              }}
            />
          )}
        </Box>
        <DataTable
          data={subscribers}
          columns={columns}
          enableColumnOrdering
          enableRowActions
          renderRowActionMenuItems={({ closeMenu, row }) => [
            ...(row.original.subscribed
              ? [
                  <MenuItem
                    key="unsubscribe"
                    onClick={() => {
                      handleUnsubscribe(row.original);
                      closeMenu();
                    }}
                  >
                    <ListItemIcon>
                      <FuseSvgIcon>heroicons-outline:bell-slash</FuseSvgIcon>
                    </ListItemIcon>
                    Unsubscribe
                  </MenuItem>,
                ]
              : []),
            <MenuItem
              key="delete"
              onClick={() => {
                handleDeleteClick(row.original);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon className="text-red-500">heroicons-outline:trash</FuseSvgIcon>
              </ListItemIcon>
              <Typography color="error">Delete</Typography>
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this subscriber
            {subscriberToDelete?.email ? ` (${subscriberToDelete.email})` : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SubscribersTable; 