'use client'

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
// import PageHeader from '@/components/Shared/PageHeader';
import FormTextField from '@/components/Shared/FormTextField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import { PromotionalEmailData, sendPromotionalEmail } from '@/services/apiMailSubscriptionSettings';
import AppButton from '@/components/Shared/AppButton';
import { Typography } from '@mui/material';
// import FormCheckbox from '@/app/(control-panel)/apps/coupon/_components/FormCheckbox';

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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images",
  });
  const { showSnackbar } = useSnackbar();
  const onSubmit = async (data: PromotionalEmailFormValues) => {
    setIsLoading(true);
    try {
        const response = await sendPromotionalEmail(data as PromotionalEmailData);
        if (response.success) {
            showSnackbar('Promotional emails sent successfully', 'success');
        } 
    } catch (error) {
      showSnackbar(error.message || 'Failed to send email','error');
        console.error('Failed to send email', error);
    } finally {
        setIsLoading(false);
    }
  };

  const images = watch("images");

  return (
    <div className='mt-4'>
      <Typography variant="h4" className="font-semibold mb-4">Send Promotional Email</Typography>
      {/* <PageHeader title="Send Promotional Email" /> */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg p-6">
        <FormTextField name="subject" control={control} label="Subject" required />
        <FormCKEditor name="content" control={control} label="Content" required />
        <FormTextField name="highlightText" control={control} label="Highlight Text" />
        <FormTextField name="ctaText" control={control} label="CTA Text" />
        <FormTextField name="ctaUrl" control={control} label="CTA URL" />
        {/* <FormCheckbox name="sendToAll" control={control} label="Send to All Subscribers" /> */}

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
    </div>
  );
};

export default PromotionalEmailForm; 