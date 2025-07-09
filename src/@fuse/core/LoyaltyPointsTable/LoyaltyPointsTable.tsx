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
  Select,
  Pagination,
  PaginationItem,
  ListItemIcon,
  Switch,
} from '@mui/material';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { getLoyaltyPointsSettings, LoyaltyPointSetting, FetchLoyaltyPointsSettingsParams, deleteLoyaltyPointSetting } from '@/services/apiLoyaltyPoints';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';

const LoyaltyPointsTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [settings, setSettings] = useState<LoyaltyPointSetting[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<LoyaltyPointSetting | null>(null);
  const [status, setStatus] = useState<string>('');
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const areFiltersActive = useMemo(() => status !== '', [status]);

  const clearFilters = () => {
    setStatus('');
    setPage(1);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchLoyaltyPointsSettingsParams = {
        page,
        limit,
        status: status || undefined,
      };
      const res = await getLoyaltyPointsSettings(params);
      setSettings(res.data?.settings || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
      setLimit(res.data?.pagination?.limit || 10);
    } catch(e) {
        console.error(e);
        showSnackbar('Failed to fetch loyalty point settings.', 'error')
    }
    finally {
      setIsLoading(false);
    }
  }, [page, limit, status, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (setting: LoyaltyPointSetting) => {
    setSelectedSetting(setting);
    setOpenDialog(true);
  };
  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedSetting) return;
    try {
        await deleteLoyaltyPointSetting(selectedSetting.id);
        showSnackbar('Loyalty point setting deleted successfully!', 'success');
        fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };

  const columns = useMemo<MRT_ColumnDef<LoyaltyPointSetting>[]>(
    () => [
      { accessorKey: 'program_name', header: 'Program Name' },
      { accessorKey: 'points_value', header: 'Points Value' },
      { accessorKey: 'loyalty_amount', header: 'Loyalty Amount' },
      {
        accessorKey: 'loyalty_amount_type',
        header: 'Amount Type',
        Cell: ({ row }) => (row.original.loyalty_amount_type.charAt(0).toUpperCase() + row.original.loyalty_amount_type.slice(1)),
      },
      { accessorKey: 'minimum_points_redemption', header: 'Min Redemption' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => <Switch checked={row.original.status} readOnly />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        Cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        accessorKey: 'updatedBy.first_name',
        header: 'Updated By',
        Cell: ({ row }) => {
            const { updatedBy } = row.original;
            if (!updatedBy) {
                return 'N/A';
            }
            const fullName = `${updatedBy.first_name || ''} ${updatedBy.last_name || ''}`.trim();
            return fullName || updatedBy.email || 'N/A';
        },
      },
    ],
    []
  );

  if (isLoading) return <FuseLoading />;

  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden">
        <div className="flex items-center p-3 flex-wrap gap-2">
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 120, mx: 1 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={settings}
          columns={columns}
          enableColumnOrdering
          enableRowSelection
          muiTableHeadCellProps={{
          }}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              <MenuItem key="edit" onClick={() => { router.push(`/apps/loyalty-points/loyalty-point-edit/${row.original.id}`); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                </ListItemIcon>
                Edit
              </MenuItem>,
              <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                </ListItemIcon>
                Delete
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
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete <strong>{selectedSetting?.program_name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default LoyaltyPointsTable; 