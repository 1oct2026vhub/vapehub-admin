"use client";

import { Chip, ChipProps } from "@mui/material";
import { OrderStatus } from "@/services/apiOrder";

interface OrderStatusChipProps extends Omit<ChipProps, "label" | "color"> {
  status: OrderStatus;
  onClick?: () => void;
}

const OrderStatusChip = ({
  status,
  onClick,
  ...props
}: OrderStatusChipProps) => {
  const getStatusConfig = (
    status: OrderStatus
  ): { label: string; color: ChipProps["color"] } => {
    switch (status) {
      case "draft":
        return { label: "Draft", color: "default" };
      case "pending":
        return { label: "Pending", color: "warning" };
      case "processing":
        return { label: "Processing", color: "info" };
      case "shipped":
        return { label: "Shipped", color: "primary" };
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
        return { label: "Return Approved", color: "info" };
      case "return_received":
        return { label: "Return Received", color: "info" };
      case "refunded":
        return { label: "Refunded", color: "secondary" };
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
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        minWidth: "120px",
        justifyContent: "center",
      }}
      {...props}
    />
  );
};

export default OrderStatusChip;
