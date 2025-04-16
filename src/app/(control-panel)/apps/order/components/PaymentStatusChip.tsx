"use client";

import { Chip, ChipProps } from "@mui/material";
import { PaymentStatus } from "@/services/apiOrder";

interface PaymentStatusChipProps extends Omit<ChipProps, "color"> {
  status: PaymentStatus;
}

const PaymentStatusChip = ({ status, ...rest }: PaymentStatusChipProps) => {
  // Get the exact color for the payment status
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#FF9800", // Orange
      paid: "#4CAF50", // Green
      failed: "#E53935", // Red
      refunded: "#607D8B", // Blue Grey
    };
    return colors[status.toLowerCase()] || "#9E9E9E"; // Default to grey
  };

  const getStatusConfig = (status: PaymentStatus) => {
    // Get display label based on status
    let label: string;
    
    switch (status) {
      case "pending":
        label = "Pending";
        break;
      case "paid":
        label = "Paid";
        break;
      case "failed":
        label = "Failed";
        break;
      case "refunded":
        label = "Refunded";
        break;
      default:
        label = status;
    }
    
    return { label, color: getStatusColor(status) };
  };

  const { label, color } = getStatusConfig(status);

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: color,
        color: "white",
        fontWeight: 500,
      }}
      {...rest}
    />
  );
};

export default PaymentStatusChip; 