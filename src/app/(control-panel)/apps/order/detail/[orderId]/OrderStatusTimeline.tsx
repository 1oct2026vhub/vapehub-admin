import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditLocationAltOutlinedIcon from "@mui/icons-material/EditLocationAltOutlined";
import DoDisturbAltOutlinedIcon from "@mui/icons-material/DoDisturbAltOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import { updateOrderStatus, OrderStatus } from "@/services/apiOrder";

// Helper function to format status text
const formatStatusText = (status: string): string => {
  if (!status) return '';
  
  // Replace underscores with spaces and capitalize each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Define the structure of a status timeline item from API
interface StatusTimelineItem {
  status: string;
  label: string;
  icon: string;
  achieved: boolean;
  current: boolean;
  timestamp: string;
  skipped: boolean;
}

// Define the structure of an order log item from API
interface OrderLogItem {
  id: number;
  status: string;
  label: string;
  additional_info: string | null;
  createdAt: string;
  user: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    profile_pic_url: string | null;
  };
}

interface OrderStatusTimelineProps {
  status: OrderStatus;
  orderDate: string;
  orderId?: number;
  onStatusUpdate?: (newStatus: OrderStatus) => void;
  statusTimeline?: StatusTimelineItem[];
  orderLogs?: OrderLogItem[];
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  status,
  orderDate,
  orderId,
  onStatusUpdate,
  statusTimeline = [],
  orderLogs = [],
}) => {
  // State for cancel confirmation dialog
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if a date is valid and not epoch/1970
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.getFullYear() > 1970;
  };

  // Format date for display
  const formatDate = (dateString: string): { date: string; time: string } => {
    if (!dateString || !isValidDate(dateString)) {
      return {
        date: "",
        time: ""
      };
    }
    
    const date = new Date(dateString);
    
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!orderId) {
      setErrorMessage("Order ID is missing");
      return;
    }

    setIsCancelling(true);
    setErrorMessage("");

    try {
      // Call the API to update order status to "cancel"
      await updateOrderStatus(orderId, "cancel");

      // Close the dialog and notify parent component
      setOpenCancelDialog(false);
      if (onStatusUpdate) {
        onStatusUpdate("cancel" as OrderStatus);
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      setErrorMessage("Failed to cancel the order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Open cancel confirmation dialog
  const openCancelConfirmation = () => {
    setOpenCancelDialog(true);
  };

  // Get the icon component based on the icon name from API
  const getIconComponent = (iconName: string, isActive: boolean) => {
    const color = isActive ? "success" : "disabled";
    
    switch (iconName) {
      case "shopping-cart":
        return <ShoppingBagOutlinedIcon color={color} />;
      case "cog":
        return <SettingsIcon color={color} />;
      case "box":
        return <InventoryOutlinedIcon color={color} />;
      case "truck":
        return <LocalShippingOutlinedIcon color={color} />;
      case "truck-loading":
        return <DeliveryDiningIcon color={color} />;
      case "check-circle":
        return <CheckCircleOutlineIcon color={color} />;
      case "cancel":
        return <CancelOutlinedIcon color="error" />;
      default:
        return <ShoppingBagOutlinedIcon color={color} />;
    }
  };

  // Find the most recent log entry for a specific status
  const findLatestLogForStatus = (statusToFind: string): OrderLogItem | undefined => {
    const filteredLogs = orderLogs.filter(log => log.status === statusToFind);
    if (filteredLogs.length === 0) return undefined;
    
    // Sort by createdAt in descending order and return the first one
    return filteredLogs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  // Sort timeline items to ensure correct order
  const sortedTimeline = [...statusTimeline].sort((a, b) => {
    const statusOrder = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancel'];
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
  });

  // Find the index of the current status in the timeline
  const currentStatusIndex = sortedTimeline.findIndex(item => item.current);

  return (
    <Paper className="p-4 mb-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6" className="font-medium">
          Order Status
        </Typography>
        <div className="flex gap-2">
          {/* <Button
            variant="outlined"
            startIcon={<EditLocationAltOutlinedIcon />}
            size="small"
            sx={{
              borderColor: '#0ea5e9',
              color: '#0ea5e9',
              backgroundColor: 'rgba(224, 242, 254, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(224, 242, 254, 0.8)',
                borderColor: '#0284c7',
              },
            }}
          >
            Change Address
          </Button> */}
          {status !== "cancel" &&
            status !== "completed" &&
            status !== "delivered" && (
              <Button
                variant="outlined"
                startIcon={<DoDisturbAltOutlinedIcon />}
                size="small"
                color="error"
                onClick={openCancelConfirmation}
                sx={{
                  backgroundColor: "rgba(254, 226, 226, 0.5)",
                  "&:hover": {
                    backgroundColor: "rgba(254, 226, 226, 0.8)",
                  },
                }}
              >
                Cancel Order
              </Button>
            )}
        </div>
      </div>

      <div className="relative">
        {sortedTimeline.map((step, index) => {
          // Find the latest log for this status
          const logItem = findLatestLogForStatus(step.status);
          
          // Get the timestamp to use - For pending status, use orderDate if timestamp is invalid
          let timestampToUse = step.timestamp;
          if (step.status === "pending" && !isValidDate(step.timestamp)) {
            timestampToUse = orderDate;
          }
          
          // Format the date using the determined timestamp or log timestamp
          const { date: formattedDate, time: formattedTime } = logItem 
            ? formatDate(logItem.createdAt) 
            : formatDate(timestampToUse);
          
          // Determine if this step is completed or active
          const isCompleted = index <= currentStatusIndex;
          
          // Use formatStatusText to format the status if no label is provided
          const displayLabel = step.label || formatStatusText(step.status);
          
          return (
            <div key={step.status} className="flex mb-6 relative">
              {/* Vertical line connecting steps */}
              {index < sortedTimeline.length - 1 && (
                <div
                  className={`absolute left-[20px] top-[28px] w-[2px] h-[calc(100%-8px)] ${
                    isCompleted && status !== "cancel" ? "bg-green-500" : "bg-gray-200"
                  }`}
                  style={{
                    bottom: index === sortedTimeline.length - 1 ? "0" : "auto",
                  }}
                />
              )}

              {/* Status icon */}
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-full mr-4 ${
                  step.status === "cancel" 
                    ? "bg-red-100"
                    : step.current
                    ? "bg-green-100"
                    : isCompleted && status !== "cancel"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                {step.status === "cancel" 
                  ? getIconComponent("cancel", true)
                  : getIconComponent(step.icon, isCompleted && status !== "cancel")}
              </div>

              {/* Status content */}
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <Typography
                    variant="subtitle1"
                    className={`font-medium ${
                      step.status === "cancel" 
                      ? "text-red-600"
                      : step.current 
                      ? "text-gray-800" 
                      : "text-gray-700"
                    }`}
                  >
                    {displayLabel} {((isCompleted && status !== "cancel") || step.status === "cancel") && formattedDate && `- ${formattedDate}`}
                  </Typography>
                </div>

                {((isCompleted && status !== "cancel") || step.status === "cancel") && formattedTime && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="mb-1"
                  >
                    {formattedTime}
                  </Typography>
                )}

                {((isCompleted && status !== "cancel") || step.status === "cancel") && logItem?.additional_info && (
                  <Typography variant="body2" color="text.secondary">
                    {logItem.additional_info}
                  </Typography>
                )}

                {/* Show default descriptions if no additional_info is provided */}
                {/* {isCompleted && !logItem?.additional_info && (
                  <Typography variant="body2" color="text.secondary">
                    {step.status === "pending" && "An order has been placed."}
                    {step.status === "packed" && "Your item has been picked up by courier partner"}
                    {step.status === "shipped" && "Your item has been shipped."}
                  </Typography>
                )} */}

                {((isCompleted && status !== "cancel") || step.status === "cancel") && step.status === "shipped" && logItem?.additional_info && (
                  <Typography variant="body2" className="text-gray-600 mt-1">
                    Tracking ID: {logItem.additional_info}
                  </Typography>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel this order?
          </DialogContentText>
          {errorMessage && (
            <Typography color="error" variant="body2" className="mt-2">
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenCancelDialog(false)}
            disabled={isCancelling}
          >
            No, Keep Order
          </Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={isCancelling}
            startIcon={
              isCancelling ? (
                <CircularProgress size={20} />
              ) : (
                <DoDisturbAltOutlinedIcon />
              )
            }
          >
            {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default OrderStatusTimeline;
