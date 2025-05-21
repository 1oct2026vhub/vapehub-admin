'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { getCarousel, updateCarousel } from '@/services/apiCarousel';
import { Carousel } from '@/types/carousel';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';
import FormFileUploadField from '@/components/Shared/FormFileUploadField';
import AppButton from '@/components/Shared/AppButton';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { validateImageDimensions } from "@/utils/imageUtils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const carouselFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required' }),
  redirect_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  image: z
    .instanceof(File)
    .optional()
    .nullable()
    .superRefine(async (file, ctx) => {
      if (!file) return;
      const { valid, message } = await validateImageDimensions(file, 1920, 700);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Desktop image dimensions must be 1920x700px.',
        });
      }
    }),
  image_low: z
    .instanceof(File)
    .optional()
    .nullable()
    .superRefine(async (file, ctx) => {
      if (!file) return;
      const { valid, message } = await validateImageDimensions(file, 450, 385);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Mobile image dimensions must be 450x385px.',
        });
      }
    }),
});

type CarouselFormValues = z.infer<typeof carouselFormSchema>;

interface EditCarouselFormProps {
  initialCarouselData: Carousel;
}

const EditCarouselForm: React.FC<EditCarouselFormProps> = ({ initialCarouselData }) => {
  const router = useRouter();
  const params = useParams();
  const carouselId = Number(params.carouselId as string);
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
    reset,
    watch,
  } = useForm<CarouselFormValues>({
    resolver: zodResolver(carouselFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: initialCarouselData?.title || '',
      description: initialCarouselData?.description || '',
      status: initialCarouselData?.status || 'active',
      redirect_url: initialCarouselData?.redirect_url || '',
    }
  });

  useEffect(() => {
    if (initialCarouselData) {
      console.log('Initial Carousel Data:', initialCarouselData);
      const defaultValues = {
        title: initialCarouselData.title || '',
        description: initialCarouselData.description || '',
        status: initialCarouselData.status || 'active',
        redirect_url: initialCarouselData.redirect_url || '',
      };
      console.log('Form Default Values:', defaultValues);
      reset(defaultValues);
    }
  }, [initialCarouselData, reset]);

  // Watch form values
  const formValues = watch();
  useEffect(() => {
    console.log('Current Form Values:', formValues);
  }, [formValues]);

  const onSubmit = async (data: CarouselFormValues) => {
    if (!carouselId) {
      showSnackbar('Carousel ID is missing. Cannot update.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (dirtyFields.title) payload.title = data.title;
      if (dirtyFields.description) payload.description = data.description;
      if (dirtyFields.status) payload.status = data.status;
      if (dirtyFields.redirect_url) payload.redirect_url = data.redirect_url;
      
      if (data.image instanceof File) payload.image = data.image;
      if (data.image_low instanceof File) payload.image_low = data.image_low;

      if (Object.keys(payload).length === 0) {
        showSnackbar('No changes detected.', 'info');
        setIsSubmitting(false);
        return;
      }

      await updateCarousel(carouselId, payload);
      showSnackbar('Carousel updated successfully!', 'success');
      router.push('/apps/carousel');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update carousel. Please try again.', 'error');
      console.error("Carousel update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading carousel data...</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField<CarouselFormValues>
                  name="title"
                  control={control}
                  label="Carousel Title"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField<CarouselFormValues>
                  name="redirect_url"
                  control={control}
                  label="Redirect URL (Optional)"
                  placeholder="https://example.com"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <FormTextField<CarouselFormValues>
              name="description"
              control={control}
              label="Description (Optional)"
              multiline
              rows={3}
            />
          </Grid>

          {/* <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.status} size="small">
              <InputLabel id="status-select-label">Status *</InputLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="status-select-label"
                    label="Status *"
                    sx={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      height: '36px',
                      '& .MuiOutlinedInput-input': {
                        paddingTop: '8px',
                        paddingBottom: '8px',
                      }
                    }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                )}
              />
              {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
            </FormControl>
          </Grid> */}

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Desktop Carousel Image</Typography>
            <FormFileUploadField
              name="image"
              control={control}
              label="New Desktop Image (Web: 1920 x 700 px)"
              helperText="Web: 1920 x 700 px. PNG, JPG, WebP. Max 5MB. Leave empty to keep existing."
              exactWidth={1920}
              exactHeight={700}
              defaultImage={initialCarouselData?.image_url}
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Mobile Carousel Image</Typography>
            <FormFileUploadField
              name="image_low"
              control={control}
              label="New Mobile Image (Mobile: 450 x 385 px)"
              helperText="Mobile: 450 x 385 px. PNG, JPG, WebP. Max 5MB. Leave empty to keep existing."
              exactWidth={450}
              exactHeight={385}
              defaultImage={initialCarouselData?.image_url_low}
            />
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <AppButton
              type="submit"
              label={isSubmitting ? 'Updating Carousel...' : 'Update Carousel'}
              loading={isSubmitting}
              disabled={isSubmitting || !isValid || Object.keys(dirtyFields).length === 0}
              fullWidth
              variant="contained"
            />
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default EditCarouselForm; 