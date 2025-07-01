'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
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
} from '@mui/material';
import { getReviews, Review, FetchReviewsParams, deleteReview } from '@/services/apiReview';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

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
  const { showSnackbar } = useSnackbar();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchReviewsParams = {
        page,
        limit,
      };
      const res = await getReviews(params);
      setReviews(res.reviews || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    } catch (error) {
        // showSnackbar('Failed to fetch reviews', 'error');
    }
    finally {
      setIsLoading(false);
    }
  }, [page, limit, showSnackbar]);

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

  const columns = useMemo<MRT_ColumnDef<Review>[]>(
    () => [
      { 
        accessorKey: 'user_name', 
        header: 'User name',
        Cell: ({ row }) => row.original.user_name ? `${row.original.user_name}` :  'N/A'
      },
      { 
        accessorKey: 'product_id', 
        header: 'Product',
        Cell: ({ row }) => row.original.product_id ? ` ${row.original.product_id}`: 'N/A'
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
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <DataTable
          data={reviews}
          columns={columns}
          enableColumnOrdering
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
      </Paper>
    </div>
  );
};

export default ReviewTable; 