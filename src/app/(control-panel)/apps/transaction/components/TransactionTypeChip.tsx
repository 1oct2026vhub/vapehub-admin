import React from "react";
import { Chip } from "@mui/material";
import { TransactionType } from "@/services/apiTransaction";

interface TransactionTypeChipProps {
  type: TransactionType;
  className?: string;
}

const TransactionTypeChip: React.FC<TransactionTypeChipProps> = ({
  type,
  className = "",
}) => {
  // Define styles based on transaction type
  const getTypeStyles = (type: TransactionType) => {
    switch (type) {
      case "purchase":
        return {
          bgcolor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "refund":
        return {
          bgcolor: "#E3F2FD",
          color: "#1565C0",
        };
      case "payout":
        return {
          bgcolor: "#FFF8E1",
          color: "#F57F17",
        };
      default:
        return {
          bgcolor: "#F5F5F5",
          color: "#757575",
        };
    }
  };

  const typeStyles = getTypeStyles(type);

  return (
    <Chip
      label={type}
      className={className}
      sx={{
        fontWeight: 600,
        fontSize: "0.75rem",
        ...typeStyles,
      }}
      size="small"
    />
  );
};

export default TransactionTypeChip; 