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
    Menu
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Product, ProductsParams, getProductVariants, ProductVariant } from '@/services/apiInventory';
import { useState, useEffect, useMemo, useRef } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { useRouter } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { MenuItem } from '@mui/material';
import GenerateReportButton from './components/GenerateReportButton';
import TablePagination from '@/components/Shared/TablePagination';
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
                                <TableCell>Image</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell>Barcode</TableCell>
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
                                    <TableCell>
                                        {variant.image ? (
                                            <Avatar src={variant.image} sx={{ width: 40, height: 40 }} />
                                        ) : (
                                            <Avatar sx={{ width: 40, height: 40 }}>N/A</Avatar>
                                        )}
                                    </TableCell>
                                    <TableCell>{variant.sku || 'N/A'}</TableCell>
                                    <TableCell>{variant.barcode || 'N/A'}</TableCell>
                                    <TableCell align="center">
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
        </div>
    );
};

export default InventoryTable; 