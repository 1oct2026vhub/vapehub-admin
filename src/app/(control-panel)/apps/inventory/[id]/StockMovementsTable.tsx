'use client';
import { useMemo } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { Paper, Box, TextField, MenuItem, Pagination, PaginationItem, Chip, Typography } from '@mui/material';
import { StockMovement, Pagination as IPagination } from '@/services/apiInventory';
import { formatDate } from '@/utils/actions';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';

interface StockMovementsTableProps {
    movements: StockMovement[];
    pagination: IPagination;
    filters: { change_type?: string; start_date?: string; end_date?: string };
    onFilterChange: (filters: Partial<{ change_type?: string; start_date?: string; end_date?: string }>) => void;
    onPageChange: (page: number) => void;
    loading: boolean;
}

const StockMovementsTable: React.FC<StockMovementsTableProps> = ({
    movements,
    pagination,
    filters,
    onFilterChange,
    onPageChange,
    loading
}) => {

    const areFiltersActive = useMemo(() => {
        return !!filters.change_type || !!filters.start_date || !!filters.end_date;
    }, [filters]);

    const handleClearFilters = () => {
        onFilterChange({ change_type: undefined, start_date: undefined, end_date: undefined });
    }

    const columns = useMemo<MRT_ColumnDef<StockMovement>[]>(
        () => [
            {
                accessorKey: 'created_at',
                header: 'Date',
                Cell: ({ row }) => formatDate(row.original.created_at),
            },
            {
                accessorKey: 'change_type',
                header: 'Action',
                Cell: ({ row }) => {
                    const type = row.original.change_type;
                    let color: "success" | "warning" | "info" = "info";
                    if (type === 'addition') color = 'success';
                    if (type === 'deduction') color = 'warning';
                    return <Chip label={type.charAt(0).toUpperCase() + type.slice(1)} color={color} size="small" />;
                },
            },
            {
                accessorKey: 'quantity',
                header: 'Quantity Changed',
            },
            {
                accessorKey: 'reference',
                header: 'Reference',
            },
            {
                accessorKey: 'updatedByUser.first_name',
                header: 'Updated By',
                Cell: ({ row }) => {
                    const user = row.original.updatedByUser;
                    return user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : `User #${user.id}`;
                },
            }
        ],
        []
    );

    return (
        <Paper sx={{ width: '100%', p: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" className="p-2">Stock Movements</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 2, flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    select
                    label="Action Type"
                    value={filters.change_type || ''}
                    onChange={(e) => onFilterChange({ change_type: e.target.value })}
                    size="small"
                    sx={{ width: '150px' }}
                >
                    <MenuItem value="addition">Addition</MenuItem>
                    <MenuItem value="deduction">Deduction</MenuItem>
                    <MenuItem value="adjustment">Adjustment</MenuItem>
                </TextField>
                <TextField
                    type="date"
                    label="Start Date"
                    value={filters.start_date || ''}
                    onChange={(e) => onFilterChange({ start_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                />
                <TextField
                    type="date"
                    label="End Date"
                    value={filters.end_date || ''}
                    onChange={(e) => onFilterChange({ end_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                />
                {areFiltersActive && <ClearFiltersButton onClick={handleClearFilters} />}
            </Box>

            <DataTable
                data={movements}
                columns={columns}
                state={{ isLoading: loading }}
                enableRowSelection={false}
                enableColumnOrdering={false}
                enableSorting={false}
                enableRowActions={false}
                enableColumnActions={false}
                enableColumnDragging={false}
                enableDensityToggle={false}
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

export default StockMovementsTable; 