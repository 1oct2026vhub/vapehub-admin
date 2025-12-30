
"use client";
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateSquareImage } from '@/utils/imageUtils';
import FormTextField from '@/components/Shared/FormTextField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import AppButton from '@/components/Shared/AppButton';
import FormFileUploadField from '@/components/Shared/FormFileUploadField';
import { Paper, Box, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getWelcomeContent, createOrUpdateWelcomeContent, removeWelcomeContentImage } from '@/services/apiWelcome';
import { useSnackbar } from '@/contexts/SnackbarContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MIN_SQUARE_DIMENSION = 500; // Minimum dimension for square image (500x500 px)

const welcomeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  alt_text: z.string().optional(),
  image: z.any().optional().superRefine(async (value, ctx) => {
    // Image is optional, so if no value is provided, skip validation
    if (!value || value === null || value === undefined) {
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
      // First check if image is square, then check minimum dimensions
      const result = await validateSquareImage(value, MIN_SQUARE_DIMENSION);
      if (!result.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.message || 'Image must be square with minimum dimensions of 500 × 500 px',
        });
      }
      return;
    }
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid image input' });
  }),
});

type WelcomeFormData = z.infer<typeof welcomeSchema>;

const WelcomeForm: React.FC<{}> = () => {
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<WelcomeFormData>({
    resolver: zodResolver(welcomeSchema),
    mode: 'onChange',
  });
  const { showSnackbar } = useSnackbar();
  const [welcomeContentId, setWelcomeContentId] = React.useState<number | null>(null);
  const [isDeletingImage, setIsDeletingImage] = React.useState(false);
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | undefined>();
  const [hasNewUpload, setHasNewUpload] = React.useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await getWelcomeContent({});
        if (response.success && response.data.welcomeContents.length > 0) {
          const content = response.data.welcomeContents[0];
          console.log('Welcome content loaded:', content);
          setWelcomeContentId(content.id);
          setCurrentImageUrl(content.image_url);
          setHasNewUpload(false); // Reset flag when loading existing content
          console.log('Current image URL set to:', content.image_url);
          reset({
            title: content.title,
            content: content.content,
            alt_text: (content as any).alt_text || '',
            image: content.image_url,
          });
        }
      } catch (error) {
        console.error('Failed to fetch welcome content', error);
      }
    };
    fetchContent();
  }, [reset]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      // A new file was uploaded
      setHasNewUpload(true);
    } else {
      // File was removed
      setHasNewUpload(false);
    }
  };

  const onSubmit = async (data: WelcomeFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.alt_text) {
      formData.append('alt_text', data.alt_text);
    }
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }

    try {
      const response = await createOrUpdateWelcomeContent(formData);
      console.log(response);
      showSnackbar(response?.data?.message, 'success');
      
      // Reset the new upload flag after successful submission
      setHasNewUpload(false);
      
      // Refetch content to get the new image URL
      const updatedContent = await getWelcomeContent({});
      if (updatedContent.success && updatedContent.data.welcomeContents.length > 0) {
        const content = updatedContent.data.welcomeContents[0];
        setWelcomeContentId(content.id);
        setCurrentImageUrl(content.image_url);
      }
    } catch (error) {
      showSnackbar('Failed to save welcome content', 'error');
    }
  };

  const handleDeleteImage = async () => {
    if (!welcomeContentId) {
      showSnackbar('Welcome content ID is missing', 'error');
      return;
    }
    
    setIsDeletingImage(true);
    try {
      const response = await removeWelcomeContentImage(welcomeContentId);
      showSnackbar(response.message || 'Image removed successfully!', 'success');
      setCurrentImageUrl(undefined);
      setHasNewUpload(false);
      setValue('image', null, { shouldDirty: true, shouldValidate: true });
    } catch (err: any) {
      if (err?.errors) {
        showSnackbar(err?.errors[0]?.msg, "error");
      } else {
        const errorMessage = err?.message || "Failed to remove image";
        showSnackbar(errorMessage, "error");
      }

      const errorData = err || err;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsDeletingImage(false);
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
            helperText={`Must be square image (width = height) with minimum ${MIN_SQUARE_DIMENSION} × ${MIN_SQUARE_DIMENSION} px (PNG/JPG/WebP, max 5MB)`}
            defaultImage={currentImageUrl}
            onFileChange={handleFileChange}
          />
          {/* Custom delete button for welcome content image - only show for server-saved images, not new uploads */}
          {currentImageUrl && welcomeContentId && currentImageUrl.startsWith('http') && !hasNewUpload && (
            <Box 
              sx={{ 
                position: 'relative',
                marginTop: '-120px', // Overlay on top of the "Current Image" section (128px - 8px padding)
                marginLeft: '0px',
                width: '128px',
                height: '128px',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <IconButton
                className="bg-white hover:bg-red-50 shadow-md"
                size="small"
                onClick={handleDeleteImage}
                disabled={isDeletingImage}
                sx={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  pointerEvents: 'auto',
                  "& .MuiSvgIcon-root": {
                    color: isDeletingImage ? "#9ca3af" : "#ef4444",
                  },
                  "&:hover": {
                    "& .MuiSvgIcon-root": {
                      color: "#dc2626",
                    },
                  },
                }}
              >
                {isDeletingImage ? <CircularProgress size={20} /> : <DeleteIcon />}
              </IconButton>
            </Box>
          )}
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

