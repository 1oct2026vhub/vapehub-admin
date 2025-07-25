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
  ListItemIcon,
  Chip,
} from '@mui/material';
import { getSubscribers, Subscriber, FetchSubscribersParams, toggleSubscription } from '@/services/apiSubscribers';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const SubscribersTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchSubscribersParams = { page, limit };
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
  }, [page, limit, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleToggleSubscription = async (subscriber: Subscriber) => {
    try {
      await toggleSubscription(subscriber.email);
      showSnackbar(
        subscriber.is_subscribed 
          ? 'Subscriber unsubscribed successfully!' 
          : 'Subscriber subscribed successfully!', 
        'success'
      );
      // Refresh data to get updated subscription status
      fetchData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to toggle subscription', 'error');
    }
  };

  const columns = useMemo<MRT_ColumnDef<Subscriber>[]>(
    () => [
      { 
        accessorKey: 'id', 
        header: 'ID'
      },
      { 
        accessorKey: 'email', 
        header: 'Email',
      },
      { 
        accessorKey: 'user_id', 
        header: 'User ID',
        Cell: ({ row }) => row.original.user_id || 'N/A',
      },
      {
        accessorKey: 'is_subscribed',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            label={row.original.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
            color={row.original.is_subscribed ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Subscribed At",
        Cell: ({ row }) => formatDate(row.original.createdAt),
      },
      // Add this to hide the Actions label
      {
        id: "mrt-row-actions",
        header: "",
      },
    ],
    []
  );

  if (isLoading) return <FuseLoading />;
  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <DataTable
          data={subscribers}
          columns={columns}
          enableColumnOrdering
          renderRowActionMenuItems={({ closeMenu, row }) => [
            <MenuItem
              key="toggle"
              onClick={() => {
                handleToggleSubscription(row.original);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>
                  {row.original.is_subscribed 
                    ? "heroicons-outline:envelope-open" 
                    : "heroicons-outline:envelope"
                  }
                </FuseSvgIcon>
              </ListItemIcon>
              {row.original.is_subscribed ? 'Unsubscribe' : 'Subscribe'}
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
    </div>
  );
};

export default SubscribersTable; 