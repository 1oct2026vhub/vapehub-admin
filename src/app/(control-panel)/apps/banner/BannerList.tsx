'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getBanners,
  deleteBanner,
  restoreBanner,
  shuffleBannerDisplayOrder,
  type BannerItem,
  type FetchBannersParams,
} from '@/services/apiBanner';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import ReplayIcon from '@mui/icons-material/Replay'; // For Clear Filters
import { debounce } from 'lodash';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Link from 'next/link'; // For Add Banner button navigation
import AppButton from '@/components/Shared/AppButton';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import ConfirmActionDialog from '../faq/ConfirmActionDialog'; // Assuming path to shared/generalized dialog
import DraggableBannerCard from './DraggableBannerCard'; // Import DraggableBannerCard

// Dnd-kit imports
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy, // Or verticalListSortingStrategy / gridLayoutSortingStrategy
} from '@dnd-kit/sortable';
import FuseLoading from '@fuse/core/FuseLoading';

const defaultSortBy: FetchBannersParams['sort_by'] = 'display_order';
const defaultOrder: FetchBannersParams['order'] = 'DESC';
const defaultLimit = 10;
const defaultStatus: FetchBannersParams['status'] = undefined; // Or 'all' if you have such an option
const defaultShowDeleted = false;

const BannerList: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(defaultLimit);
  const [inputValue, setInputValue] = useState<string>(''); // For debounced search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<FetchBannersParams['sort_by']>(defaultSortBy);
  const [order, setOrder] = useState<FetchBannersParams['order']>(defaultOrder);
  const [statusFilter, setStatusFilter] = useState<FetchBannersParams['status']>(defaultStatus);
  const [showDeleted, setShowDeleted] = useState<boolean>(defaultShowDeleted);
  const [totalBanners, setTotalBanners] = useState<number>(0);

  // State for delete confirmation
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState<boolean>(false);
  const [bannerToDelete, setBannerToDelete] = useState<BannerItem | null>(null);

  // State for restore confirmation
  const [isConfirmRestoreDialogOpen, setIsConfirmRestoreDialogOpen] = useState<boolean>(false);
  const [bannerToRestore, setBannerToRestore] = useState<BannerItem | null>(null);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // 5px drag to activate
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isReordering, setIsReordering] = useState<boolean>(false);

  const fetchBannersCallback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FetchBannersParams = {
        page,
        limit,
        sort_by: sortBy,
        order,
        deleted: showDeleted,
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const response = await getBanners(params);
      setBanners(response.results || []);
      setTotalBanners(response.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch banners');
      showSnackbar(err.message || 'Failed to fetch banners', 'error');
      setBanners([]);
      setTotalBanners(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, order, searchTerm, statusFilter, showDeleted, showSnackbar]);

  useEffect(() => {
    fetchBannersCallback();
  }, [fetchBannersCallback]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
        setPage(1);
        setSearchTerm(value);
      }, 500),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleSortByChange = (event: SelectChangeEvent<FetchBannersParams['sort_by']>) => {
    setPage(1);
    setSortBy(event.target.value as FetchBannersParams['sort_by']);
  };

  const handleOrderChange = (event: SelectChangeEvent<FetchBannersParams['order']>) => {
    setPage(1);
    setOrder(event.target.value as FetchBannersParams['order']);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<FetchBannersParams['status']>) => {
    setPage(1);
    setStatusFilter(event.target.value as FetchBannersParams['status']);
  };

  const handleShowDeletedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setShowDeleted(event.target.checked);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: SelectChangeEvent<number>) => {
    setPage(1);
    setLimit(event.target.value as number);
  };
  
  const areFiltersApplied = useMemo(() => {
    return (
      inputValue !== '' ||
      sortBy !== defaultSortBy ||
      order !== defaultOrder ||
      limit !== defaultLimit ||
      statusFilter !== defaultStatus ||
      showDeleted !== defaultShowDeleted ||
      page !== 1
    );
  }, [inputValue, sortBy, order, limit, statusFilter, showDeleted, page]);

  const handleClearFilters = () => {
    setPage(1);
    setInputValue('');
    setSearchTerm('');
    setSortBy(defaultSortBy);
    setOrder(defaultOrder);
    setLimit(defaultLimit);
    setStatusFilter(defaultStatus);
    setShowDeleted(defaultShowDeleted);
    // fetchBannersCallback(); // Optionally directly call fetch if state updates aren't immediate enough
  };

  const totalPages = Math.ceil(totalBanners / limit);

  const handleOpenDeleteDialog = (banner: BannerItem) => {
    setBannerToDelete(banner);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setBannerToDelete(null);
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      await deleteBanner(bannerToDelete.id);
      showSnackbar(`Banner "${bannerToDelete.title}" deleted successfully!`, 'success');
      fetchBannersCallback(); // Refresh the list
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete banner', 'error');
    }
    handleCloseDeleteDialog();
  };

  const handleOpenRestoreDialog = (banner: BannerItem) => {
    setBannerToRestore(banner);
    setIsConfirmRestoreDialogOpen(true);
  };

  const handleCloseRestoreDialog = () => {
    setBannerToRestore(null);
    setIsConfirmRestoreDialogOpen(false);
  };

  const handleConfirmRestore = async () => {
    if (!bannerToRestore) return;
    try {
      await restoreBanner(bannerToRestore.id);
      showSnackbar(`Banner "${bannerToRestore.title}" restored successfully!`, 'success');
      fetchBannersCallback(); // Refresh the list
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to restore banner', 'error');
    }
    handleCloseRestoreDialog();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = banners.findIndex((b) => b.id.toString() === active.id);
    const newIndex = banners.findIndex((b) => b.id.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Update UI optimistically
    const reorderedBanners = arrayMove(banners, oldIndex, newIndex);
    setBanners(reorderedBanners);

    setIsReordering(true);
    try {
      // Ensure new_display_order starts from 1
      await shuffleBannerDisplayOrder(Number(active.id), newIndex + 1);
      showSnackbar('Banner order updated!', 'success');
      if (sortBy === 'display_order') {
        fetchBannersCallback();
      } else {
        showSnackbar('Banners reordered. Sort by "Display Order" to see persistent changes.', 'info');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to update banner order', 'error');
      setBanners(banners);
    } finally {
      setIsReordering(false);
    }
  };

  // Ensure banners are memoized for SortableContext if they are re-created often
  const bannerIds = useMemo(() => banners.map(b => b.id.toString()), [banners]);

  return (
    <Box sx={{ marginTop: 3, position: 'relative' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Banner Management
        </Typography>
        <AppButton
          label="Add Banner"
          component={Link}
          href="/apps/banner/create" // Link to the create page
          startIcon={<AddIcon />}
          variant="contained"
        />
      </Stack>

      {/* Filters Section */}
      <Grid container spacing={2} mb={3} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label="Search Banners"
            placeholder="Search by title, description..."
            value={inputValue}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={handleSortByChange}>
              <MenuItem value="display_order">Display Order</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="id">ID</MenuItem>
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="updatedAt">Updated At</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={3} md={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select value={order} label="Order" onChange={handleOrderChange}>
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter || ''} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value=""><em>All Statuses</em></MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid> */}
        <Grid item xs={6} sm={3} md={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Per Page</InputLabel>
            <Select value={limit} label="Per Page" onChange={handleLimitChange}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={4} md={1.5} container alignItems="center">
          <FormControlLabel
            control={<Switch checked={showDeleted} onChange={handleShowDeletedChange} />}
            label="Deleted"
            sx={{ mr: 0, whiteSpace: 'nowrap' }}
          />
        </Grid>
        {areFiltersApplied && (
          <Grid item xs={12} sm={1} md={0.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <ClearFiltersButton onClick={handleClearFilters} />
          </Grid>
        )}
      </Grid>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '400px' }}>
          <FuseLoading />
          {/* <CircularProgress /> */}
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ p: 5 }}>
          {error}
        </Typography>
      ) : banners.length === 0 ? (
        <Typography align="center" sx={{ p: 5 }}>
          No banners found matching your criteria. Click "Add Banner" to create one.
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={bannerIds} strategy={rectSortingStrategy}>
            <Grid container spacing={3}>
              {banners.map((banner) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={banner.id} sx={{ display: 'flex' }}> {/* Ensure Grid item itself is flex for full height card */}
                  <DraggableBannerCard
                    banner={banner}
                    onDelete={handleOpenDeleteDialog}
                    onRestore={handleOpenRestoreDialog}
                  />
                </Grid>
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      )}

      {totalPages > 1 && !loading && !error && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      {bannerToDelete && (
        <ConfirmActionDialog
          open={isConfirmDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          itemName={bannerToDelete.title}
          actionButtonText="Delete"
          actionButtonColorClass="bg-red-600 hover:bg-red-700"
        />
      )}

      {/* Restore Confirmation Dialog */}
        {bannerToRestore && (
            <ConfirmActionDialog
                open={isConfirmRestoreDialogOpen}
                onClose={handleCloseRestoreDialog}
                onConfirm={handleConfirmRestore}
                title="Confirm Restore"
                itemName={bannerToRestore.title}
                actionButtonText="Restore"
            />
        )}
    </Box>
  );
};

export default BannerList; 