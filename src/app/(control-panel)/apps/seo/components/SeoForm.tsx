'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Grid, FormControlLabel, Switch, Typography } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField';
import { createOrUpdateSeo, getSeo, SeoData, SeoHealth } from '@/services/apiSeo';
import { useSnackbar } from '@/contexts/SnackbarContext';
import SeoHealthIndicator from './SeoHealthIndicator';
import { getProduct } from '@/services/apiProduct';
import { brandDetails } from '@/services/apiProductBrand';
import { categoryDetails } from '@/services/apiProductCategory';
import { getBlogPost, getBlogCategory } from '@/services/apiBlog';
import { getDealById } from '@/services/apiDeals';

interface SeoFormProps {
  entityType: 'product' | 'page' | 'brand' | 'category' | 'blog_post' | 'blog_category' | 'deal';
  entityId: string | number;
  entityName: string;
  entitySlug?: string;
  fullWidth?: boolean;
}

const seoFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().nullable().optional(),
    focusKeyword: z.string().nullable().optional(),
    canonicalUrl: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.literal(''),
      z.null()
    ]).optional(),
    ogImage: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.literal(''),
      z.null()
    ]).optional(),
    noIndex: z.boolean().default(false),
});

type SeoFormType = z.infer<typeof seoFormSchema>;

function SeoForm({ entityType, entityId, entityName, entitySlug, fullWidth = false }: SeoFormProps) {
  const { showSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState(false);
  const [seoHealth, setSeoHealth] = useState<SeoHealth | null>(null);

  const { control, handleSubmit, reset, setValue, formState, getValues } = useForm<SeoFormType>({
    resolver: zodResolver(seoFormSchema),
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

  const fetchDefaultOgImage = useCallback(async () => {
    if (!entityId || entityType === 'page') return;

    try {
        let imageUrl = '';
        const currentOgImage = getValues('ogImage');

        if (formState.dirtyFields.ogImage || currentOgImage) return;

        switch (entityType) {
            case 'product': {
                const res = await getProduct(Number(entityId));
                const primaryImage = res.data?.ProductImages?.find((img: any) => img.is_primary);
                imageUrl = primaryImage?.image_url || '';
                break;
            }
            case 'brand': {
                const res = await brandDetails(Number(entityId) );
                imageUrl = res.data?.logo_url || '';
                break;
            }
            case 'category': {
                const res = await categoryDetails( Number(entityId));
                imageUrl = res.data?.logo_url || '';
                break;
            }
            case 'blog_post': {
                const res = await getBlogPost(Number(entityId));
                imageUrl = res.data?.image_url || '';
                break;
            }
            case 'blog_category': {
                const res = await getBlogCategory(Number(entityId));
                imageUrl = res.data?.image_url || '';
                break;
            }
            case 'deal': {
                const res = await getDealById(Number(entityId));
                imageUrl = res.data?.image_url || '';
                break;
            }
        }
        if (imageUrl) {
            setValue('ogImage', imageUrl, { shouldDirty: true, shouldValidate: true });
        }
    } catch (error) {
        console.error(`Failed to fetch default OG image for ${entityType} ${entityId}`, error);
    }
}, [entityId, entityType, setValue, getValues]);

  useEffect(() => {
    if (entitySlug) {
      const currentCanonicalUrl = getValues('canonicalUrl');
      if (!formState.dirtyFields.canonicalUrl && !currentCanonicalUrl) {
        const newCanonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${entitySlug}`;
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
          } else {
            fetchDefaultOgImage();
          }
          if (response.data.health) {
            setSeoHealth(response.data.health);
          }
        }
      } catch (error) {
        console.log("No existing SEO data found.");
        fetchDefaultOgImage();
        setIsEditing(false);
        setSeoHealth(null);
      }
    }
  }, [entityId, entityType, reset, entitySlug, fetchDefaultOgImage]);

  useEffect(() => {
    fetchSeoData();
  }, [fetchSeoData]);

  const onSubmit = async (data: SeoFormType) => {
    const payload: Partial<SeoData> = {
        ...data,
        entityType,
        entityId: String(entityId),
        slug: entitySlug,
        description: data.description || '',
        focusKeyword: data.focusKeyword || '',
        canonicalUrl: data.canonicalUrl || '',
        ogImage: data.ogImage || '',
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
                <FormTextField name="title" label="Meta Title" control={control} fullWidth required/>
              </Grid>
              <Grid item xs={12}>
                <FormTextField name="description" label="Meta Description" control={control} fullWidth multiline rows={4} />
              </Grid>
              <Grid item xs={12}>
                <FormTextField name="focusKeyword" label="Focus Keyword" control={control} fullWidth />
              </Grid>
              {/* <Grid item xs={12}>
                <FormTextField name="canonicalUrl" label="Canonical URL" control={control} fullWidth />
              </Grid> */}
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
                <AppButton
                  label={isEditing ? 'Update' : 'Save'}
                  type="submit"
                  loading={formState.isSubmitting}
                  disabled={formState.isSubmitting}
                />
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