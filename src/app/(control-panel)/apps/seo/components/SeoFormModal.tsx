'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
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
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
} from '@mui/material';
import { createOrUpdateSeo, SeoData, SeoListItem } from '@/services/apiSeo';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';
import { listProducts, getProduct } from '@/services/apiProduct';
import { listProductBrand } from '@/services/apiProductBrand';
import { listProductCategory } from '@/services/apiProductCategory';
import { getBlogPosts, getBlogCategories } from '@/services/apiBlog';
import { useDebounce } from '@/hooks/useDebounce';
import SeoHealthIndicator from './SeoHealthIndicator';
import AppButton from '@/components/Shared/AppButton';

interface SeoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: SeoListItem | null;
}

const seoSchema = z
  .object({
    entityType: z.enum(['page', 'product', 'category', 'brand', 'blog_post', 'blog_category']),
    entityId: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    focusKeyword: z.string().min(1, 'Focus Keyword is required'),
    slug: z.string().min(1, 'Slug is required'),
    canonicalUrl: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
    ogImage: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
    noIndex: z.boolean().default(false),
  })
  .refine((data) => {
    if (data.entityType !== 'page') {
      return !!data.entityId;
    }
    return true;
  }, {
    message: 'Entity Name is required',
    path: ['entityId'],
  });

type SeoFormType = z.infer<typeof seoSchema>;

function SeoFormModal({ open, onClose, onSaved, initialData }: SeoFormModalProps) {
  const { showSnackbar } = useSnackbar();
  const isEditMode = !!initialData;

  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { control, handleSubmit, reset, watch, setValue, formState, trigger } = useForm<SeoFormType>({
    resolver: zodResolver(seoSchema),
    mode: 'all',
  });

  const entityType = watch('entityType');
  const slug = watch('slug');

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        // Carefully select only the form-relevant fields
        const editData: SeoFormType = {
          entityType: initialData.entityType as SeoFormType['entityType'],
          entityId: initialData.entityId ? String(initialData.entityId) : '',
          title: initialData.title,
          description: initialData.description || '',
          focusKeyword: initialData.focusKeyword,
          slug: initialData.slug,
          canonicalUrl: initialData.canonicalUrl || '',
          ogImage: initialData.ogImage || '',
          noIndex: initialData.noIndex,
        };
        reset(editData);
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

  useEffect(() => {
    if (open && isEditMode && initialData && !initialData.entity) {
      const fetchEntityDetails = async () => {
        if (!initialData.entityType || initialData.entityType === 'page' || !initialData.entityId) return;

        let entityData: any = null;
        try {
          const entityIdNum = parseInt(initialData.entityId, 10);
          if (isNaN(entityIdNum)) return;

          switch (initialData.entityType) {
            case 'product':
              entityData = (await getProduct(entityIdNum))?.data;
              break;
            case 'brand':
              entityData = (await listProductBrand({ limit: 1000 }))?.data?.brands.find((b: any) => b.id === entityIdNum);
              break;
            case 'category':
              entityData = (await listProductCategory({ limit: 1000 }))?.data?.categories.find((c: any) => c.id === entityIdNum);
              break;
            case 'blog_post':
              entityData = (await getBlogPosts({ limit: 1000 }))?.data?.blogs.find((p: any) => p.id === entityIdNum);
              break;
            case 'blog_category':
              entityData = (await getBlogCategories({ limit: 1000 }))?.data?.categories.find((c: any) => c.id === entityIdNum);
              break;
          }

          if (entityData) {
            const updatedInitialData = { ...initialData, entity: entityData };
            reset(updatedInitialData);
          }
        } catch (error) {
          console.error(`Failed to fetch details for ${initialData.entityType}:`, error);
        }
      };
      fetchEntityDetails();
    }
  }, [open, isEditMode, initialData, reset]);

  useEffect(() => {
    setValue('entityId', '', { shouldValidate: true });
  }, [entityType, setValue]);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!entityType || entityType === 'page' || isEditMode) {
        setEntities([]);
        return;
      }

      setLoadingEntities(true);
      let response: any;
      let fetchedEntities: any[] = [];
      const params: any = { limit: 50 };

      if (debouncedSearch) {
        if (entityType === 'product') {
          params.keyword = debouncedSearch;
        } else {
          params.search = debouncedSearch;
          if (entityType !== 'blog_post' && entityType !== 'blog_category') {
            params.search_only_name = true;
          }
        }
      }

      try {
        switch (entityType) {
          case 'brand':
            response = await listProductBrand(params);
            fetchedEntities = response?.data?.brands || [];
            break;
          case 'category':
            response = await listProductCategory(params);
            fetchedEntities = response?.data?.categories || [];
            break;
          case 'product':
            response = await listProducts(params);
            fetchedEntities = response?.data?.products || [];
            break;
          case 'blog_post':
            response = await getBlogPosts(params);
            fetchedEntities = response?.data?.blogs || [];
            break;
          case 'blog_category':
            response = await getBlogCategories(params);
            fetchedEntities = response?.data?.categories || [];
            break;
        }
        setEntities(fetchedEntities);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
        setEntities([]);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [entityType, debouncedSearch, showSnackbar, isEditMode]);

  useEffect(() => {
    if (!slug || formState.dirtyFields.canonicalUrl) return;

    if (isEditMode && initialData) {
      const originalCanonical = initialData.canonicalUrl;
      if (originalCanonical && originalCanonical !== `${process.env.NEXT_PUBLIC_WEB_URL}/${initialData.slug}`) return;
    }

    const newCanonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${slug}`;
    setValue('canonicalUrl', newCanonicalUrl, { shouldValidate: true });
  }, [slug, setValue, formState.dirtyFields.canonicalUrl, isEditMode, initialData]);

  const onSubmit = async (data: SeoFormType) => {
    try {
      // Log the entire initial data and current form data for debugging
      console.log('🔍 [SEO FORM] Initial SEO Data:', initialData);
      console.log('📝 [SEO FORM] Current Form Data:', data);

      const payload: Partial<SeoData> = {
        entityType: data.entityType,
        title: data.title,
        description: data.description,
        focusKeyword: data.focusKeyword,
        slug: data.slug,
        canonicalUrl: data.canonicalUrl,
        noIndex: data.noIndex,
        ogImage: data.ogImage || '', // Always include ogImage, even if empty
      };

      console.log('🚀 [SEO FORM] Final Payload being sent:', payload);

      // Add entityId for non-page types (both create and edit modes)
      if (data.entityType !== 'page' && data.entityId) {
        payload.entityId = data.entityId;
      }  
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
    setSearch('');
    setEntities([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isEditMode ? 'lg' : 'md'}
      fullWidth={isEditMode}
      PaperProps={{ sx: { backgroundColor: 'white' } }}
    >
      <DialogTitle>{isEditMode ? 'Edit SEO Entry' : 'Create New SEO Entry'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={isEditMode ? 7 : 12}>
              <Grid container spacing={2}>
                {!isEditMode && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="entityType"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Entity Type</InputLabel>
                            <Select {...field} label="Entity Type" sx={{ backgroundColor: 'white' }}>
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
                    {entityType !== 'page' && (
                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="entityId"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              options={entities}
                              getOptionLabel={(option) => option.name || option.title || ''}
                              value={entities.find((e) => String(e.id) === field.value) || null}
                              onChange={async (event, newValue) => {
                                field.onChange(newValue ? String(newValue.id) : '');
                                await trigger('entityId');

                                if (!newValue) {
                                  setValue('slug', '', { shouldValidate: true });
                                  setValue('ogImage', '', { shouldValidate: true });
                                  return;
                                }
                                
                                setValue('slug', newValue.slug || '', { shouldValidate: true });

                                let imageUrl = '';
                                try {
                                  switch (entityType) {
                                    case 'brand':
                                    case 'category':
                                      imageUrl = newValue.logo_url || '';
                                      break;
                                    case 'blog_post':
                                    case 'blog_category':
                                      imageUrl = newValue.image_url || '';
                                      break;
                                    case 'product':
                                      const response = await getProduct(newValue.id);
                                      const primaryImage = response.data?.ProductImages?.find((img: any) => img.is_primary);
                                      imageUrl = primaryImage?.image_url || '';
                                      break;
                                  }
                                } catch (e) {
                                  showSnackbar(`Could not fetch image for ${entityType}`, 'error');
                                }
                                setValue('ogImage', imageUrl, { shouldValidate: true });
                              }}
                              onInputChange={(event, newInputValue) => {
                                setSearch(newInputValue);
                              }}
                              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                              filterOptions={(x) => x}
                              loading={loadingEntities}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Entity"
                                  fullWidth
                                  size="small"
                                  error={!!formState.errors.entityId}
                                  helperText={formState.errors.entityId?.message}
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                      <>
                                        {loadingEntities ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                  }}
                                />
                              )}
                            />
                          )}
                        />
                      </Grid>
                    )}
                  </>
                )}
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
                {entityType !== 'page' && (
                  <Grid item xs={12}>
                    <FormTextField name="ogImage" label="OG Image URL" control={control} fullWidth />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Controller name="noIndex" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />}
                    label="No Index"
                  />
                </Grid>
              </Grid>
            </Grid>
            {isEditMode && initialData?.health && (
              <Grid item xs={12} md={5}>
                <Box sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 2, height: '100%' }}>
                  <SeoHealthIndicator health={initialData.health} />
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <AppButton
            type="submit"
            label={isEditMode ? 'Update' : 'Create'}
            loading={formState.isSubmitting}
            disabled={formState.isSubmitting}
          />
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SeoFormModal;
