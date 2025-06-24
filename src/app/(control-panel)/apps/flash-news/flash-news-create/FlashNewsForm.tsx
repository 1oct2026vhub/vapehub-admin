'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paper, Grid, Switch, FormControlLabel, Typography } from '@mui/material';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { createOrUpdateFlashNews } from '@/services/apiFlashNews';

interface FlashNewsFormValues {
  label: string;
  url: string;
  status: boolean;
}
// 1. Define Zod schema
const flashNewsSchema = z.object({
  label: z.string()
    .min(1, 'Label is required')
    .max(100, 'Label must be 100 characters or less'),
  url: z.string()
    .min(1, 'Url is required')
    .url('Enter a valid URL')
    .max(500, 'URL must be 500 characters or less'),
  status: z.boolean(),
});

// type FlashNewsFormValues = z.infer<typeof flashNewsSchema>;

const FlashNewsForm: React.FC = () => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Use zodResolver in useForm
  const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<FlashNewsFormValues>({
    resolver: zodResolver(flashNewsSchema),
    mode: 'all',
    defaultValues: {
      label: '',
      url: '',
      status: true,
    },
  });

  const onSubmit = async (data: FlashNewsFormValues) => {
    try {
      setIsSubmitting(true);
       await createOrUpdateFlashNews(data);

      // await createOrUpdateFlashNews(data as { label: string; url: string; status: boolean });
      showSnackbar('Flash news created successfully', 'success');
      router.push('/apps/flash-news');
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to create flash news', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white', maxWidth: 600}}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormTextField 
              name="label" 
              control={control} 
              label="Label" 
              required 
              error={!!errors.label}
              helperText={errors.label?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <FormTextField 
              name="url" 
              control={control} 
              label="URL" 
              required 
              error={!!errors.url}
              helperText={errors.url?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={e => field.onChange(e.target.checked)} />}
                  label="Active"
                />
              )}
            />
          </Grid>
        </Grid>
        <div className="flex justify-end gap-16 mt-10">
          <AppButton 
            type="submit" 
            label="Create Flash News" 
            loading={isSubmitting}
            disabled={isSubmitting || !isValid}
          />
        </div>
      </form>
    </Paper>
  );
};

export default FlashNewsForm; 