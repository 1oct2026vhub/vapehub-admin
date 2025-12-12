import React, { useState } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Tooltip,
  Typography
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileExcelIcon from '@mui/icons-material/InsertDriveFile';
import FileCsvIcon from '@mui/icons-material/Description';
import { exportPurchaseOrder } from '@/services/apiInventory';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useForm, Controller } from 'react-hook-form';
import FormInputField from '@/components/Shared/FormInputField';
import AppButton from '@/components/Shared/AppButton';

interface GenerateReportButtonProps {
  disabled?: boolean;
}

interface ExportFormData {
  days: number;
  format: 'excel' | 'csv';
}

const GenerateReportButton: React.FC<GenerateReportButtonProps> = ({
  disabled = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { showSnackbar } = useSnackbar();
  
  const { control, handleSubmit, reset, formState: { errors, isValid }, watch } = useForm<ExportFormData>({
    defaultValues: {
      days: 28,
      format: 'excel',
    },
    mode: 'onChange',
  });

  const selectedFormat = watch('format') || 'excel';
  
  const handleClick = () => {
    setOpen(true);
    reset({ days: 28, format: 'excel' });
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      reset({ days: 28, format: 'excel' });
    }
  };

  const onSubmit = async (data: ExportFormData) => {
    setLoading(true);
    
    try {
      const days = typeof data.days === 'string' ? Number(data.days) : data.days;
      
      if (isNaN(days) || days <= 0) {
        showSnackbar('Please enter a valid positive number of days', 'error');
        setLoading(false);
        return;
      }
      
      await exportPurchaseOrder({ 
        format: data.format,
        days: days,
      });
      
      showSnackbar(
        `Purchase order exported successfully in ${data.format.toUpperCase()} format`, 
        'success'
      );
      handleClose();
    } catch (error) {
      console.error('Error exporting purchase order:', error);
      showSnackbar(
        typeof error === 'string' 
          ? error 
          : 'Failed to export purchase order. Please check your network connection.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Export purchase order">
        <span>
          <Button
            variant="outlined"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleClick}
            disabled={disabled || loading}
            sx={{
              borderColor: "#2E9970",
              color: "#2E9970",
              "&:hover": {
                borderColor: "#1d7d59",
                backgroundColor: "rgba(46, 153, 112, 0.04)",
              },
            }}
          >
            Export Purchase Order
          </Button>
        </span>
      </Tooltip>
      
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon sx={{ color: '#2E9970' }} />
            <Typography variant="h6" component="span">
              Export Purchase Order
            </Typography>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <FormInputField
                name="days"
                control={control}
                label="Number of Days"
                type="number"
                required
                inputProps={{
                  min: 1,
                  step: 1,
                }}
                rules={{
                  required: 'Number of days is required',
                  validate: {
                    positive: (value) => {
                      const numValue = typeof value === 'string' ? Number(value) : value;
                      if (value === '' || value === null || value === undefined) {
                        return 'Number of days is required';
                      }
                      if (isNaN(numValue) || numValue <= 0) {
                        return 'Number of days must be a positive number';
                      }
                      if (!Number.isInteger(numValue)) {
                        return 'Number of days must be a whole number';
                      }
                      return true;
                    },
                  },
                }}
                helperText="Enter the number of days to calculate required stock for (default: 28 days)"
              />

              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ mb: 1, color: '#2E9970', fontWeight: 'medium' }}>
                  Export Format
                </FormLabel>
                <Controller
                  name="format"
                  control={control}
                  rules={{ required: 'Export format is required' }}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      sx={{
                        '& .MuiRadio-root': {
                          color: '#2E9970',
                          '&.Mui-checked': {
                            color: '#2E9970',
                          },
                        },
                      }}
                    >
                      <FormControlLabel
                        value="excel"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileExcelIcon sx={{ color: '#217346', fontSize: 20 }} />
                            <Typography>Excel (.xlsx)</Typography>
                          </Box>
                        }
                        sx={{
                          mb: 1,
                          p: 1.5,
                          borderRadius: 1,
                          border: field.value === 'excel' ? '2px solid #2E9970' : '1px solid #e0e0e0',
                          backgroundColor: field.value === 'excel' ? 'rgba(46, 153, 112, 0.04)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 153, 112, 0.08)',
                          },
                        }}
                      />
                      <FormControlLabel
                        value="csv"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileCsvIcon sx={{ color: '#d14836', fontSize: 20 }} />
                            <Typography>CSV (.csv)</Typography>
                          </Box>
                        }
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: field.value === 'csv' ? '2px solid #2E9970' : '1px solid #e0e0e0',
                          backgroundColor: field.value === 'csv' ? 'rgba(46, 153, 112, 0.04)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(46, 153, 112, 0.08)',
                          },
                        }}
                      />
                    </RadioGroup>
                  )}
                />
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px', gap: 2 }}>
            <Button 
              onClick={handleClose}
              disabled={loading}
              sx={{
                color: '#666',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Cancel
            </Button>
            <AppButton
              type="submit"
              label={loading ? 'Exporting...' : 'Export'}
              disabled={!isValid || loading}
              loading={loading}
            />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default GenerateReportButton;

