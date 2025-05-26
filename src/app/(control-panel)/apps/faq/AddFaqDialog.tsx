import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
} from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormTextField from '@/components/Shared/FormTextField';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { createFaq, type CreateFaqPayload, type FaqItem } from '@/services/apiFaq';
import FormCKEditor from '@/components/Shared/FormCKEditor';

// Schema for the Add FAQ form
const faqFormSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question must be 500 characters or less'),
  answer: z.string().min(1, 'Answer is required').max(2000, 'Answer must be 2000 characters or less'),
});

type FaqFormData = z.infer<typeof faqFormSchema>;

interface AddFaqDialogProps {
  open: boolean;
  onClose: () => void;
  productId: number;
  entityType: string;
  onFaqAdded: () => void; // Callback to refresh FAQ list in parent
}

const AddFaqDialog: React.FC<AddFaqDialogProps> = ({
  open,
  onClose,
  productId,
  entityType,
  onFaqAdded,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showSnackbar } = useSnackbar();

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

  // Reset form when dialog opens/closes or productId changes
  useEffect(() => {
    if (open) {
      reset({ question: '', answer: '' });
    } else {
      // Optionally reset when closed if you want a clean slate next time it opens
      // reset({ question: '', answer: '' });
    }
  }, [open, reset]);

  const handleFormSubmit = async (data: FaqFormData) => {
    if (productId <= 0) { // Ensure productId is valid
      showSnackbar('Product information is missing to create FAQ.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateFaqPayload = {
        question: data.question as string,
        answer: data.answer as string,
        entity_id: productId,
        entity_type: entityType,
      };
      await createFaq(payload);
      showSnackbar('FAQ created successfully!', 'success');
      onFaqAdded(); // Notify parent to refresh
      onClose();    // Close the dialog
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#ffffff', // Explicitly set background to white
        }
      }}
    >
      <DialogTitle>Add New FAQ</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormTextField<FaqFormData>
              name="question"
              control={control}
              label="Question"
              required
              multiline
              rows={3}
              placeholder="Enter the question here"
              sx={{ 
                '& .MuiOutlinedInput-input::placeholder': {
                  textAlign: 'center',
                }
              }}
            />
            <FormCKEditor
              name="answer"
              control={control}
              label="Answer"
              required
              defaultValue={''}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <AppButton 
            label="Cancel" 
            onClick={onClose} 
            variant="text"
          />
          <AppButton 
            label={isSubmitting ? 'Creating...' : 'Create FAQ'} 
            type="submit" 
            disabled={isSubmitting} 
            loading={isSubmitting} 
          />
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddFaqDialog; 