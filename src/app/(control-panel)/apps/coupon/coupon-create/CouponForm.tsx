'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Control, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Typography,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  CircularProgress,
  TextField,
} from '@mui/material';
import { type CreateCouponData, createCoupon } from '@/services/apiCoupon';
import FormTextField from '@/components/Shared/FormTextField';
import FormDateTimeField from '@/components/Shared/FormDateTimeField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useDebounce } from '@/hooks/useDebounce';
import { listProducts } from '@/services/apiProduct';
import { listProductBrand } from '@/services/apiProductBrand';
import { listProductCategory } from '@/services/apiProductCategory';

export const couponSchema = z.object({
  code: z.string()
    .min(1, 'Coupon Code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code can only contain uppercase letters, numbers, hyphens and underscores'),
  description: z.string()
    .min(1, 'Description is required')
    .max(255 , 'Description must be 255 characters or less'),
  discount_value: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Discount value"),
      z.number()
        .positive("Discount value must be greater than zero")
        .max(9999999.99, "Discount value exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Discount value can have at most 2 decimal places" }
        ),
      z.null().refine(() => false, "Discount value is required"), // Enforce non-null
    ])
  ),
  minimum_purchase: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Minimum Purchase"),
      z.number()
        .positive("Minimum Purchase must be greater than zero")
        .max(9999999.99, "Minimum Purchase exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Minimum Purchase can have at most 2 decimal places" }
        ),
    ]).optional()
  ),
  maximum_discount: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Maximum Discount"),
      z.number()
        .positive("Maximum Discount must be greater than zero")
        .max(9999999.99, "Maximum Discount exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Maximum Discount can have at most 2 decimal places" }
        ),
    ]).optional()
  ),
  discount_type: z.enum(['percentage', 'fixed_amount'], {
    required_error: 'Discount type is required',
  }),
  usage_limit: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Usage limit"),
      z.number()
        .int("Usage limit must be a whole number")
        .min(0, "Usage limit must be a non-negative number"),
      z.null().refine(() => false, "Usage limit is required"),
    ])
  ),
  is_single_use: z.boolean(),
  start_date: z.string().nullable().refine(val => val !== null, { message: 'Start date is required' }),
  end_date: z.string().nullable().refine(val => val !== null, { message: 'End date is required' }),
  status: z.enum(['active', 'inactive', 'expired'], {
    required_error: 'Status is required',
  }),
  entity_type: z.enum(['product', 'brand', 'category', 'all']).nullable().optional(),
  entity_id: z.string().nullable().optional(),
}).refine(data => {
    if (data.start_date && data.end_date) {
        return new Date(data.end_date) > new Date(data.start_date);
    }
    return true;
}, {
    message: "End date must be after start date",
    path: ["end_date"],
}).refine(data => {
    if (data.entity_type) {
        return !!data.entity_id;
    }
    return true;
}, {
    message: 'Entity Name is required when entity type is selected.',
    path: ['entity_id'],
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CouponForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { control, handleSubmit, watch, setError, setValue, formState: { errors, isValid } } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    mode: 'all',
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percentage',
      status: 'active',
      is_single_use: false,
      minimum_purchase: null,
      maximum_discount: null,
      usage_limit: 0,
      start_date: null,
      end_date: null,
      entity_type: null,
      entity_id: null,
    },
  });

  const discountType = watch('discount_type');
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const entityType = watch('entity_type');
  console.log("Start Date", startDate);
  console.log("End Date", endDate);

  useEffect(() => {
    if (discountType === 'fixed_amount') {
      setValue('maximum_discount', null, { shouldValidate: true });
    }
  }, [discountType, setValue]);

  useEffect(() => {
    setValue('entity_id', null, { shouldValidate: true });
  }, [entityType, setValue]);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!entityType) {
        setEntities([]);
        return;
      }

      setLoadingEntities(true);

      let response: any;
      let fetchedEntities: any[] = [];
      const params: any = { limit: 50 };

      if (debouncedSearch) {
        if (entityType === 'product') {
          params.keyword = debouncedSearch;
        } else {
          params.search = debouncedSearch;
          params.search_only_name = true;
        }
      }

      try {
        switch (entityType) {
          case 'brand':
            response = await listProductBrand(params);
            fetchedEntities = response?.data?.brands || [];
            break;
          case 'category':
            response = await listProductCategory(params);
            fetchedEntities = response?.data?.categories || [];
            break;
          case 'product':
            response = await listProducts(params);
            fetchedEntities = response?.data?.products || [];
            break;
          default:
            fetchedEntities = [];
            break;
        }
        setEntities(fetchedEntities);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
        setEntities([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [entityType, debouncedSearch]);

  const onSubmit = async (data: CouponFormValues) => {
    try {
      setIsSubmitting(true);
      const toUTC = (dateString: string | null | undefined): string | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Date(Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds(),
        )).toISOString();
      };

      const submissionData = {
        ...data,
        entity_type: data.entity_type === 'all' ? null : data.entity_type,
        entity_id: data.entity_type === 'all' ? null : data.entity_id,
      };

      await createCoupon(submissionData as unknown as CreateCouponData);
      showSnackbar('Coupon created successfully', 'success');
      router.push('/apps/coupon');
    } catch (error: any) {
  if (error?.error) {
        showSnackbar(error?.error[0]?.msg || error?.error[0]?.message, "error");
      }
      else if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg || error?.errors[0]?.message, "error");
      }
       else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            setError(field as any, { type: "manual", message });
            showSnackbar(message, "error");
          }
        });
      }
      }
      finally {
      setIsSubmitting(false);
    }
  };

  return (
    // <div className="flex justify-center items-center">
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      {/* <div className="flex items-center justify-between">
        <Typography variant="h6">Create New Coupon</Typography>
      </div> */}

      <form onSubmit={handleSubmit(onSubmit)} className="">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="entity_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    {...field}
                    label="Entity Type"
                    sx={{ backgroundColor: 'white' }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="product">Product</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                    <MenuItem value="brand">Brand</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          {entityType && entityType !== 'all' && (
            <Grid item xs={12} md={6}>
              <Controller
                name="entity_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={entities}
                    getOptionLabel={(option) => option.name || option.title || ''}
                    value={entities.find((e) => String(e.id) === field.value) || null}
                    onChange={async (event, newValue) => {
                      field.onChange(newValue ? String(newValue.id) : '');
                    }}
                    onInputChange={(event, newInputValue) => {
                      setSearch(newInputValue);
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                      },
                    }}
                    filterOptions={(x) => x}
                    loading={loadingEntities}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Entity Name"
                        fullWidth
                        className='h-10'
                        error={!!errors.entity_id}
                        helperText={errors.entity_id?.message as string}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingEntities ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormTextField
              name="code"
              control={control}
              label="Coupon Code"
              required
              error={!!errors.code}
              helperText={errors.code?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              name="description"
              control={control}
              label="Description"
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              name="discount_type"
              control={control}
              label="Discount Type"
              select
              required
              error={!!errors.discount_type}
              helperText={errors.discount_type?.message}
            >
              <MenuItem value="percentage">Percentage</MenuItem>
              <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
            </FormTextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              name="discount_value"
              control={control}
              label="Discount Value"
              type="number"
              required
              // error={!!errors.discount_value}
              // helperText={errors.discount_value?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              name="minimum_purchase"
              control={control}
              label="Minimum Purchase"
              type="number"
              // error={!!errors.minimum_purchase}
              // helperText={errors.minimum_purchase?.message}
            />
          </Grid>

          {discountType !== 'fixed_amount' && (
            <Grid item xs={12} md={6}>
              <FormTextField
                name="maximum_discount"
                control={control}
                label="Maximum Discount"
                type="number"
                // error={!!errors.maximum_discount}
                // helperText={errors.maximum_discount?.message}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormTextField
              name="usage_limit"
              control={control}
              label="Usage Limit"
              type="number"
              required
              // error={!!errors.usage_limit}
              // helperText={errors.usage_limit?.message}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormTextField
              name="status"
              control={control}
              label="Status"
              select
              required
              // error={!!errors.status}
              // helperText={errors.status?.message}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </FormTextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormDateTimeField
              name="start_date"
              control={control}
              label="Start Date"
              required
              // helperText="Select when the coupon becomes active"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormDateTimeField
              name="end_date"
              control={control}
              label="End Date"
              required
              // minDateTime={startDate ? new Date(startDate) : undefined}
              // helperText="Select when the coupon expires"
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="is_single_use"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Single Use Only"
                />
              )}
            />
          </Grid>
        </Grid>

        <div className="flex justify-end gap-2 mt-10">
          <Button
            variant="outlined"
            onClick={() => router.push('/apps/coupon')}
          >
            Cancel
          </Button>
          <AppButton
            type="submit"
            label="Create Coupon"
            loading={isSubmitting}
            disabled={isSubmitting || !isValid}
          />
        </div>
      </form>
    </Paper>
    // </div>
  );
} 