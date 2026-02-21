import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
} from "@mui/material";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  loading?: boolean;
  /** Optional redirect URL (shown when provided) */
  redirectUrl?: string;
  redirectUrlError?: string;
  onRedirectUrlChange?: (value: string) => void;
}

export default function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  itemName,
  loading = false,
  redirectUrl = "",
  redirectUrlError = "",
  onRedirectUrlChange,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: onRedirectUrlChange ? 2 : 0 }}>
          Are you sure you want to delete the category "{itemName}"? This action cannot be undone.
        </Typography>
        {onRedirectUrlChange != null && (
          <TextField
            fullWidth
            label="Redirect URL (optional)"
            placeholder="https://example.com"
            value={redirectUrl}
            onChange={(e) => onRedirectUrlChange(e.target.value)}
            size="small"
            error={!!redirectUrlError}
            helperText={redirectUrlError || "Leave empty to skip. Enter a valid URL (e.g. https://example.com)."}
            sx={{ mt: 1 }}
          />
        )}
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
