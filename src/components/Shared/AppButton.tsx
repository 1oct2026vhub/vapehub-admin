import React, { ElementType } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

type AppButtonProps = {
  label: React.ReactNode;
  component?: ElementType; // Allow custom components like NavLinkAdapter
  to?: string; // Only used when component supports it
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

// Styled MUI Button with Linear Gradient
const GradientButton = styled(Button)({
  background: 'linear-gradient(to bottom, #2E9970, #005434)',
  color: '#fff',
  '&:hover': {
    background: 'linear-gradient(to bottom, #247C5C, #003F29)',
  },
});

const AppButton: React.FC<AppButtonProps> = ({
  label,
  component,
  to,
  onClick,
  type = 'button',
  variant = 'contained',
  disabled = false,
  fullWidth = false,
  size = 'medium',
  className = '',
}) => {
  // Conditionally add "to" only when using a routing component
  const buttonProps: any = { onClick, type, variant, disabled, fullWidth, size, className };

  if (component) {
    buttonProps.component = component;
    if (to) {
      buttonProps.to = to;
    }
  }

  return <GradientButton {...buttonProps}>{label}</GradientButton>;
};

export default AppButton;
