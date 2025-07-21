'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Grid, MenuItem, FormControlLabel, Switch, Button, Select, FormControl, InputLabel, Autocomplete, CircularProgress, TextField } from '@mui/material';
import {
  getCouponById,
  updateCoupon,
  type CreateCouponData
} from '@/services/apiCoupon';
import FormTextField from '@/components/Shared/FormTextField';
import FormDateTimeField from '@/components/Shared/FormDateTimeField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import FuseLoading from '@fuse/core/FuseLoading';
import { useDebounce } from '@/hooks/useDebounce';
import { listProducts, getProduct } from '@/services/apiProduct';
import { listProductBrand } from '@/services/apiProductBrand';
import { listProductCategory } from '@/services/apiProductCategory';


export const couponSchema = z.object({
  code: z
    .string()
    .min(1, 'Coupon code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code can only contain uppercase letters, numbers, hyphens and underscores'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be 255 characters or less'),
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
    if (data.entity_type && data.entity_type !== 'all') {
        return !!data.entity_id;
    }
    return true;
}, {
    message: 'Entity Name is required when entity type is selected.',
    path: ['entity_id'],
});

export type CouponFormSchema = z.infer<typeof couponSchema>;

export default function EditCouponForm() {
  const router = useRouter();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [initialEntity, setInitialEntity] = useState<any>(null);

  const { control, handleSubmit, reset, watch, setError, setValue, formState: { errors } } = useForm<CouponFormSchema>({
    resolver: zodResolver(couponSchema),
    mode: 'all',
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: null,
      minimum_purchase: null,
      maximum_discount: null,
      usage_limit: 0,
      is_single_use: false,
      start_date: null,
      end_date: null,
      status: 'active',
      entity_type: null,
      entity_id: null,
    },
  });

  const discountType = watch('discount_type');
  const entityType = watch('entity_type');

  useEffect(() => {
    async function fetchCoupon() {
      try {
        const response = await getCouponById(Number(params.id));
        const coupon = response.data.coupon;

        reset({
          code: coupon.code || '',
          description: coupon.description || '',
          discount_type: coupon.discount_type || 'percentage',
          discount_value: coupon.discount_value ? Number(coupon.discount_value) : null,
          minimum_purchase: coupon.minimum_purchase ? Number(coupon.minimum_purchase) : null,
          maximum_discount: coupon.maximum_discount ? Number(coupon.maximum_discount) : null,
          usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : 0,
          is_single_use: !!coupon.is_single_use,
          start_date: coupon.start_date ? new Date(coupon.start_date).toISOString() : null,
          end_date: coupon.end_date ? new Date(coupon.end_date).toISOString() : null,
          status: coupon.status || 'active',
          entity_type: coupon.entity_type === null ? 'all' : coupon.entity_type,
          entity_id: coupon.entity_id ? String(coupon.entity_id) : null,
        });

        if (coupon.entity) {
            setInitialEntity(coupon.entity);
        }

      } catch (error) {
        // showSnackbar('Failed to fetch coupon data', 'error');
        // router.push('/apps/coupon');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchCoupon();
  }, [params.id, reset, router, showSnackbar]);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!entityType || entityType === 'all') {
        setEntities([]);
        return;
      }

      setLoadingEntities(true);

      let response: any;
      let fetchedEntities: any[] = [];
      const params: any = { 
        limit: 50,
        sort_by: 'id',
        order: 'DESC'
      };

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
  }, [entityType, debouncedSearch, showSnackbar]);

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => {
    if (discountType === 'fixed_amount') {
      setValue('maximum_discount', null, { shouldValidate: true });
    }
  }, [discountType, setValue]);

  const onSubmit = async (data: CouponFormSchema) => {
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
        start_date: toUTC(data.start_date),
        end_date: toUTC(data.end_date),
        entity_type: data.entity_type === 'all' ? null : data.entity_type,
      };
      await updateCoupon(Number(params.id), submissionData as CreateCouponData);
      showSnackbar('Coupon updated successfully', 'success');
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <FuseLoading/>;

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="entity_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="entity-type-label">Entity Type</InputLabel>
                  <Select
                    {...field}
                    labelId="entity-type-label"
                    label="Entity Type"
                    sx={{ backgroundColor: 'white' }}
                    value={field.value ?? ''}
                    onChange={(e) => {
                        const value = e.target.value === '' ? null : e.target.value;
                        field.onChange(value);
                        setValue('entity_id', null, { shouldValidate: true });
                        setInitialEntity(null);
                    }}
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
                    value={
                      initialEntity && String(initialEntity.id) === field.value
                        ? initialEntity
                        : entities.find((e) => String(e.id) === field.value) || null
                    }
                    onChange={(event, newValue) => {
                      field.onChange(newValue ? String(newValue.id) : '');
                      setInitialEntity(null);
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
                        placeholder={`Search ${entityType}`}
                        className='h-10'
                        fullWidth
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
              error={!!errors.description}
              helperText={errors.description?.message}
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
              error={!!errors.discount_value}
              helperText={errors.discount_value?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="minimum_purchase"
              control={control}
              label="Minimum Purchase"
              type="number"
              error={!!errors.minimum_purchase}
              helperText={errors.minimum_purchase?.message as string}
            />
          </Grid>
          {discountType !== 'fixed_amount' && (
            <Grid item xs={12} md={6}>
              <FormTextField
                name="maximum_discount"
                control={control}
                label="Maximum Discount"
                type="number"
                error={!!errors.maximum_discount}
                helperText={errors.maximum_discount?.message as string}
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
              error={!!errors.usage_limit}
              helperText={errors.usage_limit?.message as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="status"
              control={control}
              label="Status"
              select
              required
              error={!!errors.status}
              helperText={errors.status?.message}
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
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormDateTimeField
              name="end_date"
              control={control}
              label="End Date"
              required
              minDateTime={startDate ? new Date(startDate) : undefined}
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
          <Button variant="outlined" onClick={() => router.push('/apps/coupon')} disabled={isSubmitting}>
            Cancel
          </Button>
          <AppButton
            type="submit"
            label="Update Coupon"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Paper>
  );
} 