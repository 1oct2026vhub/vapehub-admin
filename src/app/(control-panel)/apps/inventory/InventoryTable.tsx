'use client';
import {
    Paper,
    Avatar,
    Box,
    TextField,
    InputAdornment,
    ListItemIcon,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Menu,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Product, ProductsParams, getProductVariants, ProductVariant } from '@/services/apiInventory';
import { updateProductVariant } from '@/services/apiProduct';
import { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { useRouter } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { MenuItem } from '@mui/material';
import GenerateReportButton from './components/GenerateReportButton';
import TablePagination from '@/components/Shared/TablePagination';
import { useForm } from 'react-hook-form';
import FormInputField from '@/components/Shared/FormInputField';
import { useSnackbar } from '@/contexts/SnackbarContext';
import AppButton from '@/components/Shared/AppButton';
interface InventoryTableProps {
    products: Product[];
    loading: boolean;
    params: ProductsParams;
    onParamsChange: (params: Partial<ProductsParams>) => void;
    page: number;
    totalPages: number;
    limit: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onProductStockUpdate?: (productId: number, totalStock: number) => void;
}
const InventoryTable: React.FC<InventoryTableProps> = ({
    products,
    loading,
    params,
    onParamsChange,
    page,
    totalPages,
    limit,
    totalRecords,
    onPageChange,
    onLimitChange,
    onProductStockUpdate,
}) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const router = useRouter();
    const lastSearchRef = useRef<string | undefined>(undefined);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [variantsData, setVariantsData] = useState<Record<number, ProductVariant[]>>({});
    const [loadingVariants, setLoadingVariants] = useState<Set<number>>(new Set());
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [variantMenuAnchor, setVariantMenuAnchor] = useState<{ element: HTMLElement; productId: number; variantId: number } | null>(null);
    const [addStockDialog, setAddStockDialog] = useState<{ open: boolean; variantId: number | null; productId: number | null }>({
        open: false,
        variantId: null,
        productId: null,
    });
    const { showSnackbar } = useSnackbar();
    
    // Form for updating stock
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<{ stock: number }>({
        defaultValues: {
            stock: 0,
        },
        mode: 'onChange',
    });

    const areFiltersActive = useMemo(() => {
        return debouncedSearch !== '';
    }, [debouncedSearch]);

    const clearFilters = () => {
        setSearch('');
        onParamsChange({
            q: undefined,
            page: 1,
        });
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
          setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
      }, [search]);
    
      useEffect(() => {
        // Only update if the search value is different from what we last sent
        const newQ = debouncedSearch || undefined;
        if (lastSearchRef.current !== newQ) {
          lastSearchRef.current = newQ;
          // Reset to page 1 when search changes
          onParamsChange({ q: newQ, page: 1 });
        }
      }, [debouncedSearch, onParamsChange]);

    const handleRowExpand = async (productId: number, isExpanded: boolean) => {
        if (isExpanded) {
            // Fetch variants if not already loaded
            if (!variantsData[productId]) {
                setLoadingVariants(prev => new Set(prev).add(productId));
                try {
                    const response = await getProductVariants(productId);
                    setVariantsData(prev => ({
                        ...prev,
                        [productId]: response.data.variants
                    }));
                } catch (error) {
                    console.error('Failed to fetch variants', error);
                } finally {
                    setLoadingVariants(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(productId);
                        return newSet;
                    });
                }
            }
        }
    };

    const handleVariantMenuOpen = (event: React.MouseEvent<HTMLElement>, productId: number, variantId: number) => {
        event.stopPropagation();
        setVariantMenuAnchor({ element: event.currentTarget, productId, variantId });
    };

    const handleVariantMenuClose = () => {
        setVariantMenuAnchor(null);
    };

    const handleVariantViewDetails = (variantId: number) => {
        // Navigate to variant details page
        router.push(`/apps/inventory/${variantId}`);
        handleVariantMenuClose();
    };

    const handleCurrentStockClick = (productId: number, variantId: number) => {
        // Find the variant to get current stock
        const variants = variantsData[productId];
        const variant = variants?.find(v => v.id === variantId);
        const currentStock = variant?.currentStock ?? 0;
        
        setAddStockDialog({
            open: true,
            variantId,
            productId,
        });
        reset({ stock: currentStock });
    };

    const handleAddStockClose = () => {
        setAddStockDialog({
            open: false,
            variantId: null,
            productId: null,
        });
        reset({ stock: 0 });
    };

    const onSubmitAddStock = async (data: { stock: number | string }) => {
        if (!addStockDialog.variantId || !addStockDialog.productId) return;

        // Convert stock to number if it's a string
        const stock = typeof data.stock === 'string' ? Number(data.stock) : data.stock;

        if (isNaN(stock) || stock < 0) {
            showSnackbar('Please enter a valid stock quantity (must be 0 or greater)', 'error');
            return;
        }

        try {
            // Prepare update data with stock and stock_status
            const updateData = {
                stock: stock,
                ...(stock > 0 && { stock_status: "in_stock" }),
            } as any;

            await updateProductVariant(
                addStockDialog.productId,
                addStockDialog.variantId,
                updateData
            );
            
            showSnackbar(`Successfully updated stock to ${stock} units`, 'success');
            
            // Refresh variant data for the product
            setLoadingVariants(prev => new Set(prev).add(addStockDialog.productId!));
            try {
                const response = await getProductVariants(addStockDialog.productId);
                setVariantsData(prev => ({
                    ...prev,
                    [addStockDialog.productId!]: response.data.variants
                }));
                
                // Update product's total current stock
                if (response.data?.product?.totalStock !== undefined && onProductStockUpdate) {
                    onProductStockUpdate(addStockDialog.productId!, response.data.product.totalStock);
                }
            } catch (error) {
                console.error('Failed to refresh variants', error);
            } finally {
                setLoadingVariants(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(addStockDialog.productId!);
                    return newSet;
                });
            }
            
            handleAddStockClose();
        } catch (error: any) {
            console.error('Failed to update stock', error);
            showSnackbar(error?.response?.data?.message || 'Failed to update stock', 'error');
        }
    };

    const renderVariantDetails = (variants: ProductVariant[], productId: number) => {
        if (variants.length === 0) {
            return (
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        No variants found
                    </Typography>
                </Box>
            );
        }

        const currentMenu = variantMenuAnchor?.productId === productId 
            ? variantMenuAnchor 
            : null;

        return (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Variants ({variants.length})
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">Name</TableCell>
                                <TableCell>Image</TableCell>
                                {/* <TableCell>SKU</TableCell>                               */}
                                {/* <TableCell>Barcode</TableCell> */}
                                <TableCell align="center">Current Stock</TableCell>
                                <TableCell align="center">Low Stock Threshold</TableCell>
                                <TableCell align="center">Stock Status</TableCell>
                                <TableCell align="center">Price</TableCell>
                                <TableCell align="center">Sales (28 days)</TableCell>
                                <TableCell align="center">Stock Will Last (Days)</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variants.map((variant) => (
                                <TableRow key={variant.id}>
                                   <TableCell align="center">
                                        {variant.name 
                                            ? variant.name.charAt(0).toUpperCase() + variant.name.slice(1)
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {variant.image ? (
                                            <Avatar src={variant.image} sx={{ width: 40, height: 40 }} />
                                        ) : (
                                            <Avatar sx={{ width: 40, height: 40 }}>N/A</Avatar>
                                        )}
                                    </TableCell>
                                    {/* <TableCell>{variant.sku || 'N/A'}</TableCell> */}
                                    {/* <TableCell>{variant.barcode || 'N/A'}</TableCell> */}
                                    <TableCell 
                                        align="center"
                                        onClick={() => handleCurrentStockClick(productId, variant.id)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                            },
                                        }}
                                    >
                                        {variant.currentStock !== null && variant.currentStock !== undefined 
                                            ? variant.currentStock 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.lowStockThreshold !== null && variant.lowStockThreshold !== undefined 
                                            ? variant.lowStockThreshold 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.isOutOfStock ? (
                                            <Chip label="Out of Stock" color="error" size="small" />
                                        ) : variant.isLowStock ? (
                                            <Chip label="Low Stock" color="warning" size="small" />
                                        ) : (
                                            <Chip label="In Stock" color="success" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.discount_price ? (
                                            <Box>
                                                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                                    £{variant.regular_price}
                                                </Typography>
                                                <Typography variant="body2" color="error">
                                                    £{variant.discount_price}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            `£${variant.price}`
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.salesLast28Days !== null && variant.salesLast28Days !== undefined 
                                            ? variant.salesLast28Days 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.stockWillLastDays !== null && variant.stockWillLastDays !== undefined 
                                            ? variant.stockWillLastDays 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleVariantMenuOpen(e, productId, variant.id)}
                                            aria-label="variant actions"
                                        >
                                            <FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
                                        </IconButton>
                                        <Menu
                                            anchorEl={currentMenu?.variantId === variant.id ? currentMenu.element : null}
                                            open={currentMenu?.variantId === variant.id}
                                            onClose={handleVariantMenuClose}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'right',
                                            }}
                                        >
                                            <MenuItem
                                                onClick={() => handleVariantViewDetails(variant.id)}
                                            >
                                                <ListItemIcon>
                                                    <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                                                </ListItemIcon>
                                                View Details
                                            </MenuItem>
                                        </Menu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const columns = useMemo<MRT_ColumnDef<Product>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Product Name',
                size: 300,
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row, table }) => {
                    const productId = row.original.id;
                    const rowId = productId.toString();
                    const isExpanded = row.getIsExpanded();

                    return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    // Use the table instance to toggle expansion state
                                    table.setExpanded({
                                        ...expandedRows,
                                        [rowId]: !isExpanded,
                                    });
                                }}
                                sx={{ 
                                    mr: 1, 
                                    p: 0.5, 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                                aria-label={isExpanded ? "Close variant list" : "Open variant list"}
                            >
                                {isExpanded ? (
                                    <ExpandLessIcon fontSize="small" color="action" /> // Up arrow - click to close
                                ) : (
                                    <ExpandMoreIcon fontSize="small" color="action" /> // Down arrow - click to open
                                )}
                            </IconButton>
                            <Avatar src={row.original.image || undefined} sx={{ mr: 2 }}>
                                {row.original.name?.charAt(0) || 'N/A'}
                            </Avatar>
                            {row.original.name || 'N/A'}
                    </Box>
                    );
                },
            },
            { 
                accessorKey: 'currentStock', 
                header: 'Current Stock',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.currentStock !== null && row.original.currentStock !== undefined 
                        ? row.original.currentStock 
                        : 'N/A'
                ),
            },
            // { 
            //     accessorKey: 'stockOnHold', 
            //     header: 'Stock On Hold',
            //     muiTableHeadCellProps: { align: 'center' },
            //     muiTableBodyCellProps: { align: 'center' },
            //     enableSorting: false,
            //     enableColumnActions: false,
            //     Cell: ({ row }) => (
            //         row.original.stockOnHold !== null && row.original.stockOnHold !== undefined 
            //             ? row.original.stockOnHold 
            //             : 'N/A'
            //     ),
            // },
            { 
                accessorKey: 'reservedStock', 
                header: 'Reserved Stock',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.reservedStock !== null && row.original.reservedStock !== undefined 
                        ? row.original.reservedStock 
                        : 'N/A'
                ),
            },
            { 
                accessorKey: 'salesLast28Days', 
                header: 'Sales (Last 28 days)',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.salesLast28Days !== null && row.original.salesLast28Days !== undefined 
                        ? row.original.salesLast28Days 
                        : 'N/A'
                ),
            },
            { 
                accessorKey: 'stockWillLastDays', 
                header: 'Stock Will Last (Days)',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.stockWillLastDays !== null && row.original.stockWillLastDays !== undefined 
                        ? row.original.stockWillLastDays 
                        : 'N/A'
                ),
            },
        ],
        []
      );
    
    return (
        <div>
            <div className="flex items-end justify-end mb-4">
                <Box>
                    <GenerateReportButton disabled={loading} />
                </Box>
            </div>
            <Paper sx={{ width: '100%', overflow: 'hidden', p:2, backgroundColor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                        label="Search by product name"
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
                            minWidth: 300,
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                  borderColor: '#2E9970',
                                  borderWidth: '2px',
                                },
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: '#2E9970',
                              },
                        }}
                    />
                    <Box className="flex items-center flex-wrap gap-2">
                        {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
                    </Box>
                </Box>

            <DataTable
                data={products}
                columns={columns}
                manualPagination={true}
                state={{ 
                    isLoading: loading, 
                    expanded: expandedRows,
                    pagination: {
                        pageIndex: 0,
                        pageSize: products.length || limit || 10
                    }
                }}
                enableColumnDragging={false}
                enableExpanding={true}
                enableRowSelection={false}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id.toString()}
                initialState={{
                    columnVisibility: { 'mrt-row-expand': false }, // Hide the expand column
                    columnPinning: {
                        right: ['mrt-row-actions'], // Pin the actions column to the right
                    },
                }}
                onExpandedChange={(updater) => {
                    let newExpanded: Record<string, boolean>;
                    if (typeof updater === 'function') {
                        newExpanded = updater(expandedRows) as Record<string, boolean>;
                    } else {
                        newExpanded = updater as Record<string, boolean>;
                    }
                    
                    // Compare previous state with new state to detect actual expansion (not collapse)
                    Object.entries(newExpanded).forEach(([productIdStr, isExpanded]) => {
                        const productId = parseInt(productIdStr);
                        const wasExpanded = expandedRows[productIdStr] || false;
                        
                        // Only fetch if:
                        // 1. Row is being expanded (was false, now true)
                        // 2. Variants not already cached
                        // 3. Not currently loading
                        if (isExpanded && !wasExpanded && !variantsData[productId] && !loadingVariants.has(productId)) {
                            handleRowExpand(productId, true);
                        }
                        // If collapsing (was true, now false), do nothing - just update state
                    });
                    
                    // Update state - this controls the accordion
                    setExpandedRows(newExpanded);
                }}
                getRowCanExpand={() => true}
                enableExpandAll={false}
                renderDetailPanel={({ row }) => {
                    const productId = row.original.id;
                    const isExpanded = row.getIsExpanded(); // Use MRT's built-in state
                    
                    // Accordion: Only show detail panel when expanded
                    if (!isExpanded) {
                        return null;
                    }
                    
                    const isLoading = loadingVariants.has(productId);
                    const variants = variantsData[productId];

                    // Show loading spinner while fetching variants
                    if (isLoading) {
                        return (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 100 }}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" sx={{ ml: 2 }} color="text.secondary">
                                    Loading variants...
                                </Typography>
                            </Box>
                        );
                    }

                    // Show variant details if loaded
                    if (variants && variants.length > 0) {
                        return renderVariantDetails(variants, productId);
                    }

                    // Show message if no variants found
                    if (variants && variants.length === 0) {
                        return (
                            <Box sx={{ p: 3 }}>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    No variants found for this product
                                </Typography>
                            </Box>
                        );
                    }

                    // If variants haven't been fetched yet, show loading
                    // This should only happen briefly before the API call starts
                    return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 100 }}>
                            <CircularProgress size={24} />
                        </Box>
                    );
                }}
                renderRowActionMenuItems={({ closeMenu, row }) => [
                    // View Details removed from product row - now only in variant rows
                  ]}
            />

            <TablePagination
                page={page}
                totalPages={totalPages}
                limit={limit}
                totalRecords={totalRecords}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
            />
        </Paper>

        {/* Add Stock Dialog */}
        <Dialog 
            open={addStockDialog.open} 
            onClose={handleAddStockClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#ffffff',
                }
            }}
        >
            <DialogTitle>Update Stock</DialogTitle>
            <form onSubmit={handleSubmit(onSubmitAddStock)}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormInputField
                            name="stock"
                            control={control}
                            label="Stock"
                            type="number"
                            required
                            inputProps={{
                                min: 0,
                                step: 1,
                            }}
                            rules={{
                                required: 'Stock is required',
                                validate: {
                                    valid: (value) => {
                                        const numValue = typeof value === 'string' ? Number(value) : value;
                                        if (value === '' || value === null || value === undefined) {
                                            return 'Stock is required';
                                        }
                                        if (isNaN(numValue) || numValue < 0) {
                                            return 'Stock must be 0 or greater';
                                        }
                                        if (!Number.isInteger(numValue)) {
                                            return 'Stock must be a whole number';
                                        }
                                        return true;
                                    },
                                },
                            }}
                            helperText="Enter the stock quantity (must be a whole number, 0 or greater)"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={handleAddStockClose}>
                        Cancel
                    </Button>
                    <AppButton
                        type="submit"
                        label="Update Stock"
                        disabled={!isValid}
                    />
                </DialogActions>
            </form>
        </Dialog>
        </div>
    );
};

export default InventoryTable; 