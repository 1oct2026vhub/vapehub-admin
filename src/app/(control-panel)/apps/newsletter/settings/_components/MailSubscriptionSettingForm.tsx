'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    MenuItem,
    Checkbox,
    FormControlLabel,
    Paper,
    Grid,
    Button,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { createSetting, updateSetting, CreateSettingData, MailSubscriptionSetting } from '@/services/apiMailSubscriptionSettings';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  email_frequency: z.enum(['daily', 'weekly', 'monthly'], {
    required_error: 'Email frequency is required.',
  }),
  product_updates: z.boolean(),
  discount_notifications: z.boolean(),
  discount_amount: z.coerce
    .number({
        invalid_type_error: 'Discount amount must be a number.',
    })
    .min(0.01, { message: 'Discount amount is required and must be positive.' })
    .refine(
        (value) => {
            const parts = String(value).split('.');
            return !parts[1] || parts[1].length <= 2;
        },
        {
            message: 'Discount amount can have at most two decimal places.',
        }
    ),
  discount_type: z.enum(['percentage', 'fixed'], {
    required_error: 'Discount type is required.',
  }),
  status: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface MailSubscriptionSettingFormProps {
    initialData?: MailSubscriptionSetting | null;
}

const MailSubscriptionSettingForm: React.FC<MailSubscriptionSettingFormProps> = ({ initialData = null }) => {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = initialData !== null;

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        reset
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: 'all',
        defaultValues: {
            email_frequency: initialData?.email_frequency || 'weekly',
            product_updates: initialData?.product_updates ?? true,
            discount_notifications: initialData?.discount_notifications ?? true,
            discount_amount: initialData ? Number(initialData.discount_amount) : null,
            discount_type: initialData?.discount_type,
            status: initialData?.status ?? true,
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                discount_amount: Number(initialData.discount_amount),
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data: FormValues) => {
        try {
            setIsSubmitting(true);
            const apiData = data as CreateSettingData;
            if (isEditMode) {
                await updateSetting(initialData.id, apiData);
                showSnackbar('Setting updated successfully!', 'success');
                  router.push('/apps/newsletter/subscriber');
            } else {
                await createSetting(apiData);
                showSnackbar('Setting created successfully!', 'success');
            }
            router.push('/apps/newsletter/subscriber');
        } catch (error: any) {
            showSnackbar(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} setting`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Paper className="p-8 bg-white">
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            name="email_frequency"
                            control={control}
                            label="Email Frequency"
                            select
                            required
                        >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                        </FormTextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            name="discount_type"
                            control={control}
                            label="Discount Type"
                            select
                            required
                        >
                            <MenuItem value="percentage">Percentage</MenuItem>
                            <MenuItem value="fixed">Fixed Amount</MenuItem>
                        </FormTextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            name="discount_amount"
                            control={control}
                            label="Discount Amount"
                            type="number"
                            required
                            inputProps={{ min: 0, step: "0.01" }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="product_updates"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Product Updates"
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="discount_notifications"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Discount Notifications"
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox {...field} checked={field.value} />}
                                    label="Active"
                                />
                            )}
                        />
                    </Grid>
                </Grid>
                <div className="flex justify-end gap-2 mt-10">
                    <Button
                        variant="outlined"
                        onClick={() => router.push('/apps/newsletter/settings')}
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
};

export default MailSubscriptionSettingForm; 