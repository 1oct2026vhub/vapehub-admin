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
  FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { getDeals, Deal, FetchDealsParams, deleteDeal, restoreDeal } from '@/services/apiDeals';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useFetch } from '@/hooks/useFetch';
import { mutate } from 'swr';

const DealsTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState<string>('');
  const [dealType, setDealType] = useState<string>('BUY_N_FOR_FIXED');
  const [validNow, setValidNow] = useState<boolean | null>(null);
  const [isDeleted, setIsDeleted] = useState<boolean | null>(null);
  const [localDeals, setLocalDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const areFiltersActive = useMemo(() => {
    return search !== '' || status !== '' || validNow !== null || isDeleted !== null;
  }, [search, status, validNow, isDeleted]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setDealType('BUY_N_FOR_FIXED');
    setValidNow(null);
    setIsDeleted(null);
    setPage(1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => {
    const params: FetchDealsParams = { page, limit };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status === 'active';
    if (dealType) params.type = dealType;
    if (validNow !== null) params.validNow = validNow;
    if (isDeleted !== null) params.deleted = isDeleted;
    return params;
  }, [page, limit, debouncedSearch, status, dealType, validNow, isDeleted]);

  const { data, error, isLoading: fetchLoading } = useFetch(['dealsList', queryParams], () => getDeals(queryParams), {
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data?.data.deals) {
      setLocalDeals(data.data.deals);
    }
    setIsLoading(fetchLoading && localDeals.length === 0);
  }, [data?.data.deals, fetchLoading, localDeals.length]);

  const total = data?.data.pagination?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setOpenDialog(true);
  };
  
  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedDeal) return;
    try {
      if (selectedDeal.deletedAt) {
        await restoreDeal(selectedDeal.id);
        showSnackbar('Deal restored successfully!', 'success');
      } else {
        await deleteDeal(selectedDeal.id);
        showSnackbar('Deal deleted successfully!', 'success');
      }
      mutate(['dealsList', queryParams]);
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };

  const columns = useMemo<MRT_ColumnDef<Deal>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'deal_type',
        header: 'Deal Type',
        Cell: ({ row }) => {
          const dealType = row.original.deal_type || '';
          return dealType
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        Cell: ({ row }) => (row.original.is_active ? 'Active' : 'Inactive'),
      },
      {
        accessorKey: "valid_from",
        header: "Valid From",
        Cell: ({ row }) => row.original.valid_from ? formatDate(row.original.valid_from) : 'N/A',
      },
      {
        accessorKey: "valid_to",
        header: "Valid To",
        Cell: ({ row }) => row.original.valid_to ? formatDate(row.original.valid_to) : 'N/A',
      },
       {
        accessorKey: 'products',
        header: 'Products',
        Cell: ({ row }) => row.original.products.length,
      },
    ],
    []
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Error loading deals.</p>;

  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <div className="flex items-center p-3 flex-wrap gap-2">
          {/* <TextField
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
              minWidth: 180,
            }}
          /> */}
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
          {/* <Select
            value={dealType}
            onChange={e => setDealType(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="BUY_MORE_SAVE_MORE">Buy More Save More</MenuItem>
            <MenuItem value="BUY_X_GET_Y_FREE">Buy X Get Y Free</MenuItem>
            <MenuItem value="BUY_N_FOR_FIXED">Buy N For Fixed</MenuItem>
          </Select> */}
          <FormControlLabel
                control={<Switch checked={validNow === true} onChange={(e) => setValidNow(e.target.checked ? true : null)} />}
                label="Valid Now"
            />
             <FormControlLabel
                control={<Switch checked={isDeleted === true} onChange={(e) => setIsDeleted(e.target.checked ? true : null)} />}
                label="Show Deleted"
            />
          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={localDeals}
          columns={columns}
          enableColumnOrdering
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              <MenuItem key="edit" onClick={() => { router.push(`/apps/deals/deal-edit/${row.original.id}`); closeMenu(); }}>
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
          />
        </div>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm {selectedDeal?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {selectedDeal?.deletedAt ? 'restore' : 'delete'} <strong>{selectedDeal?.name}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedDeal?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default DealsTable; 