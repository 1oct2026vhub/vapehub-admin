'use client'
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Box, Typography, Button, Paper } from '@mui/material';
import StockAdjustmentModal from './StockAdjustmentModal';
import { getStockMovements, StockMovement, Pagination as IPagination, StockMovementParams } from '@/services/apiInventory';
import StockMovementsTable from './StockMovementsTable';
import FuseLoading from '@fuse/core/FuseLoading';

type ActionType = 'add' | 'remove' | 'adjust';

function InventoryDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const variantId = Number(params.id);
    const variantName = searchParams.get('name') || 'Product';

    const [modalOpen, setModalOpen] = useState(false);
    const [actionType, setActionType] = useState<ActionType>('add');

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


    const handleOpenModal = (type: ActionType) => {
        setActionType(type);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const latestStock = movements.length > 0 ? movements[0].variant.stock : 0;

    const handleSuccess = () => {
        handleCloseModal();
        fetchMovements();
    }

    return (
        <Box className="w-full p-4 md:p-12">
            <Typography variant="h4" component="h1" className="mb-4 font-bold">
                Manage Stock for <span className="text-blue-500">{variantName}</span>
            </Typography>

            <Paper sx={{ p: 4, display: 'flex', gap: 2, backgroundColor: 'white' }}>
                <Button variant="contained" onClick={() => handleOpenModal('add')}>
                    Add Stock
                </Button>
                <Button variant="contained" color="warning" onClick={() => handleOpenModal('remove')}>
                    Remove Stock
                </Button>
                <Button variant="contained" color="info" onClick={() => handleOpenModal('adjust')}>
                    Adjust Stock
                </Button>
            </Paper>

            <StockAdjustmentModal
                open={modalOpen}
                onClose={handleCloseModal}
                actionType={actionType}
                variantId={variantId}
                onSuccess={handleSuccess}
                currentStock={latestStock}
            />

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
        </Box>
    );
}

export default InventoryDetailPage; 