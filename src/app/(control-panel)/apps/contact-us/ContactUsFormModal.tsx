'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { ContactInfo, createContactUs, updateContactUs, ContactUsPayload } from '@/services/apiContactUs';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormCKEditor from '@/components/Shared/FormCKEditor';

const contactUsSchema = z.object({
  send_us_a_message: z.string().min(1, 'Message is required'),
  call_us: z.string().min(1, 'Call us information is required'),
  social_media: z.string().min(1, 'Social media link is required'),  facebook: z.string().url('Enter a valid Facebook URL').optional().or(z.literal('')),
  whatsapp: z.string().url('Enter a valid WhatsApp URL').optional().or(z.literal('')),
  instagram: z.string().url('Enter a valid Instagram URL').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone_number: z.string().min(1, 'Phone number is required').optional().or(z.literal('')),
});

type ContactUsFormType = z.infer<typeof contactUsSchema>;

interface ContactUsFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: ContactInfo | null;
}

function ContactUsFormModal({ open, onClose, onSaved, initialData }: ContactUsFormModalProps) {
  const isEditMode = !!initialData;
  const { showSnackbar } = useSnackbar();

  const { control, handleSubmit, reset, formState } = useForm<ContactUsFormType>({
    resolver: zodResolver(contactUsSchema),
    mode: 'all',
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        reset(initialData);
      } else {
        reset({
          send_us_a_message: '',
          call_us: '',
          social_media: '',
          facebook: '',
          whatsapp: '',
          instagram: '',
          email: '',
          phone_number: '',
        });
      }
    }
  }, [open, isEditMode, initialData, reset]);

  const onSubmit = async (data: ContactUsFormType) => {
    try {
        const payload: ContactUsPayload = {
            send_us_a_message: data.send_us_a_message,
            call_us: data.call_us,
            social_media: data.social_media,
            facebook: data.facebook,
            whatsapp: data.whatsapp,
            instagram: data.instagram,
            email: data.email,
            phone_number: data.phone_number,
        };

        if (isEditMode && initialData) {
            const response = await updateContactUs(initialData.id, payload);
            if(response.success){
                showSnackbar('Contact info updated successfully', 'success');
            } else {
                showSnackbar(response.message, 'error');
            }
        } else {
            const response = await createContactUs(payload);
            if(response.success){
                showSnackbar('Contact info created successfully', 'success');
            } else {
                showSnackbar(response.message, 'error');
            }
        }
        onSaved();
        handleClose();
    } catch (error: any) {
        showSnackbar(error.message || 'An unexpected error occurred', 'error');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'white',
        },
      }}
    >
      <DialogTitle>{isEditMode ? 'Edit Contact Info' : 'Create Contact Info'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <FormCKEditor name="send_us_a_message" control={control} label="Message" required />
            </Grid>
            <Grid item xs={12}>
              <FormCKEditor name="call_us" control={control} label="Call Us" required />
            </Grid>
            <Grid item xs={12}>
              <FormCKEditor name="social_media" control={control} label="Social Media" required />            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField name="facebook" control={control} label="Facebook" type="url" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField name="whatsapp" control={control} label="WhatsApp" type="url" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField name="instagram" control={control} label="Instagram" type="url" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField name="email" control={control} label="Email" type="email" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormTextField name="phone_number" control={control} label="Phone Number" />
            </Grid>
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

export default ContactUsFormModal; 