"use client";

import { Chip, ChipProps } from "@mui/material";
import { PaymentStatus } from "@/services/apiOrder";

interface PaymentStatusChipProps extends Omit<ChipProps, 'label' | 'color'> {
  status: PaymentStatus;
}

const PaymentStatusChip = ({ status, ...props }: PaymentStatusChipProps) => {
  const getStatusConfig = (status: PaymentStatus): { label: string; color: ChipProps['color'] } => {
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
      color={color}
      size="small"
      {...props}
    />
  );
};

export default PaymentStatusChip;