'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCarousels,
  deleteCarousel,
  reorderCarousels,
  shuffleCarousel,
  type FetchCarouselsParams,
} from '@/services/apiCarousel';
import { Carousel } from '@/types/carousel';
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
import ReplayIcon from '@mui/icons-material/Replay';
import { debounce } from 'lodash';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Link from 'next/link';
import AppButton from '@/components/Shared/AppButton';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import ConfirmActionDialog from '../faq/ConfirmActionDialog';
import DraggableCarouselCard from './DraggableCarouselCard';

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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import FuseLoading from '@fuse/core/FuseLoading';

const defaultSortBy: FetchCarouselsParams['sort_by'] = 'display_order';
const defaultOrder: FetchCarouselsParams['order'] = 'ASC';
const defaultLimit = 10;
const defaultStatus: FetchCarouselsParams['status'] = undefined;
const defaultShowDeleted = false;

const CarouselList: React.FC = () => {
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(defaultLimit);
  const [inputValue, setInputValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<FetchCarouselsParams['sort_by']>(defaultSortBy);
  const [order, setOrder] = useState<FetchCarouselsParams['order']>(defaultOrder);
  const [statusFilter, setStatusFilter] = useState<FetchCarouselsParams['status']>(defaultStatus);
  const [showDeleted, setShowDeleted] = useState<boolean>(defaultShowDeleted);
  const [totalCarousels, setTotalCarousels] = useState<number>(0);

  // State for delete confirmation
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState<boolean>(false);
  const [carouselToDelete, setCarouselToDelete] = useState<Carousel | null>(null);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isReordering, setIsReordering] = useState<boolean>(false);

  const fetchCarouselsCallback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: FetchCarouselsParams = {
        page,
        limit,
        sort_by: sortBy,
        order,
        deleted: showDeleted,
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const response = await getCarousels(params);
      setCarousels(response.results || []);
      setTotalCarousels(response.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch carousels');
      showSnackbar(err.message || 'Failed to fetch carousels', 'error');
      setCarousels([]);
      setTotalCarousels(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, order, searchTerm, statusFilter, showDeleted, showSnackbar]);

  useEffect(() => {
    fetchCarouselsCallback();
  }, [fetchCarouselsCallback]);

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

  const handleSortByChange = (event: SelectChangeEvent<FetchCarouselsParams['sort_by']>) => {
    setPage(1);
    setSortBy(event.target.value as FetchCarouselsParams['sort_by']);
  };

  const handleOrderChange = (event: SelectChangeEvent<FetchCarouselsParams['order']>) => {
    setPage(1);
    setOrder(event.target.value as FetchCarouselsParams['order']);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<FetchCarouselsParams['status']>) => {
    setPage(1);
    setStatusFilter(event.target.value as FetchCarouselsParams['status']);
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
  };

  const totalPages = Math.ceil(totalCarousels / limit);

  const handleOpenDeleteDialog = (carousel: Carousel) => {
    setCarouselToDelete(carousel);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setCarouselToDelete(null);
    setIsConfirmDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!carouselToDelete) return;
    try {
      await deleteCarousel(carouselToDelete.id);
      showSnackbar(`Carousel "${carouselToDelete.title}" deleted successfully!`, 'success');
      fetchCarouselsCallback();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to delete carousel', 'error');
    }
    handleCloseDeleteDialog();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = carousels.findIndex((c) => c.id.toString() === active.id);
    const newIndex = carousels.findIndex((c) => c.id.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Update UI optimistically
    const reorderedCarousels = arrayMove(carousels, oldIndex, newIndex);
    setCarousels(reorderedCarousels);

    setIsReordering(true);
    try {
      // Add 1 to newIndex to ensure display order starts from 1
      await shuffleCarousel(Number(active.id), newIndex + 1);
      showSnackbar('Carousel order updated!', 'success');
      if (sortBy === 'display_order') {
        fetchCarouselsCallback();
      } else {
        showSnackbar('Carousels reordered. Sort by "Display Order" to see persistent changes.', 'info');
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to update carousel order', 'error');
      setCarousels(carousels);
    } finally {
      setIsReordering(false);
    }
  };

  const carouselIds = useMemo(() => carousels.map(c => c.id.toString()), [carousels]);

  return (
    <Box sx={{ marginTop: 3, position: 'relative' }}>
      {/* Loading Overlay */}
      {/* {(loading || isReordering) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      )} */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Carousel Management
        </Typography>
        <AppButton
          label="Add Carousel"
          component={Link}
          href="/apps/carousel/create"
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
            label="Search Carousels"
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
        <Grid item xs={6} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter || ''} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value=""><em>All Statuses</em></MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
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
      ) : carousels.length === 0 ? (
        <Typography align="center" sx={{ p: 5 }}>
          No carousels found matching your criteria. Click "Add Carousel" to create one.
        </Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={carouselIds} strategy={rectSortingStrategy}>
            <Grid container spacing={3}>
              {carousels.map((carousel) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={carousel.id} sx={{ display: 'flex' }}>
                  <DraggableCarouselCard
                    carousel={carousel}
                    onDelete={handleOpenDeleteDialog}
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
      {carouselToDelete && (
        <ConfirmActionDialog
          open={isConfirmDeleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          itemName={carouselToDelete.title}
          actionButtonText="Delete"
          actionButtonColorClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </Box>
  );
};

export default CarouselList; 