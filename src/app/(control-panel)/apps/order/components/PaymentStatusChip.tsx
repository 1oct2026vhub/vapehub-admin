"use client";

import { Chip, ChipProps } from "@mui/material";
import { PaymentStatus } from "@/services/apiOrder";

interface PaymentStatusChipProps extends Omit<ChipProps, "color"> {
  status: PaymentStatus;
}

const PaymentStatusChip = ({ status, ...rest }: PaymentStatusChipProps) => {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "warning" };
      case "paid":
        return { label: "Paid", color: "success" };
      case "failed":
        return { label: "Failed", color: "error" };
      case "refunded":
        return { label: "Refunded", color: "info" };
      default:
        return { label: status, color: "default" };
    }
  };

  const { label, color } = getStatusConfig(status);

  return (
    <Chip
      label={label}
      color={color as ChipProps["color"]}
      size="small"
      {...rest}
    />
  );
};

export default PaymentStatusChip; 