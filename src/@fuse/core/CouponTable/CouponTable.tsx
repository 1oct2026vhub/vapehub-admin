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
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { getCoupons, Coupon, FetchCouponsParams, deleteCoupon, restoreCoupon, bulkDeleteCoupons, bulkRestoreCoupons } from '@/services/apiCoupon';
import { listProducts } from '@/services/apiProduct';
import { listProductBrand } from '@/services/apiProductBrand';
import { listProductCategory } from '@/services/apiProductCategory';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';

const CouponTable: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [discountType, setDiscountType] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [entityId, setEntityId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [entities, setEntities] = useState<any[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitySearchKeyword, setEntitySearchKeyword] = useState('');
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  // --- START: Are Filters Active ---
  const areFiltersActive = useMemo(() => {
    return search !== '' || deleted !== null || status !== '' || discountType !== '' || entityType !== '' || entityId !== null || startDate !== '' || endDate !== '';
  }, [search, deleted, status, discountType, entityType, entityId, startDate, endDate]);
  // --- END ---

  // --- START: Clear Filters ---
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setDiscountType('');
    setEntityType('');
    setEntityId(null);
    setStartDate('');
    setEndDate('');
    setDeleted(null);
    setPage(1);
    setEntitySearchKeyword('');
    setRowSelection({}); // Clear row selection when filters are cleared
  };
  // --- END ---

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch entities based on entity type
  const fetchEntities = useCallback(async (type: string, keyword: string = '') => {
    if (!type) {
      setEntities([]);
      return;
    }

    setEntitiesLoading(true);
    try {
      let response;
      const params: any = { 
        limit: 50,
        sort_by: 'id',
        order: 'DESC'
      };

      if (keyword) {
        if (type === 'product') {
          params.keyword = keyword;
        } else {
          params.search = keyword;
          params.search_only_name = true;
        }
      }

      switch (type) {
        case 'product':
          response = await listProducts(params);
          setEntities(response.data?.products || []);
          break;
        case 'brand':
          response = await listProductBrand(params);
          setEntities(response.data?.brands || []);
          break;
        case 'category':
          response = await listProductCategory(params);
          setEntities(response.data?.categories || []);
          break;
        default:
          setEntities([]);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
      setEntities([]);
    } finally {
      setEntitiesLoading(false);
    }
  }, []);

  // Fetch entities when entity type changes
  useEffect(() => {
    fetchEntities(entityType);
    setEntityId(null); // Reset entity ID when entity type changes
    setEntitySearchKeyword('');
  }, [entityType, fetchEntities]);

  // Fetch entities when search keyword changes (debounced)
  useEffect(() => {
    if (!entityType) return;
    
    const timer = setTimeout(() => {
      fetchEntities(entityType, entitySearchKeyword);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [entitySearchKeyword, entityType, fetchEntities]);

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
        entity_id: entityId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        deleted: deleted !== null ? deleted : undefined,
      };
      const res = await getCoupons(params);
      setCoupons(res.data?.coupons || []);
      setTotal(res.data?.pagination?.total || 0);
      setPage(res.data?.pagination?.page || 1);
      setLimit(res.data?.pagination?.limit || 10);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status, discountType, entityType, entityId, startDate, endDate, deleted]);

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

  // Bulk delete handlers
  const handleOpenBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const handleCloseBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(false);
  };

  const handleConfirmBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedCouponsToDelete = coupons.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted coupons for bulk delete
    const activeCouponsToDelete = selectedCouponsToDelete.filter(
      (coupon) => !coupon.deletedAt
    );

    if (activeCouponsToDelete.length === 0) {
      showSnackbar(
        "No active coupons selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeCouponsToDelete.map((coupon) => coupon.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      await bulkDeleteCoupons(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} coupon(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkDeleteDialog();
    }
  };

  // Bulk restore handlers
  const handleOpenBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(true);
  };

  const handleCloseBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(false);
  };

  const handleConfirmBulkRestore = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedCouponsToRestore = coupons.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted coupons for bulk restore
    const deletedCouponsToRestore = selectedCouponsToRestore.filter(
      (coupon) => coupon.deletedAt
    );

    if (deletedCouponsToRestore.length === 0) {
      showSnackbar(
        "No deleted coupons selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedCouponsToRestore.map((coupon) => coupon.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      await bulkRestoreCoupons(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} coupon(s) restored successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkRestoreDialog();
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
          {entityType && (
            <div className="flex items-center">
              <Autocomplete
                options={entities}
                getOptionLabel={(option) => option.name || option.title || ''}
                value={entities.find((e) => e.id === entityId) || null}
                onChange={(event, newValue) => {
                  setEntityId(newValue ? newValue.id : null);
                }}
                onInputChange={(event, newInputValue) => {
                  setEntitySearchKeyword(newInputValue);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  },
                  minWidth: 200,
                }}
                filterOptions={(x) => x}
                loading={entitiesLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Select ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
                    placeholder={`Search ${entityType}s...`}
                    size="small"
                    error={false}
                    helperText={
                      entitiesLoading 
                        ? 'Loading...' 
                        : entities.length < 0 
                          ? `No ${entityType}s available`
                          : ""
                    }
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {entitiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </div>
          )}
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
          <Select
            value={deleted === null ? "active" : deleted ? "deleted" : "active"}
            onChange={(e) =>
              setDeleted(
                e.target.value === "active"
                  ? null
                  : e.target.value === "deleted"
              )
            }
            size="small"
            sx={{ minWidth: 120, mx: 1 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>

          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && deleted !== true && (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>}
              onClick={handleOpenBulkDeleteDialog}
              sx={{
                backgroundColor: "#d32f2f",
                "&:hover": {
                  backgroundColor: "#b71c1c",
                },
              }}
            >
              Bulk Delete ({Object.keys(rowSelection).length})
            </Button>
          )}

          {/* Bulk Restore Button */}
          {Object.keys(rowSelection).length > 0 && deleted === true && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>}
              onClick={handleOpenBulkRestoreDialog}
              sx={{
                backgroundColor: "#2e7d32",
                "&:hover": {
                  backgroundColor: "#1b5e20",
                },
              }}
            >
              Bulk Restore ({Object.keys(rowSelection).length})
            </Button>
          )}

          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>
        <DataTable
          data={coupons}
          columns={columns}
          enableColumnOrdering
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
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

        {/* Bulk Delete Dialog */}
        <Dialog
          open={isBulkDeleteDialogOpen}
          onClose={handleCloseBulkDeleteDialog}
        >
          <DialogTitle>Bulk Delete Coupons</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              coupon(s)? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkDelete}
              color="error"
              variant="contained"
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Restore Dialog */}
        <Dialog
          open={isBulkRestoreDialogOpen}
          onClose={handleCloseBulkRestoreDialog}
        >
          <DialogTitle>Bulk Restore Coupons</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              coupon(s)?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkRestoreDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkRestore}
              color="success"
              variant="contained"
              disabled={isLoading}
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default CouponTable; 