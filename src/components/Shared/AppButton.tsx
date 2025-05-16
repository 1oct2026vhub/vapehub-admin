import React, { ElementType } from "react";
import Button, { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { styled, SxProps, Theme } from "@mui/material/styles";

export interface AppButtonProps {
  label: React.ReactNode;
  component?: ElementType;
  to?: string;
  onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
  type?: "button" | "submit" | "reset";
  variant?: "text" | "outlined" | "contained";
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
  loading?: boolean;
  disableGradient?: boolean;
  sx?: SxProps<Theme>;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

interface GradientButtonStyledProps extends MuiButtonProps {
  disableGradient?: boolean;
}

const GradientButton = styled(Button, {
  shouldForwardProp: (propName) => propName !== 'disableGradient',
})<GradientButtonStyledProps>(({ theme, disabled, disableGradient, variant }) => {
  
  if (!disableGradient && (variant === 'contained' || variant === undefined)) {
    const styles: any = {
      background: disabled
        ? 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.1))'
        : 'linear-gradient(to bottom, #2E9970, #005434)',
      color: disabled ? 'rgba(0,0,0,0.3)' : '#fff',
      '&:hover': {
        background: disabled
          ? 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.1))'
          : 'linear-gradient(to bottom, #247C5C, #003F29)',
      },
      '&.Mui-disabled': {
        background: 'rgba(0,0,0,0.12)',
        color: 'rgba(0,0,0,0.26)',
      }
    };
    return styles;
  }
  return {};
});

const AppButton: React.FC<AppButtonProps> = ({
  label,
  component,
  to,
  onClick,
  type = "button",
  variant = "contained",
  disabled = false,
  fullWidth = false,
  size = "medium",
  className = "",
  loading = false,
  disableGradient = false,
  sx,
  startIcon,
  endIcon,
}) => {
  const buttonProps: GradientButtonStyledProps & { component?: ElementType; to?: string; sx?: SxProps<Theme>; startIcon?: React.ReactNode; endIcon?: React.ReactNode } = {
    onClick,
    type,
    variant,
    disabled: disabled || loading,
    fullWidth,
    size,
    className,
    disableGradient,
    sx,
    startIcon,
    endIcon,
  };

  if (component) {
    buttonProps.component = component;
    if (to) {
      buttonProps.to = to;
    }
  }

  return (
    <GradientButton {...buttonProps}>
      {loading ? <CircularProgress size={20} color="inherit" /> : label}
    </GradientButton>
  );
};

export default AppButton;
