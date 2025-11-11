"use client";
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, MenuItem, Stack, Grid, Card, CardActionArea, CardMedia, Typography, Pagination, InputAdornment, Box, Popover, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { createFeatureContent, getFeatureIcons, type FeatureIcon, updateFeatureContent, addFeatureIcon, deleteFeatureIcon } from '@/services/apiFeatureContent';
import FormTextField from '@/components/Shared/FormTextField';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  icon_id: z.number({ required_error: 'Icon is required' }),
  link: z.string().refine(
    (val) => val === '' || z.string().url().safeParse(val).success,
    { message: 'Please enter a valid URL' }
  ).optional(),
  status: z.enum(['active', 'inactive']).default('active')
});

type FormValues = z.infer<typeof schema>;

interface Props {
  item?: { id: number; title: string; subtitle: string; icon_id: number; link?: string; status: 'active' | 'inactive'; icon?: { file_name: string; icon_url: string; } } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}> = ({ open, onClose, onConfirm, title, description }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{description}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={onConfirm} color="primary" autoFocus>
                Confirm
            </Button>
        </DialogActions>
    </Dialog>
);


const CreateFeatureContentForm: React.FC<Props> = ({ item, onSuccess, onCancel }) => {
  const { control, handleSubmit, setValue, watch, reset, setError, clearErrors } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: item?.title || '',
      subtitle: item?.subtitle || '',
      icon_id: (item?.icon_id as number) || (undefined as unknown as number),
      link: item?.link || '',
      status: (item?.status as any) || 'active'
    }
  });
  const { showSnackbar } = useSnackbar();

  const [iconAnchorEl, setIconAnchorEl] = useState<HTMLElement | null>(null);
  const [icons, setIcons] = useState<FeatureIcon[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const selectedIconId = watch('icon_id');
  const [selectedIconName, setSelectedIconName] = useState<string>(item?.icon?.file_name || '');
  const [selectedIconUrl, setSelectedIconUrl] = useState<string>(item?.icon?.icon_url || '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [iconToDelete, setIconToDelete] = useState<number | null>(null);
  const [iconsLoading, setIconsLoading] = useState(false);


  useEffect(() => {
    // If item changes (open edit), reset form
    if (item) {
      reset({
        title: item.title,
        subtitle: item.subtitle,
        icon_id: item.icon_id as number,
        link: item.link || '',
        status: item.status as any,
      });
      setSelectedIconName(item.icon?.file_name || '');
      setSelectedIconUrl(item.icon?.icon_url || '');
    } else {
      reset({ title: '', subtitle: '', icon_id: undefined as unknown as number, link: '', status: 'active' });
      setSelectedIconName('');
      setSelectedIconUrl('');
    }
  }, [item, reset]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadIcons = async (pageNum = 1, query?: string) => {
    setIconsLoading(true);
    try {
      const res = await getFeatureIcons({ page: pageNum, limit, order: 'DESC', sort: 'createdAt', deleted: false, search: query || undefined });
      setIcons(res.data?.icons || []);
      setTotal(res.data?.pagination?.totalItems || 0);
      setPage(res.data?.pagination?.currentPage || 1);
    } catch (e) {
      showSnackbar('Failed to load icons', 'error');
    } finally {
      setIconsLoading(false);
    }
  };

  // load when popover opens and when debounced search changes
  const isIconOpen = Boolean(iconAnchorEl);
  useEffect(() => {
    if (isIconOpen) {
      loadIcons(1, debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIconOpen, debouncedSearch]);

  const handleDeleteIcon = async (iconId: number) => {
    setIconToDelete(iconId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (iconToDelete) {
      try {
        await deleteFeatureIcon(iconToDelete);
        showSnackbar('Icon deleted successfully', 'success');
        void loadIcons(1, debouncedSearch); // reload from page 1
        if (selectedIconId === iconToDelete) {
          setValue('icon_id', undefined as unknown as number, { shouldValidate: true });
          setSelectedIconName('');
          setSelectedIconUrl('');
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to delete icon';
        showSnackbar(msg, 'error');
      } finally {
        setDeleteDialogOpen(false);
        setIconToDelete(null);
      }
    }
  };


  const onSubmit = async (data: FormValues) => {
    const title = String(data.title ?? '').trim();
    const subtitle = String(data.subtitle ?? '').trim();
    const link = String(data.link ?? '').trim();
    if (!title || !subtitle) {
      showSnackbar('Title and Subtitle are required', 'error');
      return;
    }
    try {
      const payload = { 
        title, 
        subtitle, 
        status: data.status, 
        icon_id: Number(data.icon_id),
        ...(link && { link })
      } as const;
      const res = item?.id ? await updateFeatureContent(item.id, payload) : await createFeatureContent(payload);
      if (res?.success === false) {
        const msg = res?.errors?.[0]?.msg || res?.message || 'Validation failed';
        showSnackbar(msg, 'error');
        return;
      }
      showSnackbar(item?.id ? 'Feature content updated successfully' : 'Feature content created successfully', 'success');
      onSuccess();
    } catch (e: any) {
      const msg = e?.response?.data?.errors?.[0]?.msg || e?.response?.data?.message || e?.message;
      showSnackbar(msg || 'Action failed', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2}>
        <FormTextField<FormValues>
          name="title"
          control={control}
          label="Title"
          required
        />
        <FormTextField<FormValues>
          name="subtitle"
          control={control}
          label="Subtitle"
          required
        />
        <FormTextField<FormValues>
          name="link"
          control={control}
          label="Link"
          placeholder="https://example.com"
        />
        <Controller
          name="icon_id"
          control={control}
          render={({ fieldState }) => (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  onClick={(e) => setIconAnchorEl(e.currentTarget)}
                >
                  {selectedIconName ? 'Change Icon' : 'Add Icon'}
                </Button>
                <input
                  id="new-icon-input"
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={async (ev) => {
                    const inputEl = ev.target as HTMLInputElement;
                    const file = inputEl.files?.[0];
                    if (!file) return;

                    // Validate dimensions must be exactly 58x58 px
                    const validateDimensions = () =>
                      new Promise<void>((resolve, reject) => {
                        const img = new Image();
                        const objectUrl = URL.createObjectURL(file);
                        img.onload = () => {
                          const width = (img as any).naturalWidth || img.width;
                          const height = (img as any).naturalHeight || img.height;
                          URL.revokeObjectURL(objectUrl);
                          if (width === 58 && height === 58) {
                            clearErrors('icon_id');
                            resolve();
                          } else {
                            setError('icon_id', { type: 'validate', message: 'Icon must be exactly 58×58 px.' });
                            reject(new Error('INVALID_DIMENSIONS'));
                          }
                        };
                        img.onerror = () => {
                          URL.revokeObjectURL(objectUrl);
                          setError('icon_id', { type: 'validate', message: 'Failed to read image.' });
                          reject(new Error('LOAD_ERROR'));
                        };
                        img.src = objectUrl;
                      });

                    try {
                      await validateDimensions();
                    } catch (e) {
                      // showSnackbar('Please upload an icon with exact 58×58 px dimensions.', 'error');
                      inputEl.value = '';
                      return;
                    }

                    try {
                      const res = await addFeatureIcon(file);
                      if (res?.success && res?.data?.icon) {
                        const icon = res.data.icon;
                        setValue('icon_id', icon.id, { shouldValidate: true });
                        setSelectedIconName(icon.file_name);
                        setSelectedIconUrl(icon.icon_url);
                        showSnackbar('Icon added successfully', 'success');
                      } else {
                        showSnackbar(res?.message || 'Failed to add icon', 'error');
                      }
                    } catch (e: any) {
                      showSnackbar(e?.response?.data?.message || e?.message || 'Failed to add icon', 'error');
                    } finally {
                      inputEl.value = '';
                    }
                  }}
                />
                <Button variant="outlined" onClick={() => document.getElementById('new-icon-input')?.click()}>
                  Add New Icon
                </Button>
                {selectedIconUrl ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid', borderColor: 'divider', borderRadius: '4px', p: 0.5, pl: 1, pr: 1 }}>
                    <img src={selectedIconUrl} alt={selectedIconName} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                    <Typography variant="body2" color="textSecondary" noWrap>{selectedIconName}</Typography>
                  </Box>
                ) : selectedIconName ? (
                  <Typography variant="body2" color="textSecondary">{selectedIconName}</Typography>
                ) : null}
              </Stack>
              <Typography variant="caption" color="textSecondary">
                Recommended icon size: 58×58 px.
              </Typography>
              {fieldState.error && (
                <Typography variant="caption" color="error">{fieldState.error.message}</Typography>
              )}
            </Stack>
          )}
        />
        <FormTextField<FormValues>
          name="status"
          control={control}
          label="Status"
          select
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </FormTextField>
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          <Button variant="contained" type="submit">Save</Button>
        </Stack>
      </Stack>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this icon? This action cannot be undone."
      />

      {/* Icon Picker Popover */}
      <Popover
        open={isIconOpen}
        anchorEl={iconAnchorEl}
        onClose={() => setIconAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { width: 420, p: 2, backgroundColor: 'white' } }}
      >
        <Box sx={{ mb: 1 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Grid container spacing={1} sx={{ minHeight: '72px', maxHeight: 245, overflowY: 'auto' }}>
          {iconsLoading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress size={24} />
            </Grid>
          ) : icons.length === 0 ? (
            <Grid item xs={12} sx={{ textAlign: 'center', my: 2 }}>
              <Typography>No data found!</Typography>
            </Grid>
          ) : (
            icons.map((icon) => (
              <Grid item xs={4} key={icon.id}>
                <Card variant={selectedIconId === icon.id ? 'elevation' : 'outlined'} sx={{ position: 'relative', borderColor: selectedIconId === icon.id ? '#2E9970' : undefined }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteIcon(icon.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 1,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                    }}
                    aria-label={`delete ${icon.file_name}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <CardActionArea
                    onClick={() => {
                      setValue('icon_id', icon.id, { shouldValidate: true });
                      setSelectedIconName(icon.file_name);
                      setSelectedIconUrl(icon.icon_url);
                      setIconAnchorEl(null);
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 72,
                        p: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(46, 153, 112, 0.1)',
                        }}
                      >
                        <img
                          src={icon.icon_url}
                          alt={icon.file_name}
                          style={{
                            objectFit: 'contain',
                            maxWidth: '32px',
                            maxHeight: '32px',
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ p: 1, display: 'block', textAlign: 'center' }} noWrap>
                      {icon.file_name}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
        {total > limit && (
          <Stack direction="row" justifyContent="center" mt={1}>
            <Pagination size="small" count={Math.ceil(total / limit)} page={page} onChange={(_, p) => loadIcons(p, debouncedSearch)} />
          </Stack>
        )}
      </Popover>
    </form>
  );
};

export default CreateFeatureContentForm;
