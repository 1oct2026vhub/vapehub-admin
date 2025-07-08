'use client'
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { getStockMovements, StockMovement, Pagination as IPagination, StockMovementParams } from '@/services/apiInventory';
import StockMovementsTable from './StockMovementsTable';
import FuseLoading from '@fuse/core/FuseLoading';
import StockAdjustmentForm from './StockAdjustmentForm';

function InventoryDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const variantId = Number(params.id);
    const variantName = searchParams.get('name') || 'Product';

    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [movementsPagination, setMovementsPagination] = useState<IPagination | null>(null);
    const [movementsLoading, setMovementsLoading] = useState(true);
    const [movementParams, setMovementParams] = useState<Omit<StockMovementParams, 'variant_id'>>({
        page: 1,
        limit: 10,
        sort_by: 'created_at',
        sort_order: 'DESC'
    });

    const fetchMovements = useCallback(async () => {
        if (!variantId) return;
        setMovementsLoading(true);
        try {
            const res = await getStockMovements({ ...movementParams, variant_id: variantId });
            setMovements(res.data.movements);
            setMovementsPagination(res.data.pagination);
        } catch (error) {
            console.error('Failed to fetch stock movements', error);
        } finally {
            setMovementsLoading(false);
        }
    }, [variantId, movementParams]);

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    const handleMovementFilterChange = (filters: Partial<Omit<StockMovementParams, 'page' | 'limit' | 'sort_by' | 'sort_order' | 'variant_id'>>) => {
        setMovementParams(prev => ({
            ...prev,
            ...filters,
            page: 1
        }));
    }

    const handleMovementPageChange = (page: number) => {
        setMovementParams(prev => ({
            ...prev,
            page
        }));
    }

    const latestStock = movements.length > 0 ? movements[0].variant.stock : 0;

    const handleSuccess = () => {
        fetchMovements();
    }

    return (
        <Box className="w-full p-4 md:p-12">
            <Typography variant="h5" component="h1" className="mb-4 font-bold">
                Manage Stock for <span className="text-blue-500">{variantName}</span>
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <StockAdjustmentForm
                        variantId={variantId}
                        onSuccess={handleSuccess}
                        currentStock={latestStock}
                    />
                    <Paper sx={{ p: 2, mt: 2, textAlign: 'center', backgroundColor: 'white' }}>
                        <Typography variant="h6" component="h2">
                            Total Stock: <span className="font-bold text-green-600">{latestStock}</span>
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    {movementsLoading && !movementsPagination ? <FuseLoading /> :
                        movementsPagination && (
                        <StockMovementsTable
                            movements={movements}
                            pagination={movementsPagination}
                            filters={{
                                change_type: movementParams.change_type,
                                start_date: movementParams.start_date,
                                end_date: movementParams.end_date
                            }}
                            onFilterChange={handleMovementFilterChange}
                            onPageChange={handleMovementPageChange}
                            loading={movementsLoading}
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}

export default InventoryDetailPage; 