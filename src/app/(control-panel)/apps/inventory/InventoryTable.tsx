'use client';
import {
    Paper,
    Chip,
    Avatar,
    Box,
    TextField,
    MenuItem,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    PaginationItem,
    Pagination,
    ListItemIcon
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { InventoryItem, Pagination as IPagination, InventoryParams } from '@/services/apiInventory';
import { useState, useEffect, useMemo } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { useRouter } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
interface InventoryTableProps {
    inventory: InventoryItem[];
    pagination: IPagination;
    loading: boolean;
    params: InventoryParams;
    onParamsChange: (params: Partial<InventoryParams>) => void;
    onPageChange: (page: number) => void;
}
const InventoryTable: React.FC<InventoryTableProps> = ({
    inventory,
    pagination,
    loading,
    params,
    onParamsChange,
    onPageChange,
}) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const router = useRouter();

    const areFiltersActive = useMemo(() => {
        return debouncedSearch !== '' || params.stock_status || params.top_selling;
    }, [debouncedSearch, params.stock_status, params.top_selling]);

    const clearFilters = () => {
        setSearch('');
        onParamsChange({
            search: undefined,
            stock_status: undefined,
            top_selling: false,
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
        onParamsChange({ search: debouncedSearch ? debouncedSearch : undefined, page: 1 });
      }, [debouncedSearch]);
    
    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        onParamsChange({ stock_status: value ? value as InventoryParams['stock_status'] : undefined });
    };

    const handleTopSellingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onParamsChange({ top_selling: event.target.checked });
    };

    const columns = useMemo<MRT_ColumnDef<InventoryItem>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Product Name',
                Cell: ({ row }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={row.original.image || undefined} sx={{ mr: 2 }}>{row.original.name?.charAt(0)}</Avatar>
                        {row.original.name}
                    </Box>
                ),
            },
            { accessorKey: 'currentStock', header: 'Current Stock' },
            { accessorKey: 'lowStockThreshold', header: 'Low Stock Threshold' },
            {
                accessorKey: 'isOutOfStock',
                header: 'Stock Status',
                Cell: ({ row }) =>
                    row.original.isOutOfStock ? (
                        <Chip label="Out of Stock" color="error" size="small" />
                    ) : row.original.isLowStock ? (
                        <Chip label="Low Stock" color="warning" size="small" />
                    ) : (
                        <Chip label="In Stock" color="success" size="small" />
                    )
            },
            { accessorKey: 'salesLast28Days', header: 'Sales (Last 28 days)' },
        ],
        []
      );
    
    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', p:2, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    label="Search by barcode or slug"
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
                    <TextField
                        select
                        label="Stock Status"
                        value={params.stock_status || ''}
                        onChange={handleFilterChange as any}
                        size="small"
                        sx={{ width: '150px' }}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="in_stock">In Stock</MenuItem>
                        <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                        <MenuItem value="low_stock">Low Stock</MenuItem>
                    </TextField>
                    <FormControlLabel
                        control={<Checkbox checked={params.top_selling || false} onChange={handleTopSellingChange} />}
                        label="Top Selling"
                    />
                    {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
                </Box>
            </Box>

            <DataTable
                data={inventory}
                columns={columns}
                state={{ isLoading: loading }}
                renderRowActionMenuItems={({ closeMenu, row }) => [
                    <MenuItem
                      key="view"
                      onClick={() => {
                        router.push(`/apps/inventory/${row.original.id}?name=${encodeURIComponent(row.original.name)}`);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                      </ListItemIcon>
                      View Details
                    </MenuItem>,
                  ]}
            />
            <div className="flex justify-center p-4">
                <Pagination
                    count={pagination.totalPages}
                    page={pagination.page}
                    onChange={(_, newPage) => onPageChange(newPage)}
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
    );
};

export default InventoryTable; 