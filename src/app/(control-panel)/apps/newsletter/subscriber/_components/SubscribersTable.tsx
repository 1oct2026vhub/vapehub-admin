'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { getSubscribers, Subscriber, FetchSubscribersParams } from '@/services/apiSubscribers';
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
    }
  );

  const { page, limit, subscribed } = pageState;
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setLimit = (value: number) => setPageState(prev => ({ ...prev, limit: value }));
  const setSubscribed = (value: boolean) => setPageState(prev => ({ ...prev, subscribed: value }));

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchSubscribersParams = { page, limit, subscribed };
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
  }, [page, limit, subscribed, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  
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
    return subscribed !== true;
  }, [subscribed]);

  if (isLoading) return <FuseLoading />;
  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <Box className="flex items-center gap-2 p-4 border-b">
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
          enableRowActions={false}
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
    </div>
  );
};

export default SubscribersTable; 