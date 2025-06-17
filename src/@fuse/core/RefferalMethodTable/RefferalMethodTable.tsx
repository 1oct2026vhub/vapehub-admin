'use client';
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
  Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { getReferralMethods, ReferralMethod, FetchReferralMethodsParams, deleteReferralMethod, updateReferralMethodPrimary, updateReferralMethodStatus } from '@/services/apiRefferalMethods';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';

const RefferalMethodTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [referralMethods, setReferralMethods] = useState<ReferralMethod[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReferralMethod, setSelectedReferralMethod] = useState<ReferralMethod | null>(null);
  const [status, setStatus] = useState<string>('');
  const [primary, setPrimary] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [order, setOrder] = useState<string>('DESC');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const areFiltersActive = useMemo(() => {
    return search !== '' || status !== '' || primary !== '' || sortBy !== 'created_at' || order !== 'DESC';
  }, [search, status, primary, sortBy, order]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setPrimary('');
    setSortBy('created_at');
    setOrder('DESC');
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
      const params: FetchReferralMethodsParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status ? status as 'active' | 'inactive' : undefined,
        primary: primary ? (primary === 'true') : undefined,
        sort_by: sortBy as any,
        order: order as 'ASC' | 'DESC',
      };
      const res = await getReferralMethods(params);
      setReferralMethods(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
      setLimit(res.data?.pagination?.limit || 10);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status, primary, sortBy, order]);

  const handleDeleteClick = (method: ReferralMethod) => {
    setSelectedReferralMethod(method);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedReferralMethod) return;
    try {
      await deleteReferralMethod(selectedReferralMethod.id);
      showSnackbar('Referral method deleted successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };

  const handlePrimaryChange = async (method: ReferralMethod, isChecked: boolean) => {
    setUpdating(prev => ({ ...prev, [`primary-${method.id}`]: true }));
    try {
      await updateReferralMethodPrimary(method.id, isChecked);
      showSnackbar('Primary status updated successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to update primary status', 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [`primary-${method.id}`]: false }));
    }
  };

  const handleStatusChange = async (method: ReferralMethod, newStatus: 'active' | 'inactive') => {
    setUpdating(prev => ({ ...prev, [`status-${method.id}`]: true }));
    try {
      await updateReferralMethodStatus(method.id, newStatus);
      showSnackbar('Status updated successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [`status-${method.id}`]: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const columns = useMemo<MRT_ColumnDef<ReferralMethod>[]>(
    () => [
      {
        accessorKey: 'refer_type',
        header: 'Referral Type',
        Cell: ({ row }) => {
          const text = row.original.refer_type || '';
          return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        },
      },
      {
        accessorKey: 'referral_value_type',
        header: 'Type',
        Cell: ({ row }) => {
          const text = row.original.referral_value_type || '';
          return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        },
      },
      { accessorKey: 'referral_value', header: 'Value' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => {
          const status = row.original.status || '';
          return status.charAt(0).toUpperCase() + status.slice(1);
        },
      },
      {
        accessorKey: 'primary',
        header: 'Primary',
        Cell: ({ row }) => (row.original.primary ? 'Yes' : 'No'),
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
          />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            displayEmpty
            size="small"
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
          <Select
            value={primary}
            onChange={e => setPrimary(e.target.value)}
            displayEmpty
            size="small"
          >
            <MenuItem value="">Any Primary</MenuItem>
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            displayEmpty
            size="small"
          >
            <MenuItem value="id">ID</MenuItem>
            <MenuItem value="referral_value_type">Type</MenuItem>
            <MenuItem value="referral_value">Value</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="primary">Primary</MenuItem>
            <MenuItem value="created_at">Created At</MenuItem>
            <MenuItem value="updated_at">Updated At</MenuItem>
          </Select>
          <Select
            value={order}
            onChange={e => setOrder(e.target.value)}
            displayEmpty
            size="small"
          >
            <MenuItem value="ASC">Ascending</MenuItem>
            <MenuItem value="DESC">Descending</MenuItem>
          </Select>
          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={referralMethods}
          columns={columns}
          enableColumnOrdering
          renderRowActionMenuItems={({ closeMenu, row }) => [
              <MenuItem key="edit" onClick={() => { router.push(`/apps/refferal-methods/refferal-method-edit/${row.original.id}`); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                </ListItemIcon>
                Edit
              </MenuItem>,
              <MenuItem key="primary" onClick={() => { handlePrimaryChange(row.original, !row.original.primary); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>{row.original.primary ? "heroicons-outline:star" : "heroicons-solid:star"}</FuseSvgIcon>
                </ListItemIcon>
                {row.original.primary ? "Unset as Primary" : "Set as Primary"}
              </MenuItem>,
              <MenuItem key="status" onClick={() => { handleStatusChange(row.original, row.original.status === 'active' ? 'inactive' : 'active'); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>{row.original.status === 'active' ? "heroicons-outline:eye-slash" : "heroicons-outline:eye"}</FuseSvgIcon>
                </ListItemIcon>
                {row.original.status === 'active' ? "Deactivate" : "Activate"}
              </MenuItem>,
              <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                </ListItemIcon>
                Delete
              </MenuItem>
            ]}
        />
        <div className="flex justify-center p-4">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            shape="rounded"
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
        </div>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this referral method?
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

export default RefferalMethodTable; 