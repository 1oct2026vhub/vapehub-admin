'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { createOrUpdateSeo, SeoData, SeoListItem } from '@/services/apiSeo';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';

interface SeoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: SeoListItem | null;
}

const seoSchema = z.object({
  entityType: z.enum(['page', 'product', 'category', 'brand', 'blog_post', 'blog_category']),
  entityId: z.string().min(1, 'Entity ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  focusKeyword: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  canonicalUrl: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
  ogImage: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
  noIndex: z.boolean().default(false),
});

type SeoFormType = z.infer<typeof seoSchema>;

function SeoFormModal({ open, onClose, onSaved, initialData }: SeoFormModalProps) {
  const { showSnackbar } = useSnackbar();
  const isEditMode = !!initialData;

  const { control, handleSubmit, reset } = useForm<SeoFormType>({
    resolver: zodResolver(seoSchema),
  });

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        reset(initialData);
      } else {
        reset({
          entityType: 'page',
          entityId: '',
          title: '',
          description: '',
          focusKeyword: '',
          slug: '',
          canonicalUrl: '',
          ogImage: '',
          noIndex: false,
        });
      }
    }
  }, [open, isEditMode, initialData, reset]);


  const onSubmit = async (data: SeoFormType) => {
    try {
      const payload: Partial<SeoData> = { ...data };
      const response = await createOrUpdateSeo(payload);
      showSnackbar(response.message, 'success');
      onSaved();
      handleClose();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save SEO data', 'error');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit SEO' : 'Create SEO'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="entityType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Entity Type</InputLabel>
                    <Select {...field} label="Entity Type" disabled={isEditMode}>
                      <MenuItem value="page">Page</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                      <MenuItem value="brand">Brand</MenuItem>
                      <MenuItem value="blog_post">Blog Post</MenuItem>
                      <MenuItem value="blog_category">Blog Category</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="entityId" control={control} label="Entity ID" required fullWidth disabled={isEditMode} />
            </Grid>
            <Grid item xs={12}>
              <FormTextField name="title" control={control} label="Meta Title" required fullWidth />
            </Grid>
            <Grid item xs={12}>
                <FormTextField name="slug" label="Slug" control={control} required fullWidth />
            </Grid>
            <Grid item xs={12}>
              <FormTextField name="description" label="Meta Description" control={control} fullWidth multiline rows={3} />
            </Grid>
            <Grid item xs={12}>
              <FormTextField name="focusKeyword" label="Focus Keyword" control={control} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <FormTextField name="canonicalUrl" label="Canonical URL" control={control} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <FormTextField name="ogImage" label="OG Image URL" control={control} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Controller name="noIndex" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />}
                label="No Index"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">{isEditMode ? 'Save Changes' : 'Create'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SeoFormModal; 