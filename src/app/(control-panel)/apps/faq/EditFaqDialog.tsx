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
import { updateFaq, type UpdateFaqPayload, type FaqItem } from '@/services/apiFaq';

// Schema for the Edit FAQ form (can be same as Add if requirements are identical)
const faqFormSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500, 'Question must be 500 characters or less'),
  answer: z.string().min(1, 'Answer is required').max(2000, 'Answer must be 2000 characters or less'),
  // entity_type and entity_id are typically not edited directly in the form for an existing FAQ
  // but are needed for the payload if your API requires them for PUT.
  // For this example, we assume they don't change or are handled by the backend based on ID.
  // If they CAN change, add them to the schema and form.
});

type FaqFormData = z.infer<typeof faqFormSchema>;

interface EditFaqDialogProps {
  open: boolean;
  onClose: () => void;
  faqToEdit: FaqItem;
  onFaqUpdated: () => void; // Callback to refresh FAQ list in parent
}

const EditFaqDialog: React.FC<EditFaqDialogProps> = ({
  open,
  onClose,
  faqToEdit,
  onFaqUpdated,
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

  // Populate form when faqToEdit changes and dialog is open
  useEffect(() => {
    if (open && faqToEdit) {
      reset({
        question: faqToEdit.question,
        answer: faqToEdit.answer,
      });
    } else if (!open) {
        reset({ question: '', answer: '' }); // Clear form when closed
    }
  }, [open, faqToEdit, reset]);

  const handleFormSubmit = async (data: FaqFormData) => {
    setIsSubmitting(true);
    try {
      // Construct payload. Only include fields that are meant to be updated.
      // If entity_type/entity_id are part of the form, include them from data.
      const payload: UpdateFaqPayload = {
        question: data.question as string,
        answer: data.answer as string,
        // If your API requires entity_type and entity_id for PUT, and they might change:
        // entity_type: data.entity_type, // (assuming it's in FaqFormData)
        // entity_id: data.entity_id,     // (assuming it's in FaqFormData)
        // OR if they don't change for an existing FAQ, you might pass the original ones:
        // entity_type: faqToEdit.entity_type,
        // entity_id: faqToEdit.entity_id,
      };
      
      await updateFaq(faqToEdit.id, payload);
      showSnackbar('FAQ updated successfully!', 'success');
      onFaqUpdated(); 
      onClose();    
    } catch (err: any) {
      console.error("Error updating FAQ:", err);
      const apiErrorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      showSnackbar(apiErrorMessage || 'Failed to update FAQ', 'error');
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
          backgroundColor: '#ffffff',
        }
      }}
    >
      <DialogTitle>Edit FAQ</DialogTitle>
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
              sx={{ '& .MuiOutlinedInput-input::placeholder': { textAlign: 'center' } }}
            />
            <FormTextField<FaqFormData>
              name="answer"
              control={control}
              label="Answer"
              required
              multiline
              rows={5}
              placeholder="Provide the answer to the question"
              sx={{ '& .MuiOutlinedInput-input::placeholder': { textAlign: 'center' } }}
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
            label={isSubmitting ? 'Saving...' : 'Save Changes'} 
            type="submit" 
            disabled={isSubmitting} 
            loading={isSubmitting}
          />
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFaqDialog; 