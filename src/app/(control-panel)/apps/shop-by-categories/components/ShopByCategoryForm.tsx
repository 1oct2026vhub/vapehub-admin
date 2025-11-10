"use client";
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, MenuItem, Stack, CircularProgress } from '@mui/material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  createShopByCategory,
  updateShopByCategory,
  getShopByCategoryDetails,
  listShopByCategory,
  deleteShopByCategoryImage,
  ShopByCategory,
} from '@/services/apiShopByCategory';
import { listProductCategory } from '@/services/apiProductCategory';
import FormTextField from '@/components/Shared/FormTextField';
import FormFileUploadField from '@/components/Shared/FormFileUploadField';
import { validateImageDimensions } from '@/utils/imageUtils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Schema - image validation handled conditionally based on create/edit mode
const schema = z.object({
  category_id: z.number().min(1, 'Category is required'),
  image: z.union([
    z.instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        `Max file size is 5MB.`
      )
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
        'Only .png, .jpg, .jpeg, .webp formats are accepted.'
      )
      .superRefine(async (file, ctx) => {
        if (file.type.startsWith('image/')) {
          const validation = await validateImageDimensions(file, 43, 43);
          if (!validation.valid) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: validation.message || 'Image dimensions must be exactly 43x43 pixels.',
            });
          }
        }
      }),
    z.undefined()
  ]),
  status: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  item?: ShopByCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Category {
  id: number;
  name: string;
}

const ShopByCategoryForm: React.FC<Props> = ({ item, onSuccess, onCancel }) => {
  const isEditMode = !!item?.id;
  const { control, handleSubmit, reset, setValue, watch, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: item?.category_id || undefined,
      image: undefined,
      status: item?.status === true || (typeof item?.status === 'string' && item.status === 'active') ? true : false,
    }
  });
  const { showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingShopByCategories, setExistingShopByCategories] = useState<ShopByCategory[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(item?.image_url);
  const imageValue = watch('image');
  const selectedCategoryId = watch('category_id');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
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
        showSnackbar('Failed to load categories', 'error');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [showSnackbar]);

  // Fetch existing shop by categories to check for duplicates (only in create mode)
  useEffect(() => {
    const fetchExistingShopByCategories = async () => {
      if (!isEditMode) {
        try {
          const response = await listShopByCategory({
            limit: 1000,
            deleted: false,
          });
          if (response?.data?.shopByCategories) {
            setExistingShopByCategories(response.data.shopByCategories);
          }
        } catch (error) {
          console.error('Failed to fetch existing shop by categories:', error);
        }
      }
    };

    fetchExistingShopByCategories();
  }, [isEditMode]);

  // Fetch item details if editing
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (item?.id) {
        try {
          const response = await getShopByCategoryDetails(item.id);
          if (response?.data?.shopByCategory) {
            const category = response.data.shopByCategory;
            setCurrentImageUrl(category.image_url);
            reset({
              category_id: category.category_id || undefined,
              image: undefined, // Don't set image file, use defaultImage prop instead
              status: category.status === true || (typeof category.status === 'string' && category.status === 'active') ? true : false,
            });
          }
        } catch (error) {
          console.error('Failed to fetch shop by category details:', error);
        }
      }
    };

    fetchItemDetails();
  }, [item?.id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!data.category_id) {
      showSnackbar('Category is required', 'error');
      return;
    }

    // Check for duplicate category (only in create mode)
    if (!item?.id) {
      const isDuplicate = existingShopByCategories.some(
        (shopByCat) => shopByCat.category_id === data.category_id
      );
      if (isDuplicate) {
        showSnackbar('This category is already added to Shop By Category', 'error');
        return;
      }
    }

    // For create, image is required
    if (!item?.id && !selectedFile && !imageValue) {
      showSnackbar('Image is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      // For create, use selectedFile or imageValue
      const imageFile = selectedFile || (imageValue instanceof File ? imageValue : null);
      
      if (!item?.id) {
        // Create mode - image is required
        if (!imageFile) {
          showSnackbar('Image is required', 'error');
          setIsSubmitting(false);
          return;
        }

        const payload = {
          category_id: data.category_id,
          image: imageFile,
          ...(data.status !== undefined && { status: data.status }),
        };

        const res = await createShopByCategory(payload);

        if (res?.success === false) {
          const msg = res?.errors?.[0]?.msg || res?.message || 'Validation failed';
          showSnackbar(msg, 'error');
          return;
        }

        showSnackbar('Shop by category created successfully', 'success');
      } else {
        // Update mode - image is optional, but send category_id if it exists
        const payload: any = {
          ...(data.category_id !== undefined && data.category_id !== null && { category_id: data.category_id }),
          ...(imageFile && { image: imageFile }),
          ...(data.status !== undefined && { status: data.status }),
        };

        const res = await updateShopByCategory(item.id, payload);

        if (res?.success === false) {
          const msg = res?.errors?.[0]?.msg || res?.message || 'Validation failed';
          showSnackbar(msg, 'error');
          return;
        }

        showSnackbar('Shop by category updated successfully', 'success');
      }
      
      onSuccess();
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.[0]?.msg ||
        e?.response?.data?.message ||
        e?.message ||
        'Action failed';
      showSnackbar(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!item?.id) return;
    
    try {
      await deleteShopByCategoryImage(item.id);
      setCurrentImageUrl(undefined);
      showSnackbar('Image deleted successfully', 'success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete image';
      showSnackbar(msg, 'error');
      throw error; // Re-throw to let the component handle loading state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <Controller
          name="category_id"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Category"
              select
              fullWidth
              size="small"
              required
              error={
                !!fieldState.error || 
                (!isEditMode && selectedCategoryId && existingShopByCategories.some(
                  (shopByCat) => shopByCat.category_id === selectedCategoryId
                ))
              }
              helperText={
                fieldState.error?.message || 
                (categoriesLoading ? 'Loading categories...' : '') ||
                (!isEditMode && selectedCategoryId && existingShopByCategories.some(
                  (shopByCat) => shopByCat.category_id === selectedCategoryId
                ) ? 'This category is already added to Shop By Category' : '')
              }
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : Number(e.target.value);
                field.onChange(value);
              }}
              InputLabelProps={{ shrink: true }}
              disabled={categoriesLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            >
              {categoriesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Loading categories...
                </MenuItem>
              ) : (
                [
                  <MenuItem key="select-category" value="">
                    Select Category
                  </MenuItem>,
                  ...categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))
                ]
              )}
            </TextField>
          )}
        />

        <FormFileUploadField
          name="image"
          control={control}
          label="Image"
          required={!isEditMode} // Required only for create
          defaultImage={currentImageUrl}
          exactWidth={43}
          exactHeight={43}
          onFileChange={async (file) => {
            setSelectedFile(file);
            if (file) {
              setValue('image', file, { shouldValidate: true });
              // Trigger validation to show dimension errors immediately
              await trigger('image');
            } else {
              setValue('image', undefined, { shouldValidate: false });
              await trigger('image');
            }
          }}
          onDeleteDefaultImage={isEditMode ? handleDeleteImage : undefined}
          helperText="Supported formats: PNG, JPG, JPEG, WebP (max 5MB). Image dimensions must be exactly 43x43 pixels."
        />

        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Status"
              select
              fullWidth
              size="small"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              value={field.value === true ? 'active' : field.value === false ? 'inactive' : ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : e.target.value === 'active';
                field.onChange(value);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                },
              }}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          )}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            type="submit" 
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#005B2F',
              color: 'white',
              '&:hover': {
                backgroundColor: '#004225',
              },
              '&:disabled': {
                backgroundColor: '#cccccc',
                color: '#666666',
              },
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};

export default ShopByCategoryForm;

