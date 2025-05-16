import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import AppButton from '@/components/Shared/AppButton';

interface ConfirmActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string; // Name of the item being actioned upon
  actionButtonText?: string; // e.g., "Delete", "Restore", defaults to "Confirm"
  actionButtonColorClass?: string; // Tailwind class for the action button background, e.g., "bg-red-600"
  children?: React.ReactNode; // For custom content text
}

const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  actionButtonText = "Confirm",
  actionButtonColorClass = "bg-primary", // Assuming a default primary Tailwind class or AppButton handles it
  children,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-action-dialog-title"
      aria-describedby="confirm-action-dialog-description"
      PaperProps={{
        sx: {
          backgroundColor: '#ffffff',
        }
      }}
    >
      <DialogTitle id="confirm-action-dialog-title">{title}</DialogTitle>
      <DialogContent>
        {children || (
          <DialogContentText id="confirm-action-dialog-description">
            {itemName 
              ? `Are you sure you want to ${actionButtonText.toLowerCase()} "${itemName}"?`
              : `Are you sure you want to ${actionButtonText.toLowerCase()}? This action may not be reversible.`}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <AppButton 
          label="Cancel" 
          onClick={onClose} 
          variant="text" // Text variant for cancel is common
          className="!bg-gray-100" // As per previous styling for cancel
        />
        <AppButton 
          label={actionButtonText} 
          onClick={onConfirm} 
          // Apply Tailwind class for color. Default to AppButton's contained style if no class.
          className={`${actionButtonColorClass} text-white`} // Assuming text-white is desired for colored backgrounds
          // If AppButton was updated to take disableGradient for contained variants:
          // disableGradient={variant === 'contained'} // Example
        />
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionDialog; 