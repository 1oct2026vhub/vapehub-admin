'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { addMailSubscription } from '@/services/apiSubscribers';
import { useSnackbar } from '@/contexts/SnackbarContext';

const addSubscriberSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type AddSubscriberFormValues = z.infer<typeof addSubscriberSchema>;

export type AddSubscriberModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

/** Axios interceptor rejects with `response.data` (not `AxiosError`), so read API shape first. */
function getAddSubscriberErrorMessage(e: unknown): string {
  if (typeof e === 'string' && e.trim()) return e;
  if (e instanceof Error && e.message) return e.message;
  if (!e || typeof e !== 'object') return 'Failed to add subscriber';

  const o = e as Record<string, unknown>;

  const top = o.message;
  if (typeof top === 'string' && top.trim()) return top;
  if (Array.isArray(top)) return top.map(String).join(', ');

  const nested = o.error;
  if (nested && typeof nested === 'object') {
    const m = (nested as Record<string, unknown>).message;
    if (typeof m === 'string' && m.trim()) return m;
    if (Array.isArray(m)) return m.map(String).join(', ');
  }

  const response = o.response as Record<string, unknown> | undefined;
  const data = response?.data;
  if (data && typeof data === 'object') {
    const dm = (data as Record<string, unknown>).message;
    if (typeof dm === 'string' && dm.trim()) return dm;
    if (Array.isArray(dm)) return dm.map(String).join(', ');
  }

  return 'Failed to add subscriber';
}

export default function AddSubscriberModal({ open, onClose, onSuccess }: AddSubscriberModalProps) {
  const { showSnackbar } = useSnackbar();
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<AddSubscriberFormValues>({
    resolver: zodResolver(addSubscriberSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: AddSubscriberFormValues) => {
    try {
      await addMailSubscription(data.email.trim());
      showSnackbar('Subscriber added successfully', 'success');
      reset();
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      showSnackbar(getAddSubscriberErrorMessage(e), 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: { backgroundColor: '#ffffff' },
        },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Add subscriber</DialogTitle>
        <DialogContent className="pt-4">
          <FormTextField<AddSubscriberFormValues>
            control={control}
            name="email"
            label="Email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="name@example.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <AppButton type="submit" label="Submit" loading={isSubmitting} />
        </DialogActions>
      </form>
    </Dialog>
  );
}
