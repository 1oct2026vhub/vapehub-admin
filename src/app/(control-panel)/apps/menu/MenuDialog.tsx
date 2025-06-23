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
import { getBlogPosts } from '@/services/apiBlog';
import { useDebounce } from '@/hooks/useDebounce';

const menuSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    entity_type: z.enum(['brand', 'category', 'product', 'blog', 'page']).optional().nullable(),
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
      hide_text: true,
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
      const params: any = { limit: 1000 };

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
    if (entityType === 'page') {
      setValue('entity_id', null, { shouldValidate: true });
    } else {
      setValue('original', '', { shouldValidate: true });
      if (dirtyFields.entity_type) {
        setValue('entity_id', undefined, { shouldValidate: true });
      }
    }
  }, [entityType, setValue, dirtyFields.entity_type]);

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
          hide_text: true,
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
      <DialogTitle>{isEditing ? 'Edit Menu Item' : 'Create Menu Item'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormTextField name="entity_type" control={control} label="Entity Type" select fullWidth>
                <MenuItem value="page">Page</MenuItem>
                <MenuItem value="brand">Brand</MenuItem>
                <MenuItem value="category">Category</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="blog">Blog</MenuItem>
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
                        field.onChange(newValue ? newValue.id : null);
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
                          error={!!errors.entity_id}
                          helperText={errors.entity_id?.message as string}
                          InputProps={{
                            ...params.InputProps,
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

            {entityType === 'page' && (
              <Grid item xs={12}>
                <FormTextField name="original" label="Original URL" control={control} fullWidth />
              </Grid>
            )}

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
                  label="Show Text"
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
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MenuDialog; 