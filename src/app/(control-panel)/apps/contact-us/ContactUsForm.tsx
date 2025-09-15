'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  Typography,
  Grid,
  Button,
  Box,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import { ContactInfo, createContactUs, updateContactUs, ContactUsPayload, getContactUsById } from '@/services/apiContactUs';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormCKEditor from '@/components/Shared/FormCKEditor';

const contactUsSchema = z.object({
  send_us_a_message: z.string().min(1, 'Message is required'),
  call_us: z.string().min(1, 'Call us information is required'),
  social_media: z.string().min(1, 'Social media link is required'),
  facebook: z.string().url('Enter a valid Facebook URL').optional().or(z.literal('')),
  twitter: z.string().url('Enter a valid Twitter URL').optional().or(z.literal('')),
  instagram: z.string().url('Enter a valid Instagram URL').optional().or(z.literal('')),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone_number: z.string().min(1, 'Phone number is required').optional().or(z.literal('')),
});

type ContactUsFormType = z.infer<typeof contactUsSchema>;

interface ContactUsFormProps {
  mode: 'add' | 'edit';
  contactId?: number | null;
}

function ContactUsForm({ mode, contactId }: ContactUsFormProps) {
  const isEditMode = mode === 'edit';
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState } = useForm<ContactUsFormType>({
    resolver: zodResolver(contactUsSchema),
    mode: 'all',
  });

  useEffect(() => {
    const fetchContactData = async () => {
      if (isEditMode && contactId) {
        setLoading(true);
        try {
          const response = await getContactUsById(contactId);
          if (response.success) {
            reset(response.data);
          } else {
            showSnackbar(response.message, 'error');
            router.push('/apps/contact-us');
          }
        } catch (error: any) {
          showSnackbar(error.message || 'Failed to fetch contact details', 'error');
          router.push('/apps/contact-us');
        } finally {
          setLoading(false);
        }
      } else {
        reset({
          send_us_a_message: '',
          call_us: '',
          social_media: '',
          facebook: '',
          twitter: '',
          instagram: '',
          email: '',
          phone_number: '',
        });
      }
    };

    fetchContactData();
  }, [isEditMode, contactId, reset, showSnackbar, router]);

  const onSubmit = async (data: ContactUsFormType) => {
    try {
        const payload: ContactUsPayload = {
            send_us_a_message: data.send_us_a_message,
            call_us: data.call_us,
            social_media: data.social_media,
            facebook: data.facebook,
            twitter: data.twitter,
            instagram: data.instagram,
            email: data.email,
            phone_number: data.phone_number,
        };

        if (isEditMode && contactId) {
            const response = await updateContactUs(contactId, payload);
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
        router.push('/apps/contact-us');
    } catch (error: any) {
        showSnackbar(error.message || 'An unexpected error occurred', 'error');
    }
  };

  const handleCancel = () => {
    router.push('/apps/contact-us');
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, m: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography>Loading contact details...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, m: 2 , backgroundColor: 'white' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Contact Info' : 'Create Contact Info'}
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormCKEditor name="send_us_a_message" control={control} label="Message" required />
          </Grid>
          <Grid item xs={12}>
            <FormCKEditor name="call_us" control={control} label="Call Us" required />
          </Grid>
          <Grid item xs={12}>
            <FormCKEditor name="social_media" control={control} label="Social Media" required />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField name="facebook" control={control} label="Facebook" type="url" />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormTextField name="twitter" control={control} label="Twitter" type="url" />
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
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={handleCancel} variant="outlined">
            Cancel
          </Button>
          <AppButton
            type="submit"
            label={isEditMode ? 'Update' : 'Create'}
            loading={formState.isSubmitting}
            disabled={formState.isSubmitting}
          />
        </Box>
      </form>
    </Paper>
  );
}

export default ContactUsForm;
