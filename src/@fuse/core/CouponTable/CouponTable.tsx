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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { getCoupons, Coupon, FetchCouponsParams, deleteCoupon, restoreCoupon } from '@/services/apiCoupon';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';

const CouponTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [status, setStatus] = useState<string>('');
  const [discountType, setDiscountType] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  // --- START: Are Filters Active ---
  const areFiltersActive = useMemo(() => {
    return search !== '' || deleted !== null || status !== '' || discountType !== '' || entityType !== '' || startDate !== '' || endDate !== '';
  }, [search, deleted, status, discountType, entityType, startDate, endDate]);
  // --- END ---

  // --- START: Clear Filters ---
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setDiscountType('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setDeleted(null);
    setPage(1);
  };
  // --- END ---

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch coupons
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchCouponsParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status ? status as 'active' | 'inactive' | 'expired' : undefined,
        discount_type: discountType ? discountType as 'percentage' | 'fixed_amount' : undefined,
        entity_type: entityType ? entityType as 'product' | 'category' | 'brand' : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const res = await getCoupons(params);
      setCoupons(res.data?.coupons || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
      setLimit(res.data?.pagination?.limit || 10);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status, discountType, entityType, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  // --- START: Dialog handlers (delete/restore) ---
  const handleDeleteClick = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setOpenDialog(true);
  };
  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedCoupon) return;
    try {
      if (selectedCoupon.deletedAt) {
        await restoreCoupon(selectedCoupon.id);
        showSnackbar('Coupon restored successfully!', 'success');
      } else {
        await deleteCoupon(selectedCoupon.id);
        showSnackbar('Coupon deleted successfully!', 'success');
      }
      fetchData();
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };
  // --- END ---

  // --- Columns for DataTable ---
  const columns = useMemo<MRT_ColumnDef<Coupon>[]>(
    () => [
      { accessorKey: 'code', header: 'Code' },
      {
        accessorKey: 'entity_type',
        header: 'Entity Type',
        Cell: ({ row }) => {
          const entityType = row.original.entity_type;
          if (!entityType) {
            return 'All';
          }
          return entityType.charAt(0).toUpperCase() + entityType.slice(1);
        },
      },
      // { accessorKey: 'description', header: 'Description' },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ row }) => {
          const status = row.original.status || '';
          return status.charAt(0).toUpperCase() + status.slice(1);
        },
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
      { accessorKey: 'discount_value', header: 'Discount value' },
      { accessorKey: 'usage_count', header: 'Usage count' },
      {
        accessorKey: "start_date",
        header: "Start Date",
        Cell: ({ row }) => row.original.start_date ? formatDate(row.original.start_date) : 'N/A',
      },
      {
        accessorKey: "end_date",
        header: "End Date",
        Cell: ({ row }) => row.original.end_date ? formatDate(row.original.end_date) : 'N/A',
      },
      // { accessorKey: 'end_date', header: 'End Date' },
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
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#2E9970',
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#2E9970',
              },
              minWidth: 180,
            }}
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
            <MenuItem value="expired">Expired</MenuItem>
          </Select>
          <Select
            value={discountType}
            onChange={e => setDiscountType(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 140, mx: 1 }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="percentage">Percentage</MenuItem>
            <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
          </Select>
          <Select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 140, mx: 1 }}
          >
            <MenuItem value="">All Entity Types</MenuItem>
            <MenuItem value="product">Product</MenuItem>
            <MenuItem value="category">Category</MenuItem>
            <MenuItem value="brand">Brand</MenuItem>
          </Select>
          <TextField
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            size="small"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            sx={{ mx: 1, minWidth: 140 }}
          />
          <TextField
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            size="small"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            sx={{ mx: 1, minWidth: 140 }}
          />
          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={coupons}
          columns={columns}
          enableColumnOrdering
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              // <MenuItem key="view-details" onClick={() => { router.push(`/apps/coupon/${row.original.id}`); closeMenu(); }}>
              //   <ListItemIcon>
              //     <FuseSvgIcon>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>
              //   </ListItemIcon>
              //   View Details
              // </MenuItem>,
              <MenuItem key="edit" onClick={() => { router.push(`/apps/coupon/coupon-edit/${row.original.id}`); closeMenu(); }}>
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
            Confirm {selectedCoupon?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {selectedCoupon?.deletedAt ? 'restore' : 'delete'} <strong>{selectedCoupon?.code}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedCoupon?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default CouponTable; 