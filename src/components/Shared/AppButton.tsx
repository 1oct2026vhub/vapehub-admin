// import React from 'react';
// import Button from '@mui/material/Button';

// type AppButtonProps = {
// //   label: string;
// label: React.ReactNode; // Allow JSX instead of just string
//   onClick?: () => void;
//   type?: 'button' | 'submit' | 'reset';
//   variant?: 'text' | 'outlined' | 'contained';
//   color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
//   disabled?: boolean;
//   fullWidth?: boolean;
//   size?: 'small' | 'medium' | 'large';
//   className?: string;
// };

// const AppButton: React.FC<AppButtonProps> = ({
//   label,
//   onClick,
//   type = 'button',
//   variant = 'contained',
//   color = 'primary',
//   disabled = false,
//   fullWidth = false,
//   size = 'medium',
//   className = '',
// }) => {
//   return (
//     <Button
//       onClick={onClick}
//       type={type}
//       variant={variant}
//       color={color}
//       disabled={disabled}
//       fullWidth={fullWidth}
//       size={size}
//       className={className}
//     >
//       {label}
//     </Button>
//   );
// };

// export default AppButton;


import React, { ElementType } from 'react';
import Button from '@mui/material/Button';

type AppButtonProps = {
  label: React.ReactNode; // Allow JSX instead of just string
  component?: ElementType; // Allow passing custom components like NavLinkAdapter
  to?: string; // For routing if using custom component
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

const AppButton: React.FC<AppButtonProps> = ({
  label,
  component,
  to,
  onClick,
  type = 'button',
  variant = 'contained',
  color = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'medium',
  className = '',
}) => {
  return (
    <Button
      component={component} // Allow custom component like NavLinkAdapter
      to={to} // Pass the "to" prop for routing
      onClick={onClick}
      type={type}
      variant={variant}
      color={color}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      className={className}
    >
      {label}
    </Button>
  );
};

export default AppButton;
