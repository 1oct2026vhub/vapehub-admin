import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import AppButton from '@/components/Shared/AppButton';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isSubmitting = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>{cancelText}</Button>
        <AppButton
          label={confirmText}
          onClick={onConfirm}
          loading={isSubmitting}
          disabled={isSubmitting}
          sx={{
            background: 'linear-gradient(to bottom, #D32F2F, #B71C1C)',
            '&:hover': {
              background: 'linear-gradient(to bottom, #C62828, #A51A1A)',
            },
          }}
        />
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 