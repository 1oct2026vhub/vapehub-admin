'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { type CreateCouponData, createCoupon } from '@/services/apiCoupon';
import FormTextField from '@/components/Shared/FormTextField';
import FormDateTimeField from '@/components/Shared/FormDateTimeField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';

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
      if (val === "" || val === null || val === undefined) return null;
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
      z.null().refine(() => false, "Minimum purchase is required"), // Enforce non-null
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
        z.null(), // Allow null for optional field
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

export default function CouponForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, setError, formState: { errors, isValid } } = useForm<CreateCouponData>({
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
    },
  });

  const startDate = watch('start_date');

  const onSubmit = async (data: CreateCouponData) => {
    try {
      setIsSubmitting(true);
      await createCoupon(data);
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
              minDateTime={startDate ? new Date(startDate) : undefined}
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