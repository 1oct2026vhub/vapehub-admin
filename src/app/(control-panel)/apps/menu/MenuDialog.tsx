'use client';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  TextField,
  Box,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { type MenuItem as MenuDataType, createMenu, updateMenu } from '@/services/apiMenu';
import FormTextField from '@/components/Shared/FormTextField'; // Assuming path
import { useSnackbar } from '@/contexts/SnackbarContext';
import { listProducts } from '@/services/apiProduct';
import { listProductBrand } from '@/services/apiProductBrand';
import { listProductCategory } from '@/services/apiProductCategory';
import { getBlogPosts, type BlogPost } from '@/services/apiBlog';
import { useDebounce } from '@/hooks/useDebounce';
import { getDeals, type Deal } from '@/services/apiDeals';
import AppButton from '@/components/Shared/AppButton';

const menuSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    entity_type: z.enum(['brand', 'category', 'product', 'blog', 'page', 'deal']).optional().nullable(),
    entity_id: z.preprocess((val) => (val === '' ? null : val), z.coerce.number().optional().nullable()),
    original: z.string().optional().nullable(),
    menu_parent: z.number().optional().nullable(),
    show_image: z.boolean().optional(),
    hide_text: z.boolean().optional(),
    hide_mobile_view: z.boolean().optional(),
    hide_desktop_view: z.boolean().optional(),
    // icon_position: z.enum(['left', 'right']).optional(),
    // icon: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.entity_type === 'page') {
        return !!data.original && data.original.length > 0;
      }
      return true;
    },
    {
      message: 'Original URL is required for page entity type',
      path: ['original'],
    },
  )
  .refine(
    (data) => {
      if (data.entity_type && data.entity_type !== 'page') {
        return data.entity_id != null;
      }
      return true;
    },
    {
      message: 'Entity ID is required for this entity type',
      path: ['entity_id'],
    },
  );

type MenuFormValues = z.infer<typeof menuSchema>;

interface MenuDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  menuItem?: MenuDataType | null;
  parentId?: number | null;
}

const MenuDialog: React.FC<MenuDialogProps> = ({ open, onClose, onSave, menuItem, parentId }) => {
  const isEditing = !!menuItem;
  const { showSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      label: '',
      entity_type: 'page',
      entity_id: undefined,
      original: '',
      menu_parent: parentId || undefined,
      show_image: false,
      hide_text: false,
      hide_mobile_view: false,
      hide_desktop_view: false,
      // icon_position: 'left',
      // icon: '',
    },
  });

  const entityType = watch('entity_type');
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const fetchEntities = async () => {
      if (!entityType || entityType === 'page') {
        setEntities([]);
        return;
      }

      setLoading(true);

      let response: any;
      let fetchedEntities: any[] = [];
      // const params: any = { limit: 1000 };
      const params: any = {};

      if (debouncedSearch) {
        if (entityType === 'product') {
          params.keyword = debouncedSearch;
        } else {
          params.search = debouncedSearch;
          if (entityType !== 'blog') {
            params.search_only_name = true;
          }
        }
      }

      try {
        switch (entityType) {
          case 'brand':
            response = await listProductBrand(params);
            fetchedEntities = response?.data?.brands || response?.data || response || [];
            break;
          case 'category':
            response = await listProductCategory(params);
            fetchedEntities = response?.data?.categories || response?.data || response || [];
            break;
          case 'product':
            response = await listProducts(params);
            fetchedEntities = response?.data?.products || response?.data || response || [];
            break;
          case 'blog':
            response = await getBlogPosts(params);
            fetchedEntities = response?.data?.blogs || [];
            break;
          case 'deal':
            response = await getDeals(params);
            fetchedEntities = response?.data?.deals || [];
            break;
          default:
            fetchedEntities = [];
            break;
        }
        setEntities(fetchedEntities);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
        showSnackbar('Failed to fetch entities', 'error');
        setEntities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [entityType, debouncedSearch, showSnackbar]);

  useEffect(() => {
    if (dirtyFields.entity_type) {
        if (entityType === 'page') {
            setValue('entity_id', null, { shouldValidate: true });
        } else {
            setValue('original', '', { shouldValidate: true });
            setValue('entity_id', undefined, { shouldValidate: true });
        }
    }
  }, [entityType, setValue, dirtyFields.entity_type]);

  // Fetch entity data when editing
  useEffect(() => {
    const fetchEntityData = async () => {
      if (!menuItem || !menuItem.entity_id || !menuItem.entity_type || menuItem.entity_type === 'page') {
        return;
      }

      setLoading(true);
      let fetchedEntity: any = null;

      try {
        // First, try to fetch with default parameters (first 10 results)
        switch (menuItem.entity_type) {
          case 'brand': {
            const defaultResponse = await listProductBrand({});
            fetchedEntity = defaultResponse?.data?.brands?.find((brand: any) => brand.id === menuItem.entity_id) || null;
            
            // If not found, try searching by name
            if (!fetchedEntity) {
              const searchResponse = await listProductBrand({ 
                search: menuItem.label, 
                search_only_name: true 
              });
              fetchedEntity = searchResponse?.data?.brands?.find((brand: any) => brand.id === menuItem.entity_id) || null;
            }
            break;
          }
          case 'category': {
            const defaultResponse = await listProductCategory({});
            fetchedEntity = defaultResponse?.data?.categories?.find((category: any) => category.id === menuItem.entity_id) || null;
            
            // If not found, try searching by name
            if (!fetchedEntity) {
              const searchResponse = await listProductCategory({ 
                search: menuItem.label, 
                search_only_name: true 
              });
              fetchedEntity = searchResponse?.data?.categories?.find((category: any) => category.id === menuItem.entity_id) || null;
            }
            break;
          }
          case 'product': {
            const defaultResponse = await listProducts({});
            fetchedEntity = defaultResponse?.data?.products?.find((product: any) => product.id === menuItem.entity_id) || null;
            
            // If not found, try searching by name
            if (!fetchedEntity) {
              const searchResponse = await listProducts({ 
                keyword: menuItem.label 
              });
              fetchedEntity = searchResponse?.data?.products?.find((product: any) => product.id === menuItem.entity_id) || null;
            }
            
            // If still not found, fetch specifically by ID
            if (!fetchedEntity) {
              const specificResponse = await listProducts({ ids: [menuItem.entity_id] });
              fetchedEntity = specificResponse?.data?.products?.[0] || null;
            }
            break;
          }
          case 'blog': {
            const defaultResponse = await getBlogPosts({});
            fetchedEntity = defaultResponse?.data?.blogs?.find((blog: BlogPost) => blog.id === menuItem.entity_id) || null;
            
            // If not found, try searching by name/title
            if (!fetchedEntity) {
              const searchResponse = await getBlogPosts({ 
                search: menuItem.label 
              });
              fetchedEntity = searchResponse?.data?.blogs?.find((blog: BlogPost) => blog.id === menuItem.entity_id) || null;
            }
            break;
          }
          case 'deal': {
            const defaultResponse = await getDeals({});
            fetchedEntity = defaultResponse?.data?.deals?.find((deal: Deal) => deal.id === menuItem.entity_id) || null;
            
            // If not found, try searching by name
            if (!fetchedEntity) {
              const searchResponse = await getDeals({ 
                search: menuItem.label 
              });
              fetchedEntity = searchResponse?.data?.deals?.find((deal: Deal) => deal.id === menuItem.entity_id) || null;
            }
            break;
          }
          default:
            fetchedEntity = null;
        }

        if (fetchedEntity) {
          setEntities([fetchedEntity]);
          // Ensure the entity ID is set correctly
          setValue('entity_id', fetchedEntity.id, { shouldValidate: true });
        } else {
          // If no entity found, show an error
          showSnackbar(`Could not find ${menuItem.entity_type} with ID ${menuItem.entity_id}`, 'error');
        }
      } catch (error) {
        console.error('Failed to fetch entity data:', error);
        showSnackbar('Failed to fetch entity data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (open && menuItem) {
      fetchEntityData();
    }
  }, [menuItem, open, showSnackbar, setValue]);

  useEffect(() => {
    if (open) {
      if (menuItem) {
        reset({
          label: menuItem.label,
          entity_type: menuItem.entity_type,
          entity_id: menuItem.entity_id,
          original: menuItem.original,
          menu_parent: menuItem.menu_parent,
          show_image: menuItem.show_image,
          hide_text: menuItem.hide_text,
          hide_mobile_view: menuItem.hide_mobile_view,
          hide_desktop_view: menuItem.hide_desktop_view,
          // icon_position: menuItem.icon_position,
          // icon: menuItem.icon,
        });
      } else {
        reset({
          label: '',
          entity_type: 'page',
          entity_id: undefined,
          original: '',
          menu_parent: parentId || null,
          show_image: false,
          hide_text: false,
          hide_mobile_view: false,
          hide_desktop_view: false,
          // icon_position: 'left',
          // icon: '',
        });
      }
    }
  }, [menuItem, parentId, reset, open]);

  const onSubmit = async (data: MenuFormValues) => {
    try {
      const payload = { ...data, menu_parent: data.menu_parent || null };
      if (isEditing && menuItem) {
        await updateMenu(menuItem.id, payload);
      } else {
        await createMenu(payload as any);
      }
      showSnackbar(`Menu item ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
      onSave();
      onClose();
    } catch (error: any) {
      console.error(error);
      showSnackbar(error.message || 'An error occurred', 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          backgroundColor: 'white',
        },
      }}
    >
      <DialogTitle>{isEditing ? 'Edit Menu' : 'Create Menu'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormTextField
                name="entity_type"
                control={control}
                label="Entity Type"
                select
                fullWidth
                size="small"
                InputProps={{
                  sx: { backgroundColor: 'white' },
                }}
                SelectProps={{
                  sx: {
                    '.MuiSelect-select': {
                      paddingTop: '8.5px',
                      paddingBottom: '8.5px',
                    },
                  },
                }}
              >
                <MenuItem value="page">Page</MenuItem>
                <MenuItem value="brand">Brand</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="blog">Blog</MenuItem>
                <MenuItem value="deal">Deal</MenuItem>
              </FormTextField>
            </Grid>
            {entityType !== 'page' && (
              <Grid item xs={12}>
                <Controller
                  name="entity_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={entities}
                      getOptionLabel={(option) => option.name || option.title || ''}
                      value={entities.find((e) => e.id === field.value) || null}
                      onChange={(event, newValue) => {
                        setValue('entity_id', newValue ? newValue.id : null, { shouldValidate: true });
                        if (newValue && newValue.slug) {
                          const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
                          let urlPath = '';
                          
                          // Set different URL paths based on entity type
                          if (entityType === 'brand') {
                            urlPath = `${baseUrl}/brand/${newValue.slug}`;
                          } else if (entityType === 'deal') {
                            urlPath = `${baseUrl}/product-deals/${newValue.slug}`;
                          } else {
                            urlPath = `${baseUrl}/${newValue.slug}`;
                          }
                          
                          setValue('original', urlPath, { shouldValidate: true });
                        } else if (!newValue) {
                          setValue('original', '', { shouldValidate: true });
                        }
                      }}
                      onInputChange={(event, newInputValue) => {
                        setSearch(newInputValue);
                      }}
                      filterOptions={(x) => x}
                      loading={loading}
                      // disabled={!entityType || entityType === 'page'}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Entity ID"
                          fullWidth
                          size="small"
                          error={!!errors.entity_id}
                          helperText={errors.entity_id?.message as string}
                          InputProps={{
                            ...params.InputProps,
                            sx: { backgroundColor: 'white' },
                            endAdornment: (
                              <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
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

            {/* {entityType === 'page' && ( */}
              <Grid item xs={12}>
                <FormTextField name="original" label="Original URL" control={control} fullWidth />
              </Grid>
            {/* )} */}

            <Grid item xs={12}>
              <FormTextField name="label" label="Label" control={control} fullWidth />
            </Grid>
          

            {/* <Grid item xs={12}>
              <FormTextField name="icon" label="Icon" control={control} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="icon_position" control={control} label="Icon Position" select fullWidth>
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="right">Right</MenuItem>
              </FormTextField>
            </Grid> */}
            <Grid item xs={12} sm={6} container alignItems="center">
                <FormControlLabel
                  control={
                    <Controller name="show_image" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
                  }
                  label="Show Image"
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Controller name="hide_text" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
                  }
                  label="Hide Text"
                />
            </Grid>
             <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Controller name="hide_mobile_view" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
                  }
                  label="Hide on Mobile"
                />
            </Grid>
             <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Controller name="hide_desktop_view" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
                  }
                  label="Hide on Desktop"
                />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <AppButton
            type="submit"
            label={isEditing ? 'Save Changes' : 'Create'}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MenuDialog; 