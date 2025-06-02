'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Typography, Button, MenuItem, Grid } from '@mui/material';
// import { couponSchema } from '../../coupon-create/CouponForm';
import { getCouponById, updateCoupon, CreateCouponData } from '@/services/apiCoupon';
import FormTextField from '@/components/Shared/FormTextField';
import FormDateTimeField from '@/components/Shared/FormDateTimeField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { FormControlLabel, Switch } from '@mui/material';


export const couponSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code can only contain uppercase letters, numbers, hyphens and underscores'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
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
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Maximum Purchase"),
      z.number()
        .positive("Maximum Purchase must be greater than zero")
        .max(9999999.99, "Maximum Purchase exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Maximum Purchase can have at most 2 decimal places" }
        ),
      z.null().refine(() => false, "Maximum Purchase is required"), // Enforce non-null
    ])
  ),
  maximum_discount: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
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
      z.null().refine(() => false, "Maximum Discount is required"), // Enforce non-null
    ])
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
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.enum(['active', 'inactive', 'expired'], {
    required_error: 'Status is required',
  }),
});

export default function EditCouponForm() {
  const router = useRouter();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { control, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm<CreateCouponData>({
    resolver: zodResolver(couponSchema),
    mode: 'all',
    defaultValues: {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_purchase: 0,
      maximum_discount: 0,
      usage_limit: 0,
      is_single_use: false,
      start_date: '',
      end_date: '',
      status: 'active',
    },
  });

  useEffect(() => {
    async function fetchCoupon() {
      try {
        const response = await getCouponById(Number(params.id));
        const coupon = response.data.coupon;

        reset({
          code: coupon.code || '',
          description: coupon.description || '',
          discount_type: coupon.discount_type || 'percentage',
          discount_value: coupon.discount_value ? Number(coupon.discount_value) : 0,
          minimum_purchase: coupon.minimum_purchase ? Number(coupon.minimum_purchase) : 0,
          maximum_discount: coupon.maximum_discount ? Number(coupon.maximum_discount) : 0,
          usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : 0,
          is_single_use: !!coupon.is_single_use,
          start_date: coupon.start_date ? new Date(coupon.start_date).toISOString() : '',
          end_date: coupon.end_date ? new Date(coupon.end_date).toISOString() : '',
          status: coupon.status || 'active',
        });
      } catch (error) {
        // showSnackbar('Failed to fetch coupon data', 'error');
        // router.push('/apps/coupon');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchCoupon();
  }, [params.id, reset, router, showSnackbar]);

  const startDate = watch('start_date');

  const onSubmit = async (data: CreateCouponData) => {
    try {
      setIsSubmitting(true);
      await updateCoupon(Number(params.id), data);
      showSnackbar('Coupon updated successfully', 'success');
      router.push('/apps/coupon');
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to update coupon', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <Grid container spacing={3}>
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
              helperText={errors.discount_value?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField 
              name="minimum_purchase" 
              control={control} 
              label="Minimum Purchase" 
              type="number" 
              required 
              error={!!errors.minimum_purchase}
              helperText={errors.minimum_purchase?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField 
              name="maximum_discount" 
              control={control} 
              label="Maximum Discount" 
              type="number" 
              required 
              error={!!errors.maximum_discount}
              helperText={errors.maximum_discount?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField 
              name="usage_limit" 
              control={control} 
              label="Usage Limit" 
              type="number" 
              required 
              error={!!errors.usage_limit}
              helperText={errors.usage_limit?.message}
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