import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message,
  itemName,
  loading = false,
}: DeleteConfirmationModalProps) {
  const displayMessage = message || 
    (itemName 
      ? `Are you sure you want to delete "${itemName}"?` 
      : "Are you sure you want to delete this item?");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{displayMessage}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

