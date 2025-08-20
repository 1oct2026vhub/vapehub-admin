'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Grid,
  Button,
  Paper,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { CreateLoyaltyPointSettingData, createLoyaltyPointSetting, updateLoyaltyPointSetting, LoyaltyPointSetting } from '@/services/apiLoyaltyPoints';

const loyaltyPointSchema = z.object({
  program_name: z.string().min(1, 'Program name is required'),
  points_value: z.coerce
    .number({ invalid_type_error: 'Points value is required' })
    .positive('Points value must be a positive number')
    .refine(
      (value) => {
        const parts = String(value).split('.');
        return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
      },
      {
        message: 'Points value can have at most 2 decimal places.',
      }
    ),
  loyalty_amount: z.coerce
    .number({ invalid_type_error: 'Loyalty amount is required' })
    .positive('Loyalty amount must be a positive number')
    .refine(
      (value) => {
        const parts = String(value).split('.');
        return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
      },
      {
        message: 'Loyalty amount can have at most 2 decimal places.',
      }
    ),
  loyalty_amount_type: z.enum(['percentage', 'fixed']),
  minimum_points_redemption: z.coerce
    .number({ invalid_type_error: 'Minimum points redemption is required' })
    .int('Minimum points redemption must be a whole number')
    .positive('Minimum points redemption must be a positive integer'),
  minimum_purchase_amount: z.coerce
    .number({ invalid_type_error: 'Minimum purchase amount is required' })
    .positive('Minimum purchase amount must be a positive number')
    .refine(
      (value) => {
        const parts = String(value).split('.');
        return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
      },
      {
        message: 'Minimum purchase amount can have at most 2 decimal places.',
      }
    ),
  min_amount_for_loyalty_points: z.coerce
    .number({ invalid_type_error: 'Minimum amount for loyalty points is required' })
    .positive('Minimum amount for loyalty points must be a positive number')
    .refine(
      (value) => {
        const parts = String(value).split('.');
        return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
      },
      {
        message: 'Minimum amount for loyalty points can have at most 2 decimal places.',
      }
    ),
  amount_divisor: z.coerce
    .number({ invalid_type_error: 'Amount divisor is required' })
    .nonnegative('Amount divisor must be a non-negative number')
    .refine(
      (value) => {
        const parts = String(value).split('.');
        return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
      },
      {
        message: 'Amount divisor can have at most 2 decimal places.',
      }
    ),
  status: z.boolean(),
});

type LoyaltyPointFormType = z.infer<typeof loyaltyPointSchema>;

interface LoyaltyPointFormProps {
    initialData?: LoyaltyPointSetting | null;
}

export default function LoyaltyPointForm({ initialData = null }: LoyaltyPointFormProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = initialData !== null;
  const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<LoyaltyPointFormType>({
    resolver: zodResolver(loyaltyPointSchema),
    mode: 'all',
    defaultValues: {
      program_name: initialData?.program_name || '',
      points_value: initialData ? Number(initialData.points_value) : undefined,
      loyalty_amount: initialData ? Number(initialData.loyalty_amount) : undefined,
      loyalty_amount_type: (initialData?.loyalty_amount_type as 'percentage' | 'fixed') || 'fixed',
      minimum_points_redemption: initialData?.minimum_points_redemption || undefined,
      minimum_purchase_amount: initialData ? Number(initialData.minimum_purchase_amount) : undefined,
      min_amount_for_loyalty_points: initialData ? Number(initialData.min_amount_for_loyalty_points) : undefined,
      amount_divisor: initialData ? Number(initialData.amount_divisor) : undefined,
      status: initialData?.status ?? true,
    },
  });

  useEffect(() => {
    if (initialData) {
        reset({
            ...initialData,
            points_value: Number(initialData.points_value),
            loyalty_amount: Number(initialData.loyalty_amount),
            loyalty_amount_type: initialData.loyalty_amount_type as 'percentage' | 'fixed',
            minimum_purchase_amount: Number(initialData.minimum_purchase_amount),
            min_amount_for_loyalty_points: Number(initialData.min_amount_for_loyalty_points),
            amount_divisor: Number(initialData.amount_divisor),
        });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: LoyaltyPointFormType) => {
    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await updateLoyaltyPointSetting(initialData.id, data);
        showSnackbar('Loyalty points setting updated successfully', 'success');
      } else {
        await createLoyaltyPointSetting(data as CreateLoyaltyPointSettingData);
        showSnackbar('Loyalty points setting created successfully', 'success');
      }
      router.push('/apps/loyalty-points');
    } catch (error: any) {
      showSnackbar(error.message || `Failed to ${isEditMode ? 'update' : 'create'} setting`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="program_name"
              control={control}
              label="Program Name"
              required
              error={!!errors.program_name}
              helperText={errors.program_name?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="points_value"
              control={control}
              label="Value per Point (in Currency)"
              type="number"
              required
              error={!!errors.points_value}
              helperText={errors.points_value?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="loyalty_amount"
              control={control}
              label="Points Earned per Transaction"
              type="number"
              required
              error={!!errors.loyalty_amount}
              helperText={errors.loyalty_amount?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="loyalty_amount_type"
              control={control}
              label="Reward Type (Fixed/Percentage)"
              select
              required
            >
              <MenuItem value="fixed">Fixed</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
            </FormTextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="minimum_points_redemption"
              control={control}
              label="Minimum Points Required to Redeem"
              type="number"
              required
              error={!!errors.minimum_points_redemption}
              helperText={errors.minimum_points_redemption?.message}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === '.') {
                  e.preventDefault();
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="minimum_purchase_amount"
              control={control}
              label="Minimum Spend to Use Loyalty Points"
              type="number"
              required
              error={!!errors.minimum_purchase_amount}
              helperText={errors.minimum_purchase_amount?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="min_amount_for_loyalty_points"
              control={control}
              label="Minimum Spend to Earn Loyalty Points"
              type="number"
              error={!!errors.min_amount_for_loyalty_points}
              helperText={errors.min_amount_for_loyalty_points?.message}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField
              name="amount_divisor"
              control={control}
              label="Spend Per Point Ratio"
              type="number"
              required
              error={!!errors.amount_divisor}
              helperText={errors.amount_divisor?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Status"
                />
              )}
            />
          </Grid>
        </Grid>
        <div className="flex justify-end gap-2 mt-10">
          <Button
            variant="outlined"
            onClick={() => router.push('/apps/loyalty-points')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <AppButton
            type="submit"
            label={isEditMode ? "Update Setting" : "Create Setting"}
            loading={isSubmitting}
            disabled={isSubmitting || !isValid}
          />
        </div>
      </form>
    </Paper>
  );
} 