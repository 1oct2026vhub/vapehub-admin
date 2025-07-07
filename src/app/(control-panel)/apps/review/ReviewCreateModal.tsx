'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createReview, updateReview, CreateReviewData, Review } from '@/services/apiReview';
import { getProduct, listProducts } from '@/services/apiProduct';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { useDebounce } from '@/hooks/useDebounce';

const reviewSchema = z.object({
  product_id: z.number().min(1, 'Product Id is required'),
  user_name: z.string().min(1, 'User name is required').max(100, 'User name must be less than 100 characters'),
  company_name: z.string().max(150, 'Company name must be less than 150 characters').optional(),
  rating: z.string().min(1, 'Rating is required'),
  comment: z.string().min(1, 'Comment is required').min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be less than 1000 characters'),
  is_visible: z.boolean().default(true),
}).refine((data) => {
  const num = parseInt(data.rating);
  return !isNaN(num) && num >= 1 && num <= 5;
}, {
  message: 'Rating must be between 1 and 5',
  path: ['rating'],
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface Product {
  id: number;
  name: string;
  slug: string;
}

interface ReviewCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Review | null;
}

const ReviewCreateModal: React.FC<ReviewCreateModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const debouncedSearch = useDebounce(search, 500);
  const { showSnackbar } = useSnackbar();
  const isEditMode = !!initialData;

  const { control, handleSubmit, reset, watch, setValue, formState, trigger } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    mode: 'all',
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        reset({
          product_id: initialData.product_id || 1,
          user_name: initialData.user_name || '',
          company_name: initialData.company_name,
          rating: initialData.rating.toString(),
          comment: initialData.comment,
          is_visible: initialData.is_visible,
        });

        if (initialData.product_id) {
          getProduct(initialData.product_id)
            .then((productData) => {
              if (productData && productData.data) {
                setEditedProduct(productData.data);
              }
            })
            .catch(() => {
              showSnackbar('Failed to fetch product details for editing.', 'error');
            });
        }
      } else {
        reset({
          product_id: 1,
          user_name: '',
          company_name: '',
          rating: '',
          comment: '',
          is_visible: true,
        });
        setEditedProduct(null);
      }
    }
  }, [open, isEditMode, initialData, reset, showSnackbar]);

  useEffect(() => {
    setValue('product_id', 1, { shouldValidate: true });
  }, [setValue]);

  // Fetch products with search functionality
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open, debouncedSearch]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (debouncedSearch) {
        params.keyword = debouncedSearch;
      }
      const response = await listProducts(params);
      setProducts(response.data?.products || []);
    } catch (error) {
    } finally {
      setProductsLoading(false);
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    try {
      const reviewData: CreateReviewData = {
        product_id: data.product_id,
        user_name: data.user_name,
        company_name: data.company_name,
        rating: parseInt(data.rating),
        comment: data.comment,
        is_visible: data.is_visible,
      };
      
      if (isEditMode && initialData) {
        await updateReview(initialData.id, reviewData);
        showSnackbar('Review updated successfully!', 'success');
      } else {
        await createReview(reviewData);
        showSnackbar('Review created successfully!', 'success');
      }
      
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      showSnackbar(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} review`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSearch('');
    setProducts([]);
    setEditedProduct(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'white',
        },
      }}
    >
      <DialogTitle>{isEditMode ? 'Edit Review' : 'Create New Review'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Product Selection */}
            <Controller
              name="product_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  disabled={isEditMode}
                  options={
                    editedProduct && !products.some((p) => p.id === editedProduct.id)
                      ? [editedProduct, ...products]
                      : products
                  }
                  getOptionLabel={(option) => option.name}
                  loading={productsLoading}
                  value={products.find((p) => p.id === field.value) || editedProduct}
                  onChange={async (_, newValue) => {
                    field.onChange(newValue?.id || 0);
                    await trigger('product_id');
                  }}
                  onInputChange={(event, newInputValue) => {
                    setSearch(newInputValue);
                  }}
                  filterOptions={(x) => x}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Product"
                      error={!!formState.errors.product_id}
                      helperText={formState.errors.product_id?.message}
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {productsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />

            {/* User Name */}
            <FormTextField name="user_name" control={control} label="User Name" required fullWidth />

            {/* Company Name */}
            <FormTextField 
              name="company_name" 
              control={control} 
              label="Company Name" 
              // required 
              fullWidth 
            />

            {/* Rating */}
            <FormTextField 
              name="rating" 
              control={control} 
              label="Rating" 
              required 
              fullWidth 
              type="number"
              inputProps={{ min: 1, max: 5 }}
            />

            {/* Comment */}
            <FormTextField 
              name="comment" 
              control={control} 
              label="Comment" 
              required 
              fullWidth 
              multiline 
              rows={4} 
            />

            {/* Visibility Toggle */}
            <Controller
              name="is_visible"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  }
                  label="Visible to public"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <AppButton
            label="Cancel"
            variant="outlined"
            onClick={handleClose}
            disabled={isSubmitting}
            disableGradient
          />
          <AppButton
            label={isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Review' : 'Create Review')}
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReviewCreateModal; 