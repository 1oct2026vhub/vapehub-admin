
"use client";
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateImageDimensions } from '@/utils/imageUtils';
import FormTextField from '@/components/Shared/FormTextField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import AppButton from '@/components/Shared/AppButton';
import FormFileUploadField from '@/components/Shared/FormFileUploadField';
import { Paper } from '@mui/material';
import { getWelcomeContent, createOrUpdateWelcomeContent } from '@/services/apiWelcome';
import { useSnackbar } from '@/contexts/SnackbarContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const welcomeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  image: z.any().superRefine(async (value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Image is required' });
      return;
    }
    // When editing, existing value can be a URL string; allow it
    if (typeof value === 'string') return;
    // Only validate real file uploads
    if (value instanceof File) {
      if (value.size > MAX_FILE_SIZE) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Max file size is 5MB.' });
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(value.type)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only .png, .jpg, .jpeg, .webp formats are accepted.' });
        return;
      }
      const result = await validateImageDimensions(value, 1920, 700);
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.message || 'Image must be exactly 1920 × 700 px',
        });
      }
      return;
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid image input' });
  }),
});

type WelcomeFormData = z.infer<typeof welcomeSchema>;

const WelcomeForm: React.FC<{}> = () => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<WelcomeFormData>({
    resolver: zodResolver(welcomeSchema),
    mode: 'onChange',
  });
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await getWelcomeContent({});
        if (response.success && response.data.welcomeContents.length > 0) {
          const content = response.data.welcomeContents[0];
          reset({
            title: content.title,
            content: content.content,
            image: content.image_url,
          });
        }
      } catch (error) {
        console.error('Failed to fetch welcome content', error);
      }
    };
    fetchContent();
  }, [reset]);

  const onSubmit = async (data: WelcomeFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }

    try {
      const response = await createOrUpdateWelcomeContent(formData);
      console.log(response);
      showSnackbar(response?.data?.message, 'success');
    } catch (error) {
      showSnackbar('Failed to save welcome content', 'error');
    }
  };

  return (
    <Paper className="bg-white p-4 sm:p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <FormTextField
            name="title"
            control={control}
            label="Title"
            required
          />
        </div>
        <div className="mb-4">
          <FormFileUploadField
            name="image"
            control={control}
            label="Image"
            required
            helperText="Required resolution: 1920 × 700 px (PNG/JPG/WebP, max 5MB)"
            exactWidth={1920}
            exactHeight={700}
            defaultImage={control._defaultValues.image}
          />
        </div>
        <div className="mb-4">
          <FormCKEditor
            name="content"
            control={control}
            label="Content"
            required
            defaultValue={control._defaultValues.content}
          />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <AppButton label="Save" type="submit" />
        </div>
      </form>
    </Paper>
  );
};

export default WelcomeForm;

