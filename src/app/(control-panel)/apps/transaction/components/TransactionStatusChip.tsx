import React from "react";
import { Chip } from "@mui/material";
import { TransactionStatus } from "@/services/apiTransaction";

interface TransactionStatusChipProps {
  status: TransactionStatus;
  className?: string;
}

const TransactionStatusChip: React.FC<TransactionStatusChipProps> = ({
  status,
  className = "",
}) => {
  // Define styles based on status
  const getStatusStyles = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return {
          bgcolor: "#E6F6EC",
          color: "#4CAF50",
        };
      case "pending":
        return {
          bgcolor: "#FFF4E5",
          color: "#FF9800",
        };
      case "fail":
        return {
          bgcolor: "#FEEBEB",
          color: "#F44336",
        };
      case "refunded":
        return {
          bgcolor: "#EBF7FF",
          color: "#2196F3",
        };
      case "cancel":
        return {
          bgcolor: "#F5F5F5",
          color: "#9E9E9E",
        };
      case "processing":
        return {
          bgcolor: "#E3F2FD",
          color: "#1976D2",
        };
      case "shipped":
        return {
          bgcolor: "#E8EAF6",
          color: "#3F51B5",
        };
      case "delivered":
        return {
          bgcolor: "#E0F2F1",
          color: "#009688",
        };
      case "return_requested":
      case "return_approved":
      case "return_received":
        return {
          bgcolor: "#F3E5F5",
          color: "#9C27B0",
        };
      default:
        return {
          bgcolor: "#F5F5F5",
          color: "#757575",
        };
    }
  };

  const statusStyles = getStatusStyles(status);

  return (
    <Chip
      label={status}
      className={className}
      sx={{
        fontWeight: 600,
        fontSize: "0.75rem",
        ...statusStyles,
      }}
      size="small"
    />
  );
};

export default TransactionStatusChip; 