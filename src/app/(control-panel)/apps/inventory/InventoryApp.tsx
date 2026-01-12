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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(100);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [params, setParams] = useState<ProductsParams>({
        q: undefined,
        page: 1,
        limit: 100,
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProducts(params);
            setProducts(res.data);
            if (res.pagination) {
                setTotalPages(res.pagination.total_pages);
                setTotalRecords(res.pagination.total_count);
                setPage(res.pagination.current_page);
                setLimit(res.pagination.limit);
            }
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
            if (prev.q === newQ && prev.page === newParams.page && prev.limit === newParams.limit) {
                return prev;
            }
            return { ...prev, ...newParams };
        });
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
        handleParamsChange({ page: newPage });
    }, [handleParamsChange]);

    const handleLimitChange = useCallback((newLimit: number) => {
        setLimit(newLimit);
        setPage(1);
        handleParamsChange({ limit: newLimit, page: 1 });
    }, [handleParamsChange]);

    const handleProductStockUpdate = useCallback((productId: number, totalStock: number) => {
        setProducts(prev => prev.map(product => 
            product.id === productId 
                ? { ...product, currentStock: totalStock }
                : product
        ));
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
                page={page}
                totalPages={totalPages}
                limit={limit}
                totalRecords={totalRecords}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onProductStockUpdate={handleProductStockUpdate}
            />
        </Box>
    );
}

export default InventoryApp; 