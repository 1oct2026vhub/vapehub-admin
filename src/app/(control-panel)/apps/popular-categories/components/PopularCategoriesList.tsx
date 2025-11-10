"use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { formatDate } from "@/utils/actions";
import FuseLoading from '@fuse/core/FuseLoading';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  InputAdornment,
  MenuItem,
  Select,
  Grid,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  IconButton,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import {
  listPopularCategory,
  deletePopularCategory,
  restorePopularCategory,
  bulkDeletePopularCategory,
  bulkRestorePopularCategory,
  updatePopularCategory,
  updatePopularCategoryOrder,
  PopularCategory,
  FetchPopularCategoryParams,
} from '@/services/apiPopularCategory';
import { listProductCategory } from '@/services/apiProductCategory';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from '@/contexts/SnackbarContext';
import TablePagination from '@/components/Shared/TablePagination';
import PopularCategoryForm from './PopularCategoryForm';

interface PopularCategoriesListProps {
  refreshTrigger?: number;
  openCreate?: boolean;
  onCreateClosed?: () => void;
}

const PopularCategoriesList: React.FC<PopularCategoriesListProps> = ({ refreshTrigger = 0, openCreate, onCreateClosed }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleted, setDeleted] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PopularCategory | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'description' | 'status' | 'order' | 'createdAt' | 'updatedAt'>('order');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<PopularCategory | null>(null);

  useEffect(() => {
    if (openCreate !== undefined) {
      setIsCreateOpen(openCreate);
    }
  }, [openCreate]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch categories for select box
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await listProductCategory({
          limit: 1000,
          deleted: false,
        });
        if (response?.data?.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const areFiltersActive = useMemo(() => {
    return search !== '' || deleted || sortBy !== 'order' || sortOrder !== 'ASC';
  }, [search, deleted, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDeleted(false);
    setSortBy('order');
    setSortOrder('ASC');
    setPage(1);
    setRowSelection({});
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchPopularCategoryParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
        deleted: deleted ?? undefined,
      };
      const res = await listPopularCategory(params);
      setPopularCategories(res.data?.popularCategories || []);
      setTotal(res.data?.pagination?.totalItems || 0);
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to fetch popular categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, sortBy, sortOrder, deleted, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const totalPages = Math.ceil(total / limit);

  const handleDeleteClick = (category: PopularCategory) => {
    setSelectedCategory(category);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedCategory) return;
    try {
      if (selectedCategory.deletedAt) {
        await restorePopularCategory(selectedCategory.id);
        showSnackbar('Popular category restored successfully!', 'success');
      } else {
        await deletePopularCategory(selectedCategory.id);
        showSnackbar('Popular category deleted successfully!', 'success');
      }
      fetchData();
      setSelectedCategory(null);
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    }
  };

  // Bulk delete handlers
  const handleOpenBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const handleCloseBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(false);
  };

  const handleConfirmBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedCategoriesToDelete = popularCategories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted items for bulk delete
    const activeCategoriesToDelete = selectedCategoriesToDelete.filter(
      (category) => !category.deletedAt
    );

    if (activeCategoriesToDelete.length === 0) {
      showSnackbar(
        "No active popular categories selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeCategoriesToDelete.map((category) => category.id);

    try {
      setIsLoading(true);
      // Use bulk delete API
      await bulkDeletePopularCategory(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} popular categor${idsToDelete.length > 1 ? 'ies' : 'y'} deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkDeleteDialog();
    }
  };

  // Bulk restore handlers
  const handleOpenBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(true);
  };

  const handleCloseBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(false);
  };

  const handleConfirmBulkRestore = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedCategoriesToRestore = popularCategories.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter for deleted items only for bulk restore
    const deletedCategoriesToRestore = selectedCategoriesToRestore.filter(
      (category) => category.deletedAt
    );

    if (deletedCategoriesToRestore.length === 0) {
      showSnackbar(
        "No deleted popular categories selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedCategoriesToRestore.map((category) => category.id);

    try {
      setIsLoading(true);
      // Use bulk restore API
      await bulkRestorePopularCategory(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} popular categor${idsToRestore.length > 1 ? 'ies' : 'y'} restored successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkRestoreDialog();
    }
  };

  // Handle limit change with proper state batching
  const handleLimitChange = useCallback((newLimit: number) => {
    setPage(1);
    setLimit(newLimit);
  }, []);

  // Handle checkbox selection
  const handleCardSelection = (index: number, checked: boolean) => {
    setRowSelection((prev) => ({
      ...prev,
      [index]: checked,
    }));
  };

  // Get status display
  const getStatusDisplay = (status: any) => {
    if (status === undefined || status === null) {
      return { text: '-', color: 'default' as const };
    }
    if (typeof status === 'boolean') {
      return status ? { text: 'Active', color: 'success' as const } : { text: 'Inactive', color: 'default' as const };
    }
    if (typeof status === 'string') {
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      return statusText === 'Active' 
        ? { text: statusText, color: 'success' as const }
        : { text: statusText, color: 'default' as const };
    }
    return { text: '-', color: 'default' as const };
  };

  // Get category name by ID
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || `Category #${categoryId}`;
  };

  // Handle category change
  const handleCategoryChange = async (categoryId: number, newCategoryId: number | undefined) => {
    try {
      const category = popularCategories.find(c => c.id === categoryId);
      if (!category) return;

      await updatePopularCategory(categoryId, {
        title: category.title,
        description: category.description,
        status: typeof category.status === 'boolean' ? category.status : undefined,
        order: category.order,
        category_id: newCategoryId,
      });
      
      showSnackbar('Category updated successfully', 'success');
      fetchData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to update category', 'error');
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = popularCategories.findIndex((item) => item.id.toString() === active.id);
    const newIndex = popularCategories.findIndex((item) => item.id.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Save original state for potential revert
    const originalItems = [...popularCategories];
    
    const newItems = arrayMove(popularCategories, oldIndex, newIndex);
    
    // Update order for each item
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    // Update local state immediately
    setPopularCategories(updatedItems);

    // Call API to update order
    updatePopularCategoryOrderAPI(updatedItems, originalItems, oldIndex, newIndex);
  };

  // API call to update popular category order
  const updatePopularCategoryOrderAPI = async (
    updatedItems: PopularCategory[],
    originalItems: PopularCategory[],
    oldIndex: number,
    newIndex: number
  ) => {
    // Prevent multiple simultaneous API calls
    if (isUpdatingOrder) {
      console.log("Order update already in progress, skipping...");
      return;
    }

    try {
      setIsUpdatingOrder(true);
      
      // Get the moved item
      const movedItem = updatedItems[newIndex];
      
      // Call API to update the order
      await updatePopularCategoryOrder(movedItem.id, newIndex + 1);
      
      showSnackbar("Popular category order updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating popular category order:", error);
      
      // Revert to original order on error
      setPopularCategories(originalItems);
      
      if (error?.response?.status === 503) {
        showSnackbar("Service temporarily unavailable. Please try again.", "warning");
      } else if (error?.response?.status === 404) {
        showSnackbar("Update order endpoint not found.", "warning");
      } else if (error?.response?.status === 500) {
        showSnackbar("Server error. Please try again.", "error");
      } else {
        showSnackbar("Failed to update popular category order.", "error");
      }
      
      // Refresh data to get correct order from server
      setTimeout(() => {
        fetchData();
      }, 1000);
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Draggable Card Component
  const DraggableCategoryCard = ({ category, index }: { category: PopularCategory; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: category.id.toString() });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const statusDisplay = getStatusDisplay(category.status);
    const isSelected = rowSelection[index] || false;

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
        <Card
          ref={setNodeRef}
          style={style}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: isSelected ? '2px solid #2E9970' : '1px solid #e0e0e0',
            position: 'relative',
            opacity: category.deletedAt ? 0.7 : 1,
          }}
          {...attributes}
        >
          <CardContent sx={{ flexGrow: 1, pt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                <IconButton
                  size="small"
                  sx={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  {...listeners}
                >
                  <DragIndicatorIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {category.title}
                </Typography>
              </Box>
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCardSelection(index, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                size="small"
              />
            </Box>
            {category.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {category.description}
              </Typography>
            )}
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Category Name:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {getCategoryName(category.category_id) || '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Order:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {category.order ?? '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={statusDisplay.text}
                  color={statusDisplay.color}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Updated:
                </Typography>
                <Typography variant="caption">
                  {formatDate(category.updatedAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
            {!category.deletedAt && (
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditItem(category);
                  setIsCreateOpen(true);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              size="small"
              color={category.deletedAt ? 'success' : 'error'}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(category);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title={category.deletedAt ? 'Restore' : 'Delete'}
            >
              {category.deletedAt ? (
                <RestoreFromTrashIcon fontSize="small" />
              ) : (
                <DeleteIcon fontSize="small" />
              )}
            </IconButton>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  if (isLoading && popularCategories.length === 0) return <FuseLoading />;

  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <div className="flex items-center p-3 flex-wrap gap-2">
          <TextField
            label="Search"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 180 }}
          />
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            displayEmpty
            size="small"
            sx={{ minWidth: 140, mx: 1 }}
          >
            <MenuItem value="order">Order</MenuItem>
            <MenuItem value="id">ID</MenuItem>
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="description">Description</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="createdAt">Created At</MenuItem>
            <MenuItem value="updatedAt">Updated At</MenuItem>
          </Select>
          <Select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'ASC' | 'DESC')}
            size="small"
            sx={{ minWidth: 100, mx: 1 }}
          >
            <MenuItem value="ASC">ASC</MenuItem>
            <MenuItem value="DESC">DESC</MenuItem>
          </Select>
          <Select
            value={deleted ? 'true' : 'false'}
            onChange={e => setDeleted(e.target.value === 'true')}
            size="small"
            sx={{ minWidth: 140, mx: 1 }}
          >
            <MenuItem value="false">Active</MenuItem>
            <MenuItem value="true">Deleted</MenuItem>
          </Select>

          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && !deleted && (
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>}
              onClick={handleOpenBulkDeleteDialog}
              sx={{
                backgroundColor: "#d32f2f",
                "&:hover": {
                  backgroundColor: "#b71c1c",
                },
              }}
            >
              Bulk Delete ({Object.keys(rowSelection).length})
            </Button>
          )}

          {/* Bulk Restore Button */}
          {Object.keys(rowSelection).length > 0 && deleted && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>}
              onClick={handleOpenBulkRestoreDialog}
              sx={{
                backgroundColor: "#2e7d32",
                "&:hover": {
                  backgroundColor: "#1b5e20",
                },
              }}
            >
              Bulk Restore ({Object.keys(rowSelection).length})
            </Button>
          )}

          {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
        </div>

        {/* Cards Grid */}
        {isLoading && popularCategories.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '400px' }}>
            <FuseLoading />
          </Box>
        ) : popularCategories.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '400px' }}>
            <Typography variant="body1" color="text.secondary">
              No popular categories found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3, position: 'relative' }}>
            {isUpdatingOrder && (
              <Box
                      sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Updating order...
                            </Typography>
                          </Box>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={popularCategories.map(item => item.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <Grid container spacing={3}>
                  {popularCategories.map((category, index) => (
                    <DraggableCategoryCard
                      key={category.id}
                      category={category}
                      index={index}
                    />
                  ))}
                  </Grid>
              </SortableContext>
            </DndContext>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <TablePagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              totalRecords={total}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
            />
          </Box>
        )}
        {/* Delete/Restore Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm {selectedCategory?.deletedAt ? 'Restore' : 'Delete'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to {selectedCategory?.deletedAt ? 'restore' : 'delete'} <strong>{selectedCategory?.title}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              {selectedCategory?.deletedAt ? 'Restore' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen} onClose={() => { setIsCreateOpen(false); setEditItem(null); onCreateClosed?.(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: 'white' } }}>
          <DialogTitle>{editItem ? 'Edit Popular Category' : 'Create Popular Category'}</DialogTitle>
          <DialogContent dividers>
            <PopularCategoryForm
              item={editItem}
              onSuccess={() => {
                setIsCreateOpen(false);
                setEditItem(null);
                onCreateClosed?.();
                fetchData();
              }}
              onCancel={() => { setIsCreateOpen(false); setEditItem(null); onCreateClosed?.(); }}
            />
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onClose={handleCloseBulkDeleteDialog}>
          <DialogTitle>Bulk Delete Popular Categories</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              popular categor{Object.keys(rowSelection).length > 1 ? 'ies' : 'y'}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkDelete}
              color="error"
              variant="contained"
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Restore Dialog */}
        <Dialog open={isBulkRestoreDialogOpen} onClose={handleCloseBulkRestoreDialog}>
          <DialogTitle>Bulk Restore Popular Categories</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              popular categor{Object.keys(rowSelection).length > 1 ? 'ies' : 'y'}?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkRestoreDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkRestore}
              color="success"
              variant="contained"
              disabled={isLoading}
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </div>
  );
};

export default PopularCategoriesList;

