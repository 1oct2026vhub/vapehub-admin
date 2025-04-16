"use client";

import { Chip, ChipProps } from "@mui/material";
import { OrderStatus } from "@/services/apiOrder";

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
    };
    return colors[status.toLowerCase()] || "#9E9E9E"; // Default to grey
  };

  const getStatusConfig = (status: OrderStatus) => {
    // Get display label based on status
    let label: string;
    
    switch (status) {
      case "draft":
        label = "Draft";
        break;
      case "pending":
        label = "Pending";
        break;
      case "processing":
        label = "Processing";
        break;
      case "shipped":
        label = "Shipped";
        break;
      case "delivered":
        label = "Delivered";
        break;
      case "completed":
        label = "Completed";
        break;
      case "fail":
        label = "Failed";
        break;
      case "cancel":
        label = "Cancelled";
        break;
      case "return_requested":
        label = "Return Requested";
        break;
      case "return_approved":
        label = "Return Approved";
        break;
      case "return_received":
        label = "Return Received";
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