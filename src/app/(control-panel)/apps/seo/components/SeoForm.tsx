'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Grid, FormControlLabel, Switch, Typography } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import { createOrUpdateSeo, getSeo, SeoData, SeoHealth } from '@/services/apiSeo';
import { useSnackbar } from '@/contexts/SnackbarContext';
import SeoHealthIndicator from './SeoHealthIndicator';

interface SeoFormProps {
  entityType: 'product' | 'page' | 'brand' | 'category' | 'blog_post' | 'blog_category';
  entityId: string | number;
  entityName: string;
  entitySlug?: string;
  fullWidth?: boolean;
}

function SeoForm({ entityType, entityId, entityName, entitySlug, fullWidth = false }: SeoFormProps) {
  const { showSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);
  const [seoHealth, setSeoHealth] = useState<SeoHealth | null>(null);

  const { control, handleSubmit, reset, setValue, formState, getValues } = useForm<SeoData>({
    defaultValues: {
      title: '',
      description: '',
      focusKeyword: '',
      canonicalUrl: '',
      ogImage: '',
      noIndex: false,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (entitySlug) {
      const currentCanonicalUrl = getValues('canonicalUrl');
      if (!formState.dirtyFields.canonicalUrl && !currentCanonicalUrl) {
        const newCanonicalUrl = `https://vapehub.devateam.com/${entitySlug}`;
        setValue('canonicalUrl', newCanonicalUrl, { shouldValidate: true });
      }
    }
  }, [entitySlug, setValue, getValues, formState.dirtyFields.canonicalUrl]);

  const fetchSeoData = useCallback(async () => {
    if (entityId) {
      try {
        const response = await getSeo(entityType, String(entityId));
        if (response.data) {
          if (response.data.seoMeta) {
            const seoMeta = response.data.seoMeta;
            if (!seoMeta.canonicalUrl && entitySlug) {
              seoMeta.canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${entitySlug}`;
            }
            reset(seoMeta);
            setIsEditing(true);
          }
          if (response.data.health) {
            setSeoHealth(response.data.health);
          }
        }
      } catch (error) {
        console.log("No existing SEO data found.");
        setIsEditing(false);
        setSeoHealth(null);
      }
    }
  }, [entityId, entityType, reset, entitySlug]);

  useEffect(() => {
    fetchSeoData();
  }, [fetchSeoData]);

  const onSubmit = async (data: SeoData) => {
    const payload: Partial<SeoData> = {
        entityType,
        entityId: String(entityId),
        title: data.title,
        description: data.description,
        focusKeyword: data.focusKeyword,
        slug: entitySlug,
        canonicalUrl: data.canonicalUrl,
        ogImage: data.ogImage,
        noIndex: data.noIndex,
    };

    if (!payload.slug && entityType !== 'page') {
      showSnackbar('Slug is missing. Please complete basic info first.', 'error');
      return;
    }

    try {
      const response = await createOrUpdateSeo(payload);
      showSnackbar(response.message, 'success');
      fetchSeoData(); // Refresh data after save
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save SEO data', 'error');
    }
  };

  return (
    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: '8px' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        {isEditing ? `Edit SEO` : `Create SEO`}
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={fullWidth ? 12 : 7}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormTextField name="title" label="Meta Title" control={control} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <FormTextField name="description" label="Meta Description" control={control} fullWidth multiline rows={4} />
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
                  control={<Controller name="noIndex" control={control} render={({ field }) => <Switch {...field} checked={!!field.value} />} />}
                  label="No Index"
                />
              </Grid>
              <Grid item xs={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <AppButton label={isEditing ? 'Update' : 'Save'} type="submit" />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={fullWidth ? 12 : 5}>
            {seoHealth && <SeoHealthIndicator health={seoHealth} />}
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default SeoForm; 