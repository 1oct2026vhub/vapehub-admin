'use client';
import { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import {
    getInventoryDashboard,
    InventoryDashboardResponse,
    InventoryParams,
} from '@/services/apiInventory';
import InventoryHeader from './InventoryHeader';
import InventoryTable from './InventoryTable';
import FuseLoading from '@fuse/core/FuseLoading';

function InventoryApp() {
    const [data, setData] = useState<InventoryDashboardResponse['data'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState<InventoryParams>({
        page: 1,
        limit: 10,
        sort_by: 'created_at',
        sort_order: 'DESC',
    });

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getInventoryDashboard(params);
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch inventory data', error);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleParamsChange = (newParams: Partial<InventoryParams>) => {
        setParams(prev => {
            const updatedParams: InventoryParams = { ...prev, ...newParams, page: 1 };
            if (newParams.sort_by) {
                if (prev.sort_by === newParams.sort_by && prev.sort_order === 'ASC') {
                    updatedParams.sort_order = 'DESC';
                } else {
                    updatedParams.sort_order = 'ASC';
                }
            }
            return updatedParams;
        });
    };
    
    const handlePageChange = (page: number) => {
        setParams(prev => ({ ...prev, page }));
    };

    if (loading && !data) {
        return <FuseLoading />;
    }
    
    return (
        <Box className="w-full p-4 md:p-12">
            <Typography variant="h4" component="h1" className="mb-4 font-bold">
                Inventory Management
            </Typography>

            {data?.summary && <InventoryHeader summary={data.summary} onRefresh={fetchInventory} />}
            
            {data && (
                 <InventoryTable
                    inventory={data.inventory}
                    pagination={data.pagination}
                    params={params}
                    onParamsChange={handleParamsChange}
                    onPageChange={handlePageChange}
                    loading={loading}
                 />
            )}
        </Box>
    );
}

export default InventoryApp; 