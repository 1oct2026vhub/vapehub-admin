import FormTextField from '@/components/Shared/FormTextField';
import { useProductForm } from '../ProductFormContext';
import { Grid, FormControlLabel, Switch, Box, Typography } from '@mui/material';
import { Controller } from 'react-hook-form';
import AppButton from '@/components/Shared/AppButton';
import { useEffect, useState, useCallback } from 'react';
import { createOrUpdateSeo, getSeo, SeoData, SeoHealth } from '@/services/apiSeo';
import { useSnackbar } from '@/contexts/SnackbarContext';
import SeoHealthIndicator from './SeoHealthIndicator';

function SeoTab() {
  const { control, formData, handleSubmit, updateFormData } = useProductForm();
  const { showSnackbar } = useSnackbar();
  const isEditing = !!formData.seo?.id;
  const [seoHealth, setSeoHealth] = useState<SeoHealth | null>(null);

  const fetchSeoData = useCallback(async () => {
    if (formData.productId) {
      try {
        const response = await getSeo('product', String(formData.productId));
        if (response.data) {
          if (response.data.seoMeta) {
            updateFormData({ seo: response.data.seoMeta });
          }
          if (response.data.health) {
            setSeoHealth(response.data.health);
          }
        }
      } catch (error) {
        console.log("No existing SEO data found.");
        setSeoHealth(null);
      }
    }
  }, [formData.productId, updateFormData]);

  useEffect(() => {
    fetchSeoData();
  }, [fetchSeoData]);


  const onSubmit = async (data: { seo: SeoData }) => {
    const { seo } = data;
    const payload: Partial<SeoData> = {
      entityType: 'product',
      entityId: String(formData.productId),
      title: seo.title,
      description: seo.description,
      focusKeyword: seo.focusKeyword,
      slug: formData.slug,
      canonicalUrl: seo.canonicalUrl,
      ogImage: seo.ogImage,
      noIndex: seo.noIndex,
    };

    if (!payload.slug) {
      showSnackbar('Product slug is missing. Please complete basic info first.', 'error');
      return;
    }

    try {
      const response = await createOrUpdateSeo(payload);
      showSnackbar(response.message, 'success');
      fetchSeoData();
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save SEO data', 'error');
    }
  };

  return (
    <Box sx={{ bgcolor: 'white', p: 5, borderRadius: '8px' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        {isEditing ? 'Edit SEO' : 'Create SEO'}
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {/* <Grid item xs={12} md={6}>
              <FormTextField name="seo.entityType" label="Entity Type" control={control} fullWidth  />
          </Grid>
          <Grid item xs={12} md={6}>
              <FormTextField name="name" label="Entity Name" control={control} fullWidth  />
         </Grid> */}
          <Grid item xs={12}>
            <FormTextField name="seo.title" label="Meta Title" control={control} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <FormTextField name="seo.description" label="Meta Description" control={control} fullWidth multiline rows={4} />
          </Grid>
          <Grid item xs={12}>
            <FormTextField name="seo.focusKeyword" label="Focus Keyword" control={control} fullWidth />
          </Grid>
          {/* <Grid item xs={12}>
            <FormTextField name="seo.slug" label="Slug" control={control} fullWidth />
         </Grid> */}
          <Grid item xs={12}>
            <FormTextField name="seo.canonicalUrl" label="Canonical URL" control={control} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <FormTextField name="seo.ogImage" label="OG Image URL" control={control} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Controller
                  name="seo.noIndex"
                  control={control}
                  render={({ field }) => <Switch {...field} checked={!!field.value} />}
                />
              }
              label="No Index"
            />
          </Grid>
          <Grid item xs={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <AppButton label={isEditing ? 'Update' : 'Save'} type="submit" />
          </Grid>
        </Grid>
      </form>
      <SeoHealthIndicator health={seoHealth} />
    </Box>
  );
}

export default SeoTab; 