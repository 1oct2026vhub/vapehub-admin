"use client";

import { Chip, ChipProps } from "@mui/material";
import { OrderStatus } from "@/services/apiOrder";

interface OrderStatusChipProps extends Omit<ChipProps, "color"> {
  status: OrderStatus;
  onClick?: () => void;
}

const OrderStatusChip = ({ status, onClick, ...rest }: OrderStatusChipProps) => {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "draft":
        return { label: "Draft", color: "default" };
      case "pending":
        return { label: "Pending", color: "info" };
      case "processing":
        return { label: "Processing", color: "primary" };
      case "shipped":
        return { label: "Shipped", color: "secondary" };
      case "delivered":
        return { label: "Delivered", color: "success" };
      case "completed":
        return { label: "Completed", color: "success" };
      case "fail":
        return { label: "Failed", color: "error" };
      case "cancel":
        return { label: "Cancelled", color: "error" };
      case "return_requested":
        return { label: "Return Requested", color: "warning" };
      case "return_approved":
        return { label: "Return Approved", color: "warning" };
      case "return_received":
        return { label: "Return Received", color: "warning" };
      case "refunded":
        return { label: "Refunded", color: "warning" };
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
      onClick={onClick}
      clickable={!!onClick}
      {...rest}
    />
  );
};

export default OrderStatusChip; 