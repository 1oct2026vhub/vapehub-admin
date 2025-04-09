import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import { refundTransaction } from '@/services/apiTransaction';

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  transactionId: number;
  transactionAmount: string;
  currency: string;
  onSuccess: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
  open,
  onClose,
  transactionId,
  transactionAmount,
  currency,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReason(e.target.value);
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!reason.trim()) {
      setError('Please provide a reason for the refund.');
      return false;
    }

    if (!amount.trim()) {
      setError('Please enter a refund amount.');
      return false;
    }

    const numAmount = parseFloat(amount);
    const maxAmount = parseFloat(transactionAmount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Refund amount must be greater than zero.');
      return false;
    }

    if (numAmount > maxAmount) {
      setError(`Refund amount cannot exceed the transaction amount of ${currency} ${maxAmount.toFixed(2)}.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await refundTransaction(transactionId, {
        reason,
        amount: parseFloat(amount),
      });
      
      onSuccess();
      handleReset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process refund. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setReason('');
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Refund Transaction</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" mb={2}>
            Original Transaction Amount: <strong>{currency} {parseFloat(transactionAmount).toFixed(2)}</strong>
          </Typography>
          
          <TextField
            label="Refund Amount"
            fullWidth
            margin="normal"
            value={amount}
            onChange={handleAmountChange}
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
            }}
            placeholder="Enter amount to refund"
            helperText="Enter the amount you wish to refund"
          />
          
          <TextField
            label="Reason for Refund"
            fullWidth
            margin="normal"
            value={reason}
            onChange={handleReasonChange}
            disabled={loading}
            multiline
            rows={3}
            placeholder="Provide a reason for this refund"
            helperText="Required - explain why this transaction is being refunded"
          />
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          color="inherit" 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Processing...' : 'Refund Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RefundModal; 