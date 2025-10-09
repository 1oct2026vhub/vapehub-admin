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
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel as MuiFormControlLabel,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { CreateLoyaltyPointSettingData, createLoyaltyPointSetting, updateLoyaltyPointSetting, LoyaltyPointSetting } from '@/services/apiLoyaltyPoints';

const loyaltyPointSchema = z.object({
  program_name: z.string().min(1, 'Program name is required'),
  // points_value: z.coerce
  //   .number({ invalid_type_error: 'Points value is required' })
  //   .positive('Points value must be a positive number')
  //   .refine(
  //     (value) => {
  //       const parts = String(value).split('.');
  //       return parts.length === 1 || (parts.length === 2 && parts[1].length <= 2);
  //     },
  //     {
  //       message: 'Points value can have at most 2 decimal places.',
  //     }
  //   ),
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
  const { control, handleSubmit, reset, watch, formState: { errors, isValid } } = useForm<LoyaltyPointFormType>({
    resolver: zodResolver(loyaltyPointSchema),
    mode: 'all',
    defaultValues: {
      program_name: initialData?.program_name || '',
      // points_value: initialData ? Number(initialData.points_value) : undefined,
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
            // points_value: Number(initialData.points_value),
            loyalty_amount: Number(initialData.loyalty_amount),
            loyalty_amount_type: initialData.loyalty_amount_type as 'percentage' | 'fixed',
            minimum_purchase_amount: Number(initialData.minimum_purchase_amount),
            min_amount_for_loyalty_points: Number(initialData.min_amount_for_loyalty_points),
            amount_divisor: Number(initialData.amount_divisor),
        });
    }
  }, [initialData, reset]);

  // Calculate example text reactively based on earning rules
  const amountDivisor = Number(watch('amount_divisor') || 0);
  const minAmountForPoint = Number(watch('min_amount_for_loyalty_points') || 0);
  // Spend value shown in the summary: when user sets a minimum amount, use it; else default to 100
  const exampleSpendAmount = minAmountForPoint > 0 ? minAmountForPoint : Number(watch('minimum_purchase_amount') || 0);
  const safePoints = amountDivisor > 0 ? Math.floor(exampleSpendAmount / amountDivisor) : 0;
  const exampleMinRedeemPoints = watch('minimum_points_redemption');
  const discountPerPoint = 1; // from the example: 40 pts -> ₹2 => ₹0.05 per point (but example copy shows fixed statement). We'll map 40 -> 2 using loyalty config below if needed.
  const loyaltyAmount = watch('loyalty_amount');
  const loyaltyType = watch('loyalty_amount_type');
  // For the bottom example we stick to the design text using 40 points -> discount value
  const exampleRedeemPts = exampleMinRedeemPoints || Number(watch('minimum_points_redemption') || 0);
  const discountForExampleRedeem = loyaltyType === 'percentage'
    ? `${loyaltyAmount ?? 0}%`
    : `£${loyaltyAmount ?? 0}`;

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
          {/* Program basics section */}
          {/* <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
              1. Program basics:
            </Typography>
          </Grid> */}
          
          <Grid item xs={12} md={6}>
            <FormTextField
              name="program_name"
              control={control}
              label="Program name"
              required
              helperText="Enter the name of your loyalty program"
            />
          </Grid>
          
        

          {/* Earning points section */}
          {/* <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, mt: 2 }}>
              2. Earning points:
            </Typography>
          </Grid>
           */}
          <Grid item xs={12} md={6}>
            <FormTextField
              name="amount_divisor"
              control={control}
              label="Earn 1 point for every"
              type="number"
              required
              error={!!errors.amount_divisor}
              helperText="Enter how much a customer must spend to earn 1 point (e.g. 2 → 1 point per £2)."
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormTextField
              name="min_amount_for_loyalty_points"
              control={control}
              label="Minimum amount for getting loyalty point"
              type="number"
              error={!!errors.min_amount_for_loyalty_points}
              helperText="Orders below this amount won't earn any points."
              required
            />
          </Grid>

          {/* Redeeming points section */}
          {/* <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, mt: 2 }}>
              3. Redeeming points:
            </Typography>
          </Grid> */}
          
          <Grid item xs={12} md={6}>
            <FormTextField
              name="minimum_points_redemption"
              control={control}
              label="Minimum points to redeem"
              type="number"
              required
              error={!!errors.minimum_points_redemption}
              helperText="Customers must have at least this number of points to apply them at checkout."
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
              label="Minimum order value to redeem"
              type="number"
              required
              error={!!errors.minimum_purchase_amount}
              helperText="Only orders above this value can use loyalty points."
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Controller
              name="loyalty_amount_type"
              control={control}
              render={({ field }) => (
                <FormControl component="fieldset" required>
                  <FormLabel component="legend" className='text-[#005B2F]'>Discount type</FormLabel>
                  <RadioGroup
                    {...field}
                    row
                    sx={{ mt: 1 }}
                  >
                      <MuiFormControlLabel
                      value="fixed"
                      control={<Radio />}
                      label="Fixed amount"
                    />
                    <MuiFormControlLabel
                      value="percentage"
                      control={<Radio />}
                      label="Percentage (%)"
                    />                
                  </RadioGroup>
                </FormControl>
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormTextField
              name="loyalty_amount"
              control={control}
              label="Discount value"
              type="number"
              required
              error={!!errors.loyalty_amount}
              helperText="If maximum dicount per order"
            />
          </Grid>

            <Grid item xs={12} md={6}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="body1">Status</Typography>
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={field.value ? "Active" : "Inactive"}
                    labelPlacement="end"
                  />
                </Box>
              )}
            />
          </Grid>

          {/* Summary/Example section */}
          <Grid item xs={12}>
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" color="text.secondary">
                {`If a customer spends £${exampleSpendAmount}, they earn ${safePoints} points.`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {`With ${exampleRedeemPts} points, they can apply a ${discountForExampleRedeem} discount.`}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/apps/loyalty-points')}
            disabled={isSubmitting}
            sx={{ 
              bgcolor: 'white', 
              color: 'black',
              borderColor: 'grey.300',
              '&:hover': {
                borderColor: 'grey.400',
                bgcolor: 'grey.50'
              }
            }}
          >
            Cancel
          </Button>
          <AppButton
            type="submit"
            label="Save changes"
            loading={isSubmitting}
            disabled={isSubmitting || !isValid}
            sx={{
              bgcolor: 'success.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'success.dark'
              }
            }}
          />
        </Box>
      </form>
    </Paper>
  );
} 