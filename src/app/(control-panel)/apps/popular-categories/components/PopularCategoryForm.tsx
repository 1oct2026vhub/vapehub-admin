"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, MenuItem, Stack, CircularProgress } from '@mui/material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  createPopularCategory,
  updatePopularCategory,
  PopularCategory,
} from '@/services/apiPopularCategory';
import { listProductCategory } from '@/services/apiProductCategory';
import FormTextField from '@/components/Shared/FormTextField';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(200, 'Description must be 200 characters or less').optional(),
  status: z.string().optional(),
  order: z.number().min(0, 'Order must be a positive number').optional(),
  category_id: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  item?: PopularCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Category {
  id: number;
  name: string;
}

const PopularCategoryForm: React.FC<Props> = ({ item, onSuccess, onCancel }) => {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title || '',
      description: item?.description || '',
      status: item?.status || '',
      order: item?.order || undefined,
      category_id: item?.category_id || undefined,
    }
  });
  const { showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

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

  useEffect(() => {
    if (item) {
      // Convert boolean status to string for form display
      let statusValue = '';
      if (item.status !== undefined && item.status !== null) {
        if (typeof item.status === 'boolean') {
          statusValue = item.status ? 'active' : 'inactive';
        } else {
          statusValue = item.status;
        }
      }
      
      reset({
        title: item.title,
        description: item.description || '',
        status: statusValue,
        order: item.order || undefined,
        category_id: item.category_id || undefined,
      });
    } else {
      reset({
        title: '',
        description: '',
        status: '',
        order: undefined,
        category_id: undefined,
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormValues) => {
    const title = String(data.title ?? '').trim();
    if (!title) {
      showSnackbar('Title is required', 'error');
      return;
    }

    // Validate description length
    if (data.description && data.description.length > 200) {
      showSnackbar('Description must be 200 characters or less', 'error');
      return;
    }

    // Validate order is not negative
    if (data.order !== undefined && data.order !== null && data.order < 0) {
      showSnackbar('Order must be a positive number (0 or greater)', 'error');
      return;
    }

    try {
      // Convert status string to boolean
      let statusValue: boolean | undefined = undefined;
      if (data.status) {
        statusValue = data.status === 'active';
      }

      const payload: any = {
        title,
        ...(data.description && { description: data.description.trim() }),
        ...(statusValue !== undefined && { status: statusValue }),
        ...(data.order !== undefined && data.order !== null && data.order >= 0 && { order: Number(data.order) }),
        ...(data.category_id !== undefined && data.category_id !== null && { category_id: Number(data.category_id) }),
      };

      const res = item?.id
        ? await updatePopularCategory(item.id, payload)
        : await createPopularCategory(payload);

      if (res?.success === false) {
        const msg = res?.errors?.[0]?.msg || res?.message || 'Validation failed';
        showSnackbar(msg, 'error');
        return;
      }

      showSnackbar(
        item?.id
          ? 'Popular category updated successfully'
          : 'Popular category created successfully',
        'success'
      );
      onSuccess();
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.[0]?.msg ||
        e?.response?.data?.message ||
        e?.message ||
        'Action failed';
      showSnackbar(msg, 'error');
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
              error={!!fieldState.error}
              helperText={fieldState.error?.message || (categoriesLoading ? 'Loading categories...' : '')}
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
                  <MenuItem key="select-category" value="">Select Category</MenuItem>,
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
        <FormTextField<FormValues>
          name="title"
          control={control}
          label="Title"
          required
        />
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Description"
              multiline
              rows={3}
              fullWidth
              size="small"
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message || 
                `${field.value?.length || 0}/200 characters`
              }
              inputProps={{
                maxLength: 200
              }}
              InputLabelProps={{ shrink: true }}
              placeholder="Enter description (optional)"
              value={field.value ?? ''}
              sx={{
                '& label': { color: '#005B2F' },
                '& label.Mui-focused': { color: '#005B2F' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  height: 'auto',
                  padding: '0px',
                },
                '& .MuiOutlinedInput-input': {
                  backgroundColor: 'white',
                  height: 'auto',
                  paddingTop: '18px',
                  paddingBottom: '8px',
                },
              }}
            />
          )}
        />
        <FormTextField<FormValues>
          name="status"
          control={control}
          label="Status"
          select
        >
          <MenuItem value="">None</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </FormTextField>
      
        <Controller
          name="order"
          control={control}
          render={({ field, fieldState }) => {
            // Use local state to track the input value for better editing experience
            const [inputValue, setInputValue] = useState<string>(
              field.value !== undefined && field.value !== null ? String(field.value) : ''
            );

            // Sync with field value when it changes externally (e.g., form reset)
            useEffect(() => {
              if (field.value !== undefined && field.value !== null) {
                setInputValue(String(field.value));
              } else {
                setInputValue('');
              }
            }, [field.value]);

            return (
              <TextField
                label="Order"
                type="text"
                fullWidth
                size="small"
                error={!!fieldState.error}
                helperText={fieldState.error?.message || 'Enter a positive number (0 or greater)'}
                value={inputValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Allow empty string
                  if (newValue === '') {
                    setInputValue('');
                    field.onChange(undefined);
                    return;
                  }
                  // Only allow digits (0-9) - update local state immediately for responsive editing
                  if (/^\d+$/.test(newValue)) {
                    setInputValue(newValue);
                    const numValue = parseInt(newValue, 10);
                    if (!isNaN(numValue) && numValue >= 0) {
                      field.onChange(numValue);
                    }
                  }
                  // If input contains non-digits, don't update (ignore invalid input)
                }}
                onBlur={(e) => {
                  field.onBlur();
                  // Validate and normalize on blur
                  const trimmedValue = inputValue.trim();
                  if (trimmedValue === '') {
                    setInputValue('');
                    field.onChange(undefined);
                  } else if (/^\d+$/.test(trimmedValue)) {
                    const numValue = parseInt(trimmedValue, 10);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setInputValue(String(numValue));
                      field.onChange(numValue);
                    } else {
                      // Reset to last valid value
                      if (field.value !== undefined && field.value !== null) {
                        setInputValue(String(field.value));
                      } else {
                        setInputValue('');
                      }
                    }
                  } else {
                    // Reset to last valid value if invalid
                    if (field.value !== undefined && field.value !== null) {
                      setInputValue(String(field.value));
                    } else {
                      setInputValue('');
                    }
                  }
                }}
                name={field.name}
                inputRef={field.ref}
                onKeyDown={(e) => {
                  // Allow all navigation and editing keys
                  const allowedKeys = [
                    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Tab', 'Home', 'End', 'Enter', 'Escape'
                  ];
                  if (allowedKeys.includes(e.key)) {
                    return; // Allow these keys
                  }
                  // Allow Ctrl/Cmd combinations (copy, paste, select all, etc.)
                  if (e.ctrlKey || e.metaKey) {
                    return;
                  }
                  // Only allow digits (0-9)
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                  },
                }}
              />
            );
          }}
        />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            type="submit"
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
            Save
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};

export default PopularCategoryForm;

