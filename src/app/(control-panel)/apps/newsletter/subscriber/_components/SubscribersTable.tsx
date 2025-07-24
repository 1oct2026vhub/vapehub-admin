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
} from '@mui/material';
import { getSubscribers, Subscriber, FetchSubscribersParams } from '@/services/apiSubscribers';
import { useSnackbar } from '@/contexts/SnackbarContext';

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
        accessorKey: "createdAt",
        header: "Subscribed At",
        Cell: ({ row }) => formatDate(row.original.createdAt),
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