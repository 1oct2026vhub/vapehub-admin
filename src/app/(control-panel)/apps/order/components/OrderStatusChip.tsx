"use client";

import { Chip, ChipProps } from "@mui/material";
import { OrderStatus } from "@/services/apiOrder";
import { formatStatusText } from "@/utils/actions";

interface OrderStatusChipProps extends Omit<ChipProps, "color"> {
  status: OrderStatus;
  onClick?: () => void;
}

const OrderStatusChip = ({ status, onClick, ...rest }: OrderStatusChipProps) => {
  // Get the exact color for the status to match the OrderStatistics component
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#FF9800", // Orange
      processing: "#2196F3", // Blue
      shipped: "#9C27B0", // Purple
      completed: "#009688", // Teal
      failed: "#E53935", // Red
      cancelled: "#795548", // Brown
      fail: "#E53935", // Red (alternative name)
      cancel: "#795548", // Brown (alternative name)
      draft: "#9E9E9E", // Grey
      return_requested: "#FF5722", // Deep Orange
      return_approved: "#FF9800", // Orange
      return_received: "#9E9E9E", // Grey
      refunded: "#607D8B", // Blue Grey
      out_for_delivery: "#00ACC1", // Cyan
      delivered: "#4CAF50", // Green
      packed: "#8BC34A", // Light Green
    };
    return colors[status.toLowerCase()] || "#9E9E9E"; // Default to grey
  };

  // Use the formatStatusText helper function to get a properly formatted label
  const label = formatStatusText(status);
  const color = getStatusColor(status);

  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      clickable={!!onClick}
      sx={{
        backgroundColor: color,
        color: "white",
        fontWeight: 500,
      }}
      {...rest}
    />
  );
};

export default OrderStatusChip; 