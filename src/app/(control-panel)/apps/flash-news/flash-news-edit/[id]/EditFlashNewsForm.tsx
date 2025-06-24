'use client'
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paper, Grid, Switch, FormControlLabel, Typography } from '@mui/material';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { getFlashNews, updateFlashNews } from '@/services/apiFlashNews';

interface FlashNewsFormValues {
  label: string;
  url: string;
  status: boolean;
}
// Define Zod schema
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

const EditFlashNewsForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<FlashNewsFormValues>({
    resolver: zodResolver(flashNewsSchema),
    mode: 'all',
    defaultValues: {
      label: '',
      url: '',
      status: true,
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getFlashNews();
        // Find the flash news by id from the list
        const id = Number(params.id);
        const item = res.data?.flashNews?.find((f) => f.id === id);
        if (item) {
          reset({
            label: item.label || '',
            url: item.url || '',
            status: !!item.status,
          });
        } 
        else {
          showSnackbar('Flash news not found', 'error');
          router.push('/apps/flash-news');
        }
      } catch (error) {
        showSnackbar('Failed to fetch flash news', 'error');
        router.push('/apps/flash-news');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchData();
  }, [params.id, reset, router, showSnackbar]);

  const onSubmit = async (data: FlashNewsFormValues) => {
    try {
      setIsSubmitting(true);
      await updateFlashNews(Number(params.id), data);
      // await updateFlashNews(Number(params.id), data as { label: string; url: string; status: boolean });
      showSnackbar('Flash news updated successfully', 'success');
      router.push('/apps/flash-news');
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to update flash news', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white', maxWidth: 600 }}>
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
            label="Update Flash News" 
            loading={isSubmitting}
            disabled={isSubmitting || !isValid}
          />
        </div>
      </form>
    </Paper>
  );
};

export default EditFlashNewsForm; 