"use client";

import { useState } from "react";
import { Button, CircularProgress, Tooltip } from "@mui/material";
import { OrderStatus, PaymentStatus, generateOrderReport } from "@/services/apiOrder";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface GenerateReportButtonProps {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  className?: string;
}

const GenerateReportButton = ({
  status,
  paymentStatus,
  startDate,
  endDate,
  className,
}: GenerateReportButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
      // Call the export function which now handles the download directly
      await generateOrderReport(status, paymentStatus, startDate, endDate);
      
      // Show success message
      showSnackbar("Excel report downloaded successfully", "success");
    } catch (error) {
      console.error("Failed to generate report:", error);
      
      // Show appropriate error message based on error type
      if (error.response && error.response.status === 401) {
        showSnackbar("Authentication error. Please log in again.", "error");
      } else if (error.response && error.response.status === 404) {
        showSnackbar("Export API endpoint not found. Please contact administrator.", "error");
      } else {
        showSnackbar(
          "Failed to download Excel report. Please try again later.", 
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Download Excel Report">
      <span className={className}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={loading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
          onClick={handleGenerateReport}
          disabled={loading}
          size="small"
        >
          {loading ? "Generating..." : "Export Excel"}
        </Button>
      </span>
    </Tooltip>
  );
};

export default GenerateReportButton; 