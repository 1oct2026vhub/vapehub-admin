'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createBanner, type CreateBannerPayload } from '@/services/apiBanner';
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
import { validateDesktopBannerImage, validateMobileBannerImage } from "@/utils/imageUtils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const bannerFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  alt_text: z.string().optional(),
  alt_text_mobile: z.string().optional(),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required' }),
  redirect_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
  display_order: z.coerce.number().int().min(0, 'Display order must be 0 or greater').optional(),
  image: z
    .instanceof(File, { message: 'Desktop banner image is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .png, .jpg, .jpeg, .webp formats are accepted.'
    )
    .superRefine(async (file, ctx) => {
      if (!file) return;
      const { valid, message } = await validateDesktopBannerImage(file);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Desktop image must be square (450×450 to 700×700 px) or rectangle (1920×700 px).',
        });
      }
    }),
  image_low: z
    .instanceof(File, { message: 'Mobile banner image is required' })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Only .png, .jpg, .jpeg, .webp formats are accepted.'
    )
    .superRefine(async (file, ctx) => {
      if (!file) return;
      const { valid, message } = await validateMobileBannerImage(file);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Square images: 394×394 px. Rectangle images: 394×221 px.',
        });
      }
    }),
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

const CreateBannerForm: React.FC = () => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      alt_text: '',
      alt_text_mobile: '',
      status: 'active',
      redirect_url: '',
    },
  });

  const imageValue = watch("image");
  const imageLowValue = watch("image_low");

  const onSubmit = async (data: BannerFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateBannerPayload = {
        title: data.title,
        status: data.status,
        image: data.image,
        image_low: data.image_low,
        description: data.description,
        alt_text: data.alt_text,
        alt_text_mobile: data.alt_text_mobile,
        redirect_url: data.redirect_url,
      };
      await createBanner(payload);
      showSnackbar('Banner created successfully!', 'success');
      router.push('/apps/banner');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to create banner. Please try again.', 'error');
      console.error("Banner creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper className='mt-6' sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Create New Banner
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField<BannerFormValues>
                  name="title"
                  control={control}
                  label="Banner Title"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField<BannerFormValues>
                  name="redirect_url"
                  control={control}
                  label="Redirect URL (Optional)"
                  placeholder="https://example.com"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <FormTextField<BannerFormValues>
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
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Desktop Banner Image</Typography>
            <FormFileUploadField
              name="image"
              control={control}
              label="Desktop Image"
              helperText="Square images: 450×450 to 700×700 px (same dimensions). Rectangle images: 1920×700 px. PNG, JPG, WebP. Max 5MB."
              required
            />
          </Grid>

          {(imageValue instanceof File) && (
            <Grid item xs={12}>
              <FormTextField<BannerFormValues>
                name="alt_text"
                control={control}
                label="Alt Text (Optional)"
              />
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 1 }}>
             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Mobile Banner Image</Typography>
            <FormFileUploadField
              name="image_low"
              control={control}
              label="Mobile Image"
              helperText="Square images: 394×394 px (same dimensions). Rectangle images: 394×221px. PNG, JPG, WebP. Max 5MB."
              required
              exactWidth={394}
              exactHeight={221}
            />
          </Grid>

          {(imageLowValue instanceof File) && (
            <Grid item xs={12}>
              <FormTextField<BannerFormValues>
                name="alt_text_mobile"
                control={control}
                label="Alt Text Mobile (Optional)"
              />
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <AppButton
              type="submit"
              label={isSubmitting ? 'Creating Banner...' : 'Create Banner'}
              loading={isSubmitting}
              disabled={isSubmitting || !isValid} // Disable if not valid OR submitting
              fullWidth
              variant="contained"
            />
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default CreateBannerForm; 