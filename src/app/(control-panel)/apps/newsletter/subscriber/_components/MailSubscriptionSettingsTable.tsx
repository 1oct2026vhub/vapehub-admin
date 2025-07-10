'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { formatDate } from "@/utils/actions";
import FuseLoading from '@fuse/core/FuseLoading';
import {
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  MenuItem,
  Pagination,
  PaginationItem,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { getMailSubscriptionSettings, MailSubscriptionSetting, FetchSettingsParams, deleteSetting, restoreSetting } from '@/services/apiMailSubscriptionSettings';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useRouter } from 'next/navigation';

const MailSubscriptionSettingsTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [settings, setSettings] = useState<MailSubscriptionSetting[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<MailSubscriptionSetting | null>(null);
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchSettingsParams = { page, limit };
      const res = await getMailSubscriptionSettings(params);
      setSettings(res.data?.settings || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
      setLimit(res.data?.pagination?.limit || 10);
    } catch (error) {
        showSnackbar('Failed to fetch settings', 'error');
    }
    finally {
      setIsLoading(false);
    }
  }, [page, limit, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (setting: MailSubscriptionSetting) => {
    setSelectedSetting(setting);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedSetting) return;
    try {
      if (selectedSetting.deletedAt) {
        await restoreSetting(selectedSetting.id);
        showSnackbar('Setting restored successfully!', 'success');
      } else {
        await deleteSetting(selectedSetting.id);
        showSnackbar('Setting deleted successfully!', 'success');
      }
      fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };

  const columns = useMemo<MRT_ColumnDef<MailSubscriptionSetting>[]>(
    () => [
      { 
        accessorKey: 'id', 
        header: 'ID'
      },
      { 
        accessorKey: 'email_frequency', 
        header: 'Email Frequency',
        Cell: ({ row }) => {
          const frequency = row.original.email_frequency || '';
          return frequency.charAt(0).toUpperCase() + frequency.slice(1);
        },
      },
      { 
        accessorKey: 'product_updates', 
        header: 'Product Updates',
        Cell: ({ row }) => row.original.product_updates ? 'Yes' : 'No',
      },
      { 
        accessorKey: 'discount_notifications', 
        header: 'Discount Notifications',
        Cell: ({ row }) => row.original.discount_notifications ? 'Yes' : 'No',
      },
      { 
        accessorKey: 'discount_amount', 
        header: 'Discount' 
      },
      { 
        accessorKey: 'discount_type', 
        header: 'Discount Type',
        Cell: ({ row }) => {
            const discountType = row.original.discount_type || '';
            const formatted = discountType
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return formatted;
          },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            label={row.original.status ? 'Active' : 'Inactive'}
            color={row.original.status ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
    ],
    []
  );

  if (isLoading) return <FuseLoading />;

  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <DataTable
          data={settings}
          columns={columns}
          enableColumnOrdering
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              <MenuItem key="edit" onClick={() => { router.push(`/apps/newsletter/settings/${row.original.id}`); closeMenu(); }}>
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
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm {selectedSetting?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {selectedSetting?.deletedAt ? 'restore' : 'delete'} this setting?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedSetting?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default MailSubscriptionSettingsTable; 