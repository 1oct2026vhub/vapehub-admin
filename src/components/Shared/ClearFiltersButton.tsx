import React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon'; // Assuming FuseSvgIcon path

interface ClearFiltersButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void;
}

const ClearFiltersButton: React.FC<ClearFiltersButtonProps> = ({
  onClick,
  sx,
  ...rest
}) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      size="small"
      startIcon={<FuseSvgIcon size={20}>heroicons-outline:funnel</FuseSvgIcon>}
      sx={{
        ml: 1, // Default margin, can be overridden by sx prop
        borderColor: 'rgba(0, 0, 0, 0.23)', // Default border color
        color: 'rgba(0, 0, 0, 0.87)', // Default text color
        '&:hover': {
          borderColor: 'rgba(0, 0, 0, 0.3)',
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
        ...sx, // Allow custom styling
      }}
      {...rest} // Pass other ButtonProps
    >
      Clear
    </Button>
  );
};

export default ClearFiltersButton; 