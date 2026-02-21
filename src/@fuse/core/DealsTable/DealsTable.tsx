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
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import FormTextField from '@/components/Shared/FormTextField';
import { getDeals, Deal, FetchDealsParams, deleteDeal, restoreDeal, bulkDeleteDeals, bulkRestoreDeals } from '@/services/apiDeals';
import { listProducts } from '@/services/apiProduct';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import debounce from 'lodash/debounce';
import { usePageState } from '@/hooks/usePageState';
import { z } from 'zod';

interface Product {
  id: number;
  name: string;
  description?: string;
}

const DealsTable: React.FC = () => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  
  // Use session storage for filter state
  const [pageState, setPageState, clearPageState] = usePageState(
    "dealsTable",
    {
      search: '',
      page: 1,
      status: '',
      dealType: 'BUY_N_FOR_FIXED',
      validNow: null as boolean | null,
      isDeleted: null as boolean | null,
      selectedProductId: null as number | null,
    }
  );

  // Use pageState values directly
  const { search, page, status, dealType, validNow, isDeleted, selectedProductId } = pageState;
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState(100);
  
  // Helper functions to update pageState
  const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
  const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
  const setStatus = (value: string) => setPageState(prev => ({ ...prev, status: value }));
  const setDealType = (value: string) => setPageState(prev => ({ ...prev, dealType: value }));
  const setValidNow = (value: boolean | null) => setPageState(prev => ({ ...prev, validNow: value }));
  const setIsDeleted = (value: boolean | null) => setPageState(prev => ({ ...prev, isDeleted: value }));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Optional redirect URL when deleting deal (same validation as ProductListTable: empty or valid URL)
  const [deleteRedirectUrl, setDeleteRedirectUrl] = useState("");
  const [deleteRedirectUrlError, setDeleteRedirectUrlError] = useState("");
  const redirectUrlSchema = z.string().url("Invalid URL format").optional().or(z.literal(""));
  
  // Product filter states
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    selectedProductId ? { id: selectedProductId, name: "" } : null
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Update selectedProduct when selectedProductId changes
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setSelectedProduct(product);
      }
    } else if (!selectedProductId) {
      setSelectedProduct(null);
    }
  }, [selectedProductId, products]);
  
  // Update selectedProductId when selectedProduct changes
  const handleSelectedProductChange = (product: Product | null) => {
    setSelectedProduct(product);
    setPageState(prev => ({ ...prev, selectedProductId: product ? product.id : null }));
  };

  const areFiltersActive = useMemo(() => {
    return search !== '' || status !== '' || validNow !== null || isDeleted !== null || selectedProduct !== null;
  }, [search, status, validNow, isDeleted, selectedProduct]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setDealType('BUY_N_FOR_FIXED');
    setValidNow(null);
    setIsDeleted(null);
    handleSelectedProductChange(null);
    setProductSearch('');
    setDebouncedProductSearch('');
    setPage(1);
    setRowSelection({}); // Clear row selection when filters are cleared
    clearPageState(); // Clear session storage
  };

  // Clear row selection when switching between active/deleted views
  useEffect(() => {
    setRowSelection({});
  }, [isDeleted]);

  // Debounced search for deals
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounced search for products
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Fetch products for autocomplete
  const fetchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // Load first 50 products when no search term
      try {
        setIsLoadingProducts(true);
        const response = await listProducts({ limit: 50 });
        setProducts(response.data?.products || []);
      } catch (error) {
        showSnackbar('Failed to fetch products', 'error');
      } finally {
        setIsLoadingProducts(false);
      }
      return;
    }

    try {
      setIsLoadingProducts(true);
      const response = await listProducts({ 
        keyword: searchTerm,
        limit: 20 
      });
      setProducts(response.data?.products || []);
    } catch (error) {
      showSnackbar('Failed to search products', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [showSnackbar]);

  // Load initial products
  useEffect(() => {
    fetchProducts('');
  }, [fetchProducts]);

  // Search products when debounced search changes
  useEffect(() => {
    fetchProducts(debouncedProductSearch);
  }, [debouncedProductSearch, fetchProducts]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchDealsParams = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status === 'active';
      if (dealType) params.type = dealType;
      if (validNow !== null) params.validNow = validNow;
      if (isDeleted !== null) params.deleted = isDeleted;
      if (selectedProduct) params.product_id = selectedProduct.id;
      
      const res = await getDeals(params);
      setDeals(res.data.deals || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (error) {
      showSnackbar('Failed to fetch deals', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, status, dealType, validNow, isDeleted, selectedProduct, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setOpenDialog(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedDeal) return;

    // Only validate redirect URL if deleting (not restoring)
    if (!selectedDeal.deletedAt) {
      const redirectUrl = deleteRedirectUrl.trim();
      if (redirectUrl) {
        const parsed = redirectUrlSchema.safeParse(redirectUrl);
        if (!parsed.success) {
          setDeleteRedirectUrlError(parsed.error.errors[0]?.message ?? "Invalid URL format");
          return;
        }
      }
    }

    setOpenDialog(false);

    try {
      const redirectUrl = deleteRedirectUrl.trim();
      const normalizedRedirectUrl = redirectUrl || undefined;

      if (selectedDeal.deletedAt) {
        await restoreDeal(selectedDeal.id);
        showSnackbar('Deal restored successfully!', 'success');
        clearFilters();
      } else {
        await deleteDeal(selectedDeal.id, normalizedRedirectUrl);
        showSnackbar('Deal deleted successfully' + (normalizedRedirectUrl ? ' (redirect created)' : '') + '!', 'success');
        fetchData();
      }
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    } finally {
      setSelectedDeal(null);
      setDeleteRedirectUrl("");
      setDeleteRedirectUrlError("");
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
    const selectedDealsToDelete = deals.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted deals for bulk delete
    const activeDealsToDelete = selectedDealsToDelete.filter(
      (deal) => !deal.deletedAt
    );

    if (activeDealsToDelete.length === 0) {
      showSnackbar(
        "No active deals selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeDealsToDelete.map((deal) => deal.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      await bulkDeleteDeals(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} deal(s) deleted successfully!`,
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
    const selectedDealsToRestore = deals.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted deals for bulk restore
    const deletedDealsToRestore = selectedDealsToRestore.filter(
      (deal) => deal.deletedAt
    );

    if (deletedDealsToRestore.length === 0) {
      showSnackbar(
        "No deleted deals selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedDealsToRestore.map((deal) => deal.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      await bulkRestoreDeals(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} deal(s) restored successfully!`,
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
              minWidth: 180,
            }}
          />
          <Autocomplete
            options={products}
            getOptionLabel={(option) => option.name}
            value={selectedProduct}
            onChange={(_, newValue) => handleSelectedProductChange(newValue)}
            inputValue={productSearch}
            onInputChange={(_, newInputValue) => setProductSearch(newInputValue)}
            loading={isLoadingProducts}
            size="small"
            sx={{ minWidth: 250 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filter by Product"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <div>
                  <div className="font-medium">{option.name}</div>
                </div>
              </li>
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={productSearch ? "No products found" : "Type to search products"}
            clearOnBlur={false}
          />
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

          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && isDeleted !== true && (
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
          {Object.keys(rowSelection).length > 0 && isDeleted === true && (
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
          data={deals}
          columns={columns}
          enableColumnOrdering
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection}
          state={{ rowSelection }}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [
              // Edit MenuItem (allow editing deleted deals as well)
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
        <Dialog 
          open={openDialog} 
          onClose={() => {
            setOpenDialog(false);
            setDeleteRedirectUrl("");
            setDeleteRedirectUrlError("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Confirm {selectedDeal?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: selectedDeal?.deletedAt ? 0 : 2 }}>
              Are you sure you want to {selectedDeal?.deletedAt ? 'restore' : 'delete'} <strong>{selectedDeal?.name}</strong>?
              {!selectedDeal?.deletedAt && " This action cannot be undone."}
            </Typography>
            {!selectedDeal?.deletedAt && (
              <TextField
                fullWidth
                label="Redirect URL (optional)"
                placeholder="https://example.com"
                value={deleteRedirectUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  setDeleteRedirectUrl(value);
                  const trimmed = value.trim();
                  if (!trimmed) {
                    setDeleteRedirectUrlError("");
                  } else {
                    const parsed = redirectUrlSchema.safeParse(trimmed);
                    setDeleteRedirectUrlError(parsed.success ? "" : (parsed.error.errors[0]?.message ?? "Invalid URL format"));
                  }
                }}
                size="small"
                error={!!deleteRedirectUrlError}
                helperText={deleteRedirectUrlError || "Leave empty to skip. Enter a valid URL (e.g. https://example.com)."}
                sx={{ mt: 1 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDialog(false);
              setDeleteRedirectUrl("");
              setDeleteRedirectUrlError("");
            }}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedDeal?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog
          open={isBulkDeleteDialogOpen}
          onClose={handleCloseBulkDeleteDialog}
        >
          <DialogTitle>Bulk Delete Deals</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              deal(s)? This action cannot be undone.
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
          <DialogTitle>Bulk Restore Deals</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              deal(s)?
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

export default DealsTable; 