'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import {
  updateBanner,
  getBannerDetails,
  type BannerItem,
  type UpdateBannerPayload,
} from '@/services/apiBanner';
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
import { validateDesktopBannerImage, validateMobileBannerImage } from "@/utils/imageUtils";

const MOBILE_BANNER_HELPER_TEXT =
  'Square: 450×450 px (display order 1). Rectangle: 361×274 px (display order 2–3). PNG, JPG, WebP. Max 5MB. Leave empty to keep existing.';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const optionalRedirectUrlSchema = z.string().refine(
  (value) => !value || value === '#' || z.string().url().safeParse(value).success,
  { message: 'Invalid URL format' },
);

// Schema for editing a banner
const bannerEditFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  alt_text: z.string().optional(),
  alt_text_mobile: z.string().optional(),
  status: z.enum(['active', 'inactive'], { required_error: 'Status is required' }),
  redirect_url: optionalRedirectUrlSchema.optional(),
  display_order: z.coerce.number().int().min(0, 'Display order must be 0 or greater').optional(),
  image: z
    .instanceof(File)
    .optional()
    .nullable()
    .superRefine(async (file, ctx) => {
      if (!file) return; // Only validate if a new file is provided
      const { valid, message } = await validateDesktopBannerImage(file);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Desktop image must be square (450×450 to 700×700 px) or rectangle (1920×700 px).',
        });
      }
    }),
  image_low: z
    .instanceof(File)
    .optional()
    .nullable()
    .superRefine(async (file, ctx) => {
      if (!file) return; // Only validate if a new file is provided
      const { valid, message } = await validateMobileBannerImage(file);
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message || 'Mobile image must be square 450×450 or rectangle 361×274 px.',
        });
      }
    }),
});

type BannerEditFormValues = z.infer<typeof bannerEditFormSchema>;

interface EditBannerFormProps {
  initialBannerData: BannerItem;
}

const EditBannerForm: React.FC<EditBannerFormProps> = ({ initialBannerData }) => {
  const router = useRouter();
  const params = useParams();
  const bannerId = Number(params.bannerId as string);
  const { showSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false); // For initial load, though data is passed as prop

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, dirtyFields }, // track dirtyFields for selective update
    watch,
    setValue,
    reset, // to reset form with initial data
  } = useForm<BannerEditFormValues>({
    resolver: zodResolver(bannerEditFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      alt_text: '',
      alt_text_mobile: '',
      status: 'active',
      redirect_url: '',
      image: undefined,
      image_low: undefined,
    },
  });

  const imageValue = watch("image");
  const imageLowValue = watch("image_low");
  const hasNewImage = imageValue instanceof File || imageLowValue instanceof File;
  const hasChanges = Object.keys(dirtyFields).length > 0 || hasNewImage;

  useEffect(() => {
    if (initialBannerData) {
      reset({
        title: initialBannerData.title || '',
        description: initialBannerData.description || '',
        alt_text: (initialBannerData as any).alt_text || '',
        alt_text_mobile: (initialBannerData as any).alt_text_mobile || '',
        status: initialBannerData.status || 'active',
        redirect_url: initialBannerData.redirect_url || '',
      });
    }
  }, [initialBannerData, reset]);

  const onSubmit = async (data: BannerEditFormValues) => {
    if (!bannerId) {
      showSnackbar('Banner ID is missing. Cannot update.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      // Construct payload only with dirty fields to avoid sending unchanged data, especially images
      const payload: UpdateBannerPayload = {};
      if (dirtyFields.title) payload.title = data.title;
      if (dirtyFields.description) payload.description = data.description;
      if (dirtyFields.alt_text) payload.alt_text = data.alt_text;
      if (dirtyFields.alt_text_mobile) payload.alt_text_mobile = data.alt_text_mobile;
      if (dirtyFields.status) payload.status = data.status;
      if (dirtyFields.redirect_url) payload.redirect_url = data.redirect_url;
      
      // For images, only include if a new file was selected (data.image will be a File object)
      if (data.image instanceof File) payload.image = data.image;
      if (data.image_low instanceof File) payload.image_low = data.image_low;

      if (Object.keys(payload).length === 0) {
        showSnackbar('No changes detected.', 'info');
        setIsSubmitting(false);
        return;
      }

      await updateBanner(bannerId, payload);
      showSnackbar('Banner updated successfully!', 'success');
      router.push('/apps/banner'); 
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to update banner. Please try again.', 'error');
      console.error("Banner update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingData) {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography sx={{ml: 2}}>Loading banner data...</Typography>
        </Box>
    );
  }

  return (
    <Paper className='mt-6' sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
      {/* <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Edit Banner (ID: {bannerId})
      </Typography> */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          {/* Title and Redirect URL in one row */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormTextField<BannerEditFormValues>
                  name="title"
                  control={control}
                  label="Banner Title"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormTextField<BannerEditFormValues>
                  name="redirect_url"
                  control={control}
                  label="Redirect URL (Optional)"
                  placeholder="https://example.com"
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <FormTextField<BannerEditFormValues>
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
              name="image" // This name in form state will hold the new File if selected
              control={control}
              label="New Desktop Image"
              helperText="Square images: 450×450 to 700×700 px (same dimensions). Rectangle images: 1920×700 px. PNG, JPG, WebP. Max 5MB. Leave empty to keep existing."
              defaultImage={initialBannerData?.image_url} // Show current image
            />
          </Grid>

          {((imageValue instanceof File) || initialBannerData?.image_url) && (
            <Grid item xs={12}>
              <FormTextField<BannerEditFormValues>
                name="alt_text"
                control={control}
                label="Alt Text (Optional)"
              />
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 1 }}>
             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>Mobile Banner Image</Typography>
            <FormFileUploadField
              name="image_low" // This name in form state will hold the new File if selected
              control={control}
              label="New Mobile Image"
              helperText={MOBILE_BANNER_HELPER_TEXT}
              defaultImage={initialBannerData?.image_url_low} // Show current image
            />
          </Grid>

          {((imageLowValue instanceof File) || initialBannerData?.image_url_low) && (
            <Grid item xs={12}>
              <FormTextField<BannerEditFormValues>
                name="alt_text_mobile"
                control={control}
                label="Alt Text Mobile (Optional)"
              />
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 2 }}>
            <AppButton
              type="submit"
              label={isSubmitting ? 'Updating Banner...' : 'Update Banner'}
              loading={isSubmitting}
              disabled={isSubmitting || !isValid || !hasChanges}
              fullWidth
              variant="contained"
            />
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default EditBannerForm; 