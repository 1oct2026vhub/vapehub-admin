import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  CircularProgress,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileExcelIcon from '@mui/icons-material/InsertDriveFile';
import FileCsvIcon from '@mui/icons-material/Description';
import { exportPurchaseOrder } from '@/services/apiInventory';
import { useSnackbar } from '@/contexts/SnackbarContext';

interface GenerateReportButtonProps {
  disabled?: boolean;
}

const GenerateReportButton: React.FC<GenerateReportButtonProps> = ({
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { showSnackbar } = useSnackbar();
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = async (format: 'excel' | 'csv') => {
    setLoading(true);
    handleClose();
    
    try {
      console.log('Exporting purchase order with format:', format);
      
      await exportPurchaseOrder({ format });
      
      showSnackbar(`Purchase order exported successfully in ${format.toUpperCase()} format`, 'success');
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
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleDownload('excel')} disabled={loading}>
          <ListItemIcon>
            <FileExcelIcon style={{ color: '#217346' }} />
          </ListItemIcon>
          <ListItemText>Excel (.xlsx)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload('csv')} disabled={loading}>
          <ListItemIcon>
            <FileCsvIcon style={{ color: '#d14836' }} />
          </ListItemIcon>
          <ListItemText>CSV (.csv)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default GenerateReportButton;

