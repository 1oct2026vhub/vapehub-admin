'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createCarousel } from '@/services/apiCarousel';
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
  FormHelperText
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { validateImageDimensions } from "@/utils/imageUtils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const carouselFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  alt_text: z.string().optional(),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required' }),
  redirect_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  image: z
    .instanceof(File, { message: 'Desktop carousel image is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .png, .jpg, .jpeg, .webp formats are accepted.'
    )
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
    .instanceof(File, { message: 'Mobile carousel image is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .png, .jpg, .jpeg, .webp formats are accepted.'
    )
    .superRefine(async (file, ctx) => {
      if (!file) return;
      const { valid, message } = await validateImageDimensions(file, 450, 450);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Mobile image dimensions must be 450x450px.',
        });
      }
    }),
});

type CarouselFormValues = z.infer<typeof carouselFormSchema>;

const CreateCarouselForm: React.FC = () => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CarouselFormValues>({
    resolver: zodResolver(carouselFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      alt_text: '',
      redirect_url: '',
      status: 'active',
    },
  });

  const imageValue = watch("image");

  const onSubmit = async (data: CarouselFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('status', data.status);
      formData.append('image', data.image);
      formData.append('image_low', data.image_low);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.alt_text) {
        formData.append('alt_text', data.alt_text);
      }
      if (data.redirect_url) {
        formData.append('redirect_url', data.redirect_url);
      }

      await createCarousel(formData);
      showSnackbar('Carousel created successfully!', 'success');
      router.push('/apps/carousel');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to create carousel. Please try again.', 'error');
      console.error("Carousel creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Desktop Carousel Image</Typography>
            <FormFileUploadField
              name="image"
              control={control}
              label="Desktop Image (Web: 1920 x 700 px)"
              helperText="Web: 1920 x 700 px. PNG, JPG, WebP. Max 5MB."
              required
              exactWidth={1920}
              exactHeight={700}
            />
          </Grid>

          {(imageValue instanceof File) && (
            <Grid item xs={12}>
              <FormTextField<CarouselFormValues>
                name="alt_text"
                control={control}
                label="Alt Text (Optional)"
              />
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Mobile Carousel Image</Typography>
            <FormFileUploadField
              name="image_low"
              control={control}
              label="Mobile Image (Mobile: 450 x 450 px)"
              helperText="Mobile: 450 x 450 px. PNG, JPG, WebP. Max 5MB."
              required
              exactWidth={450}
              exactHeight={450}
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

          <Grid item xs={12} sx={{ mt: 2 }}>
            <AppButton
              type="submit"
              label={isSubmitting ? 'Creating Carousel...' : 'Create Carousel'}
              loading={isSubmitting}
              disabled={isSubmitting || !isValid}
              fullWidth
              variant="contained"
            />
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default CreateCarouselForm; 