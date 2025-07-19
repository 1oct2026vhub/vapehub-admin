'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import { formatDate } from "@/utils/actions";
import FuseLoading from '@fuse/core/FuseLoading';
import {
  Paper,
  TextField,
  Typography,
  InputAdornment,
  MenuItem,
  Select,
  Pagination,
  ListItemIcon,
  Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { listSeo, SeoListItem, ListSeoParams } from '@/services/apiSeo';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { Circle } from '@mui/icons-material';

const getEditUrl = (item: SeoListItem): string | null => {
    switch (item.entityType) {
        case 'product':
            return `/apps/product/${item.entityId}`;
        case 'category':
            return `/apps/product-category/category-update/${item.entityId}`;
        case 'brand':
            return `/apps/product-brand/brand-update/${item.entityId}`;
        case 'blog_post':
            return `/apps/blog/posts/${item.entityId}/edit`;
        case 'blog_category':
            return `/apps/blog/categories/${item.entityId}/edit`;
        default:
            return null;
    }
};

const SeoListTable: React.FC<{ refreshTrigger: number, onEdit: (data: SeoListItem) => void }> = ({ refreshTrigger, onEdit }) => {
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [seoData, setSeoData] = useState<SeoListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [entityType, setEntityType] = useState<string>('');
    const [noIndex, setNoIndex] = useState<string>('');

    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    const areFiltersActive = useMemo(() => {
        return keyword !== '' || entityType !== '' || noIndex !== '';
    }, [keyword, entityType, noIndex]);

    const clearFilters = () => {
        setKeyword('');
        setDebouncedKeyword('');
        setEntityType('');
        setNoIndex('');
        setPage(1);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: ListSeoParams = {
                page,
                limit,
                keyword: debouncedKeyword || undefined,
                entityType: entityType ? (entityType as ListSeoParams['entityType']) : undefined,
                noIndex: noIndex ? noIndex === 'true' : undefined,
            };
            const res = await listSeo(params);
            setSeoData(res.data?.data || []);
            setTotal(res.data?.pagination?.total || 0);
        } catch (error) {
            // showSnackbar('Failed to fetch SEO data', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedKeyword, entityType, noIndex, showSnackbar]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const totalPages = Math.ceil(total / limit);

    const columns = useMemo<MRT_ColumnDef<SeoListItem>[]>(() => [
        { accessorKey: 'title', header: 'Title' },
        { accessorKey: 'entityType', header: 'Entity Type', Cell: ({ row }) => <span style={{ textTransform: 'capitalize' }}>{row.original.entityType.replace('_', ' ')}</span> },
        { accessorKey: 'entityName', header: 'Entity Name' },
        {
            accessorKey: 'health.score',
            header: 'Health Score',
            Cell: ({ row }) => (
                <Box display="flex" alignItems="center">
                    <Circle sx={{
                        color: row.original.health.status === 'green' ? 'green' : row.original.health.status === 'orange' ? 'orange' : 'red',
                        width: 12, height: 12, mr: 1
                    }} />
                    <Typography>{row.original.health.score}%</Typography>
                </Box>
            )
        },
        { accessorKey: 'slug', header: 'Slug' },
        {
            accessorKey: 'noIndex',
            header: 'No Index',
            Cell: ({ row }) => (row.original.noIndex ? 'Yes' : 'No'),
        },
        {
            accessorKey: "updatedAt",
            header: "Last Updated",
            Cell: ({ row }) => formatDate(row.original.updatedAt),
        },
    ], []);

    if (isLoading) return <FuseLoading />;

    return (
        <div>
            <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
                <div className="flex items-center p-3 flex-wrap gap-2">
                    <TextField
                        label="Search"
                        variant="outlined"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        size="small"
                        InputProps={{ endAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    />
                    <Select
                        value={entityType}
                        onChange={e => setEntityType(e.target.value)}
                        displayEmpty
                        size="small"
                    >
                        <MenuItem value="">All Entity Types</MenuItem>
                        <MenuItem value="page">Page</MenuItem>
                        <MenuItem value="product">Product</MenuItem>
                        <MenuItem value="category">Category</MenuItem>
                        <MenuItem value="brand">Brand</MenuItem>
                        <MenuItem value="blog_post">Blog Post</MenuItem>
                        <MenuItem value="blog_category">Blog Category</MenuItem>
                    </Select>
                    <Select
                        value={noIndex}
                        onChange={e => setNoIndex(e.target.value)}
                        displayEmpty
                        size="small"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Indexed</MenuItem>
                        <MenuItem value="false">Not Indexed</MenuItem>
                    </Select>
                    {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
                </div>
                <DataTable
                    data={seoData}
                    columns={columns}
                    enableColumnOrdering
                    renderRowActionMenuItems={({ closeMenu, row }) => {
                        const editUrl = getEditUrl(row.original);
                        const menuItems = [];

                        // if (editUrl) {
                        //     menuItems.push(
                        //         <MenuItem key="edit-redirect" onClick={() => { router.push(editUrl); closeMenu(); }}>
                        //             <ListItemIcon>
                        //                 <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                        //             </ListItemIcon>
                        //             Edit in Page
                        //         </MenuItem>
                        //     );
                        // }
                        
                        menuItems.push(
                            <MenuItem key="edit-modal" onClick={() => { onEdit(row.original); closeMenu(); }}>
                                <ListItemIcon>
                                    <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                                </ListItemIcon>
                                Edit
                            </MenuItem>
                        );

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
            </Paper>
        </div>
    );
};

export default SeoListTable; 