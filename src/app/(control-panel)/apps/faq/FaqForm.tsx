"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Paper, Typography, Box, Grid } from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormTextField from "@/components/Shared/FormTextField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { createFaq, updateFaq, type CreateFaqPayload, type UpdateFaqPayload, type FaqItem } from "@/services/apiFaq";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useState, useEffect } from "react";

// Schema for the FAQ form
const faqFormSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question must be 500 characters or less'),
  answer: z.string().min(1, 'Answer is required'),
});

type FaqFormData = z.infer<typeof faqFormSchema>;

interface FaqFormProps {
  mode: 'add' | 'edit';
  faqToEdit?: FaqItem | null;
  entityId?: number | null;
  entityType?: string;
  entityName?: string;
  onSuccess?: () => void;
}

export default function FaqForm({ 
  mode, 
  faqToEdit, 
  entityId, 
  entityType, 
  entityName,
  onSuccess 
}: FaqFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showSnackbar } = useSnackbar();

  // Get entity details from URL parameters if not provided as props
  const urlEntityId = searchParams.get('entityId');
  const urlEntityType = searchParams.get('entityType');
  const urlEntityName = searchParams.get('entityName');

  // Map entity type to display name when name not provided
  const getEntityDisplayName = (type: string | null | undefined): string => {
    if (!type) return '';
    const map: Record<string, string> = {
      product: 'Product',
      blog: 'Blog',
      category: 'Category',
      brand: 'Brand',
      variant: 'Variant',
      common: 'Deal',
      blog_category: 'Blog Category',
      blog_post: 'Blog Post',
    };
    return map[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  // Use props or fall back to URL parameters
  const finalEntityId = entityId ?? faqToEdit?.entity_id ?? (urlEntityId ? parseInt(urlEntityId) : null);
  const finalEntityType = entityType ?? faqToEdit?.entity_type ?? urlEntityType;
  const finalEntityName =
    entityName ??
    urlEntityName ??
    getEntityDisplayName(finalEntityType);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: '',
      answer: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && faqToEdit) {
      reset({
        question: faqToEdit.question,
        answer: faqToEdit.answer,
      });
    }
  }, [mode, faqToEdit, reset]);

  const handleFormSubmit = async (data: FaqFormData) => {
    if (mode === 'add' && (!finalEntityId || !finalEntityType)) {
      showSnackbar('Entity information is missing to create FAQ.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'add') {
        const payload: CreateFaqPayload = {
          question: data.question as string,
          answer: data.answer as string,
          entity_id: finalEntityId!,
          entity_type: finalEntityType!,
        };
        await createFaq(payload);
        showSnackbar('FAQ created successfully!', 'success');
      } else {
        if (!faqToEdit) {
          showSnackbar('FAQ data is missing for editing.', 'error');
          return;
        }
        const payload: UpdateFaqPayload = {
          question: data.question as string,
          answer: data.answer as string,
        };
        await updateFaq(faqToEdit.id, payload);
        showSnackbar('FAQ updated successfully!', 'success');
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate back if no callback provided
        router.back();
      }
    } catch (err: any) {
      console.error(`Error ${mode === 'add' ? 'creating' : 'updating'} FAQ:`, err);
      const apiErrorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      showSnackbar(apiErrorMessage || `Failed to ${mode === 'add' ? 'create' : 'update'} FAQ`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess(); // Close the form if it's in a modal context
    } else {
      router.back();
    }
  };

  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode ? 'Edit FAQ' : 'Add New FAQ';
  const submitButtonText = isSubmitting 
    ? (isEditMode ? 'Saving...' : 'Creating...') 
    : (isEditMode ? 'Save Changes' : 'Create FAQ');

  return (
    <div className="mt-10 px-10 mb-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          {pageTitle}
        </Typography>
        {finalEntityName && (
          <Typography variant="body1" color="text.secondary" className="mb-6">
            {isEditMode ? 'Editing FAQ for: ' : 'Adding FAQ for: '} <strong>{finalEntityName}</strong>
          </Typography>
        )}
      </div>

      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full p-6"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormTextField<FaqFormData>
                name="question"
                control={control}
                label="Question"
                required
                multiline
                rows={3}
                placeholder="Enter the question here"
                error={!!errors.question}
                helperText={errors.question?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <FormCKEditor
                name="answer"
                control={control}
                label="Answer"
                required
                defaultValue={isEditMode ? faqToEdit?.answer || '' : ''}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <AppButton 
              label="Cancel" 
              onClick={handleCancel} 
              variant="text"
            />
            <AppButton 
              label={submitButtonText} 
              type="submit" 
              disabled={isSubmitting} 
              loading={isSubmitting} 
            />
          </Box>
        </form>
      </Paper>
    </div>
  );
}
