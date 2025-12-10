'use client';
import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import {
    getProducts,
    ProductsResponse,
    ProductsParams,
} from '@/services/apiInventory';
import InventoryTable from './InventoryTable';
import FuseLoading from '@fuse/core/FuseLoading';
import PageBreadcrumbs from '@/components/PageBreadcrumb';

function InventoryApp() {
    const [products, setProducts] = useState<ProductsResponse['data']>([]);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState<ProductsParams>({
        q: undefined,
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProducts(params);
            setProducts(res.data);
        } catch (error) {
            console.error('Failed to fetch products data', error);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleParamsChange = useCallback((newParams: Partial<ProductsParams>) => {
        setParams(prev => {
            // Only update if the value actually changed
            const newQ = newParams.q;
            if (prev.q === newQ) {
                return prev;
            }
            return { ...prev, ...newParams };
        });
    }, []);

    if (loading && products.length === 0) {
        return <FuseLoading />;
    }
    
    return (
        <Box className="w-full p-4 md:p-12">
          <PageBreadcrumbs/>
            <InventoryTable
                products={products}
                params={params}
                onParamsChange={handleParamsChange}
                loading={loading}
            />
        </Box>
    );
}

export default InventoryApp; 