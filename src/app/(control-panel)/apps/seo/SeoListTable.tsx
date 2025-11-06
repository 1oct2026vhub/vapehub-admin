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
  ListItemIcon,
  Box,
  Autocomplete,
  CircularProgress,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { listSeo, SeoListItem, ListSeoParams } from '@/services/apiSeo';
import { listProducts } from '@/services/apiProduct';
import { listProductBrand } from '@/services/apiProductBrand';
import { listProductCategory } from '@/services/apiProductCategory';
import { getBlogPosts, getBlogCategories } from '@/services/apiBlog';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { Circle } from '@mui/icons-material';
import TablePagination from '@/components/Shared/TablePagination';

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
    const [limit, setLimit] = useState(100);
    const [seoData, setSeoData] = useState<SeoListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [entityType, setEntityType] = useState<string>('');
    const [noIndex, setNoIndex] = useState<string>('');
    const [entityId, setEntityId] = useState<string | null>(null);
    const [entities, setEntities] = useState<any[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);
    const [entitySearchKeyword, setEntitySearchKeyword] = useState('');

    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    const areFiltersActive = useMemo(() => {
        return keyword !== '' || entityType !== '' || noIndex !== '' || entityId !== null;
    }, [keyword, entityType, noIndex, entityId]);

    const clearFilters = () => {
        setKeyword('');
        setDebouncedKeyword('');
        setEntityType('');
        setNoIndex('');
        setEntityId(null);
        setPage(1);
        setEntitySearchKeyword('');
    };

    // Handle limit change with proper state batching
    const handleLimitChange = useCallback((newLimit: number) => {
        setPage(1);
        setLimit(newLimit);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    // Fetch entities based on entity type
    const fetchEntities = useCallback(async (type: string, keyword: string = '') => {
        if (!type) {
            setEntities([]);
            return;
        }

        setEntitiesLoading(true);
        try {
            let response;
            const params: any = { 
                limit: 50,
                sort_by: 'id',
                order: 'DESC'
            };

            if (keyword) {
                if (type === 'product') {
                    params.keyword = keyword;
                } else if (type === 'blog_post' || type === 'blog_category') {
                    params.search = keyword;
                } else {
                    params.search = keyword;
                    params.search_only_name = true;
                }
            }

            switch (type) {
                case 'product':
                    response = await listProducts(params);
                    setEntities(response.data?.products || []);
                    break;
                case 'brand':
                    response = await listProductBrand(params);
                    setEntities(response.data?.brands || []);
                    break;
                case 'category':
                    response = await listProductCategory(params);
                    setEntities(response.data?.categories || []);
                    break;
                case 'blog_post':
                    response = await getBlogPosts(params);
                    setEntities(response.data?.blogs || []);
                    break;
                case 'blog_category':
                    response = await getBlogCategories(params);
                    setEntities(response.data?.categories || []);
                    break;
                default:
                    setEntities([]);
            }
        } catch (error) {
            console.error('Error fetching entities:', error);
            setEntities([]);
        } finally {
            setEntitiesLoading(false);
        }
    }, []);

    // Fetch entities when entity type changes
    useEffect(() => {
        fetchEntities(entityType);
        setEntityId(null); // Reset entity ID when entity type changes
        setEntitySearchKeyword('');
    }, [entityType, fetchEntities]);

    // Fetch entities when search keyword changes (debounced)
    useEffect(() => {
        if (!entityType) return;
        
        const timer = setTimeout(() => {
            fetchEntities(entityType, entitySearchKeyword);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [entitySearchKeyword, entityType, fetchEntities]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: ListSeoParams = {
                page,
                limit,
                keyword: debouncedKeyword || undefined,
                entityType: entityType ? (entityType as ListSeoParams['entityType']) : undefined,
                entityId: entityId || undefined,
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
    }, [page, limit, debouncedKeyword, entityType, entityId, noIndex, showSnackbar]);

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
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#2E9970',
                                    borderWidth: '2px',
                                },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#2E9970',
                            },
                            minWidth: 180,
                        }}
                    />
                    <Select
                        value={entityType}
                        onChange={e => setEntityType(e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ minWidth: 140, mx: 1 }}
                    >
                        <MenuItem value="">All Entity Types</MenuItem>
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
                        sx={{ minWidth: 120, mx: 1 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Indexed</MenuItem>
                        <MenuItem value="false">Not Indexed</MenuItem>
                    </Select>
                    {entityType && (
                        <div className="flex items-center">
                            <Autocomplete
                                options={entities}
                                getOptionLabel={(option) => option.name || option.title || ''}
                                value={entities.find((e) => e.id === entityId) || null}
                                onChange={(event, newValue) => {
                                    setEntityId(newValue ? newValue.id : null);
                                }}
                                onInputChange={(event, newInputValue) => {
                                    setEntitySearchKeyword(newInputValue);
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'white',
                                    },
                                    minWidth: 200,
                                }}
                                filterOptions={(x) => x}
                                loading={entitiesLoading}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`Select ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
                                        placeholder={`Search ${entityType}s...`}
                                        size="small"
                                        error={false}
                                        helperText={
                                            entitiesLoading 
                                                ? 'Loading...' 
                                                : entities.length < 0 
                                                    ? `No ${entityType}s available`
                                                    : ""
                                        }
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {entitiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </div>
                    )}
                    {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
                </div>
                <DataTable
                    data={seoData}
                    columns={columns}
                    enableColumnOrdering
                    hideRowSelectionCheckboxes={true}
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
                <TablePagination
                    page={page}
                    totalPages={totalPages}
                    limit={limit}
                    totalRecords={total}
                    onPageChange={setPage}
                    onLimitChange={handleLimitChange}
                />
            </Paper>
        </div>
    );
};

export default SeoListTable; 