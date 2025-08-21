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
import { createFaq, type CreateFaqPayload } from "@/services/apiFaq";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useState } from "react";

// Schema for the Add FAQ form
const faqFormSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question must be 500 characters or less'),
  answer: z.string().min(1, 'Answer is required').max(2000, 'Answer must be 2000 characters or less'),
});

type FaqFormData = z.infer<typeof faqFormSchema>;

export default function AddFaqPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showSnackbar } = useSnackbar();

  // Get entity details from URL parameters
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType');
  const entityName = searchParams.get('entityName');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: '',
      answer: '',
    },
  });

  const handleFormSubmit = async (data: FaqFormData) => {
    if (!entityId || !entityType) {
      showSnackbar('Entity information is missing to create FAQ.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateFaqPayload = {
        question: data.question as string,
        answer: data.answer as string,
        entity_id: parseInt(entityId),
        entity_type: entityType,
      };
      await createFaq(payload);
      showSnackbar('FAQ created successfully!', 'success');
      // Navigate back to the entity page
      router.back();
    } catch (err: any) {
      console.error("Error creating FAQ:", err);
      const apiErrorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      showSnackbar(apiErrorMessage || 'Failed to create FAQ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="mt-10 px-10 mb-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Add New FAQ
        </Typography>
        {/* {entityName && (
          <Typography variant="body1" color="text.secondary" className="mb-6">
            Adding FAQ for: <strong>{entityName}</strong>
          </Typography>
        )} */}
      </div>

      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full p-6"
        // elevation={1}
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
                defaultValue={''}
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
              label={isSubmitting ? 'Creating...' : 'Create FAQ'} 
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
