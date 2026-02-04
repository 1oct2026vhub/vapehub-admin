'use client'

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormTextField from '@/components/Shared/FormTextField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import { PromotionalEmailData, sendPromotionalEmail } from '@/services/apiMailSubscriptionSettings';
import AppButton from '@/components/Shared/AppButton';
import { Typography, Box, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SelectUsersModal from './SelectUsersModal';

const promotionalEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  highlightText: z.string().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sendToAll: z.boolean().default(true),
  images: z.array(z.object({
    url: z.string().url('Image URL must be a valid URL'),
    alt: z.string().min(1, 'Alt text is required'),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

type PromotionalEmailFormValues = z.infer<typeof promotionalEmailSchema>;

const PromotionalEmailForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectUsersOpen, setSelectUsersOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const { control, handleSubmit, watch, setValue } = useForm<PromotionalEmailFormValues>({
    resolver: zodResolver(promotionalEmailSchema),
    mode: 'all',
    defaultValues: {
      subject: '',
      content: '',
      highlightText: '',
      ctaText: '',
      ctaUrl: '',
      sendToAll: true,
      images: [],
    },
  });

  const sendToAll = watch('sendToAll');

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images",
  });
  const { showSnackbar } = useSnackbar();

  const onSubmit = async (data: PromotionalEmailFormValues) => {
    // Send only one: either sendToAll true (no selectedEmails) or selectedEmails with sendToAll false
    const isSendToAll = data.sendToAll || selectedEmails.length === 0;
    const payload: PromotionalEmailData = {
      subject: data.subject,
      content: data.content,
      highlightText: data.highlightText,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl || undefined,
      sendToAll: isSendToAll,
      ...(data.images?.length
        ? { images: data.images.filter((i): i is { url: string; alt: string; isPrimary?: boolean } => Boolean(i?.url && i?.alt)) }
        : {}),
    };
    if (!isSendToAll) {
      if (selectedEmails.length === 0) {
        showSnackbar('Please select at least one recipient from "Select users".', 'error');
        return;
      }
      payload.selectedEmails = selectedEmails;
    }
    setIsLoading(true);
    try {
      const response = await sendPromotionalEmail(payload);
      if (response.success) {
        showSnackbar('Promotional emails sent successfully', 'success');
      }
    } catch (error) {
      showSnackbar(error.message || 'Failed to send email', 'error');
      console.error('Failed to send email', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsersConfirm = (emails: string[], sendToAll: boolean) => {
    setSelectedEmails(emails);
    setValue('sendToAll', sendToAll);
    setSelectUsersOpen(false);
  };

  return (
    <div className='mt-4'>
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
        Send Promotional Email
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg p-6">
        <FormTextField name="subject" control={control} label="Subject" required />
        <FormCKEditor name="content" control={control} label="Content" required />
        <FormTextField name="highlightText" control={control} label="Highlight Text" />
        <FormTextField name="ctaText" control={control} label="CTA Text" />
        <FormTextField name="ctaUrl" control={control} label="CTA URL" />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <AppButton
            type="button"
            variant="outlined"
            label="Select users"
            onClick={() => setSelectUsersOpen(true)}
            startIcon={<PeopleIcon />}
          />
          {selectedEmails.length > 0 ? (
            <Chip
              label={`${selectedEmails.length} recipient${selectedEmails.length !== 1 ? 's' : ''} selected`}
              onDelete={() => {
                setSelectedEmails([]);
                setValue('sendToAll', true);
              }}
              size="small"
              sx={{ bgcolor: '#2E9970', color: 'white', '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.8)' } }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Click &quot;Select users&quot; to choose specific recipients. By default, email sends to all subscribers.
            </Typography>
          )}
        </Box>

        {/* <div>
            <h3 className="text-lg font-medium mb-2">Images</h3>
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4 p-4 border rounded-md mb-4">
                    <div className="flex-grow space-y-4">
                        <FormTextField
                            name={`images.${index}.url`}
                            control={control}
                            label="Image URL"
                            required
                        />
                        <FormTextField
                            name={`images.${index}.alt`}
                            control={control}
                            label="Alt Text"
                            required
                        />
                         <FormCheckbox
                            name={`images.${index}.isPrimary`}
                            control={control}
                            label="Set as Primary"
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                    // Uncheck all other primaries
                                    images?.forEach((_, i) => {
                                        if (i !== index) {
                                            setValue(`images.${i}.isPrimary`, false);
                                        }
                                    });
                                }
                                setValue(`images.${index}.isPrimary`, isChecked);
                            }}
                        />
                    </div>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => remove(index)}
                    >
                        Remove
                    </Button>
                </div>
            ))}
            <Button
                variant="outlined"
                onClick={() => append({ url: '', alt: '', isPrimary: false })}
            >
                Add Image
            </Button>
        </div> */}


        <AppButton
          type="submit"
          label={isLoading ? 'Sending...' : 'Send Email'}
          loading={isLoading}
          variant="contained"
        />
      </form>

      <SelectUsersModal
        open={selectUsersOpen}
        onClose={() => setSelectUsersOpen(false)}
        onConfirm={handleUsersConfirm}
        initialSelectedEmails={selectedEmails}
        initialSendToAll={sendToAll}
      />
    </div>
  );
};

export default PromotionalEmailForm; 