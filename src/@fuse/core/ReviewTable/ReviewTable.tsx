'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/data-table/DataTable';
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_Updater,
} from 'material-react-table';
import { formatDate } from "@/utils/actions";
import FuseLoading from '@fuse/core/FuseLoading';
import {
  Paper,
  Pagination,
  PaginationItem,
  Switch,
  Box,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  MenuItem,
  ListItemIcon,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { getReviews, Review, FetchReviewsParams, deleteReview } from '@/services/apiReview';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useDebounce } from '@/hooks/useDebounce';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';

interface ReviewTableProps {
  onEditClick?: (review: Review) => void;
}

const ReviewTable: React.FC<ReviewTableProps> = ({ onEditClick }) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const { showSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const debouncedSearch = useDebounce(search, 500);

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortBy, desc: sortOrder === 'DESC' }],
    [sortBy, sortOrder]
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortBy(id);
      setSortOrder(desc ? 'DESC' : 'ASC');
    } else {
      setSortBy('created_at');
      setSortOrder('DESC');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setRating('all');
    setSortBy('created_at');
    setSortOrder('DESC');
    setRowSelection({}); // Clear row selection when filters are cleared
  };

  const isFilterApplied = search !== '' || rating !== 'all' || sortBy !== 'created_at' || sortOrder !== 'DESC';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchReviewsParams = {
        page,
        limit,
        search: debouncedSearch,
        rating,
        sortBy,
        sortOrder,
      };
      const res = await getReviews(params);
      console.log("reviews", res);
      setReviews(res.reviews || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    } catch (error) {
        // showSnackbar('Failed to fetch reviews', 'error');
    }
    finally {
      setIsLoading(false);
    }
  }, [page, limit, showSnackbar, debouncedSearch, rating, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / limit);

  // Delete handlers
  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDialog(false);
    if (!selectedReview) return;
    
    try {
      await deleteReview(selectedReview.id);
      showSnackbar('Review deleted successfully!', 'success');
      fetchData(); // Refresh the data
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to delete review', 'error');
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
    const selectedReviewsToDelete = reviews.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    if (selectedReviewsToDelete.length === 0) {
      showSnackbar(
        "No reviews selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = selectedReviewsToDelete.map((review) => review.id);

    try {
      setIsLoading(true);
      // Delete all selected reviews in parallel
      await Promise.all(idsToDelete.map((id) => deleteReview(id)));

      showSnackbar(
        `${idsToDelete.length} review(s) deleted successfully!`,
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

  const columns = useMemo<MRT_ColumnDef<Review>[]>(
    () => [
      { 
        accessorKey: 'user_name', 
        header: 'User name',
        Cell: ({ row }) => row.original.user_name ? `${row.original.user_name}` :  'N/A'
      },
      { 
        accessorKey: 'product_name', 
        header: 'Product Name',
        Cell: ({ row }) => row.original.product?.name ? ` ${row.original.product.name}`: 'N/A'
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        Cell: ({ row }) => row.original.rating ? `${row.original.rating}`: 'N/A'
        // <Rating value={row.original.rating} readOnly />,
      },
      { 
        accessorKey: 'comment', 
        header: 'Comment',
        Cell: ({ row }) => (
            <Box sx={{ maxWidth: 300, whiteSpace: 'normal' }}>
                {row.original.comment}
            </Box>
        )
      },
      // {
      //   accessorKey: 'is_visible',
      //   header: 'Visible',
      //   Cell: ({ row }) => <Switch checked={row.original.is_visible} disabled />,
      // },
      {
        accessorKey: "created_at",
        header: "Date",
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
    ],
    []
  );

  if (isLoading) return <FuseLoading />;

  return (
    <div>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden p-4" elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            label="Search by user or product"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            sx={{ minWidth: '240px' }}
          />
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel>Rating</InputLabel>
            <Select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              label="Rating"
            >
              <MenuItem value="all"><em>All Ratings</em></MenuItem>
              <MenuItem value="5">5 Stars</MenuItem>
              <MenuItem value="4">4 Stars</MenuItem>
              <MenuItem value="3">3 Stars</MenuItem>
              <MenuItem value="2">2 Stars</MenuItem>
              <MenuItem value="1">1 Star</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="created_at">Date</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="user_name">User Name</MenuItem>
              <MenuItem value="comment">Comment</MenuItem>
              <MenuItem value="testimonial">Testimonial</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              label="Order"
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </FormControl>

          {/* Bulk Delete Button */}
          {Object.keys(rowSelection).length > 0 && (
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

          {isFilterApplied && (
            <ClearFiltersButton onClick={handleClearFilters} />
          )}
        </Box>
        <DataTable
          data={reviews}
          columns={columns}
          manualSorting
          onSortingChange={handleSortingChange}
          enableRowSelection={true}
          onRowSelectionChange={setRowSelection}
          state={{ sorting, rowSelection }}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [];
            
            if (onEditClick) {
              menuItems.push(
                <MenuItem key="edit" onClick={() => { onEditClick(row.original); closeMenu(); }}>
                  <ListItemIcon>
                    <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                  </ListItemIcon>
                  Edit
                </MenuItem>
              );
            }
            
            menuItems.push(
              <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                </ListItemIcon>
                Delete
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
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                className="text-gray-600 hover:text-[#2E9970]"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#2E9970',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#247C5C',
                    },
                  },
                }}
              />
            )}
          />
        </div>
        
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this review from <strong>{selectedReview?.company_name || `User ID: ${selectedReview?.user_id}`}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button color="error" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog
          open={isBulkDeleteDialogOpen}
          onClose={handleCloseBulkDeleteDialog}
        >
          <DialogTitle>Bulk Delete Reviews</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              review(s)? This action cannot be undone.
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
      </Paper>
    </div>
  );
};

export default ReviewTable; 