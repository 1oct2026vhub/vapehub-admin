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
import { updateOrderStatus, OrderStatus } from "@/services/apiOrder";

type StatusStep = {
  id: string;
  label: string;
  date?: string;
  time?: string;
  description?: string;
  additionalInfo?: string;
  completed: boolean;
  active: boolean;
  icon: React.ReactNode;
};

interface OrderStatusTimelineProps {
  status: OrderStatus;
  orderDate: string;
  orderId?: number;
  onStatusUpdate?: (newStatus: OrderStatus) => void;
  orderHistory?: Array<{
    status: string;
    description?: string;
    createdAt: string;
    trackingInfo?: string;
  }>;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  status,
  orderDate,
  orderId,
  onStatusUpdate,
  orderHistory = [],
}) => {
  // State for cancel confirmation dialog
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Format date for display
  const formatDate = (dateString: string): { date: string; time: string } => {
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

  // Define status steps and their completion based on current status
  const getStatusSteps = (): StatusStep[] => {
    // Map status from API to our steps
    const statusMap: { [key: string]: number } = {
      pending: 0,
      processing: 1,
      packed: 1,
      shipped: 2,
      out_for_delivery: 3,
      delivered: 4,
      completed: 4,
      cancel: -1,
    };

    const currentStepIndex = statusMap[status] ?? 0;
    const isOrderCancelled = status === "cancel";

    // Find history items for each status
    const findHistoryItem = (statusToFind: string) => {
      return orderHistory?.find((item) => item.status === statusToFind);
    };

    // Format date from history or use order date for the first step
    const getDateForStatus = (
      statusToFind: string
    ): { date?: string; time?: string } => {
      const item = findHistoryItem(statusToFind);
      if (item) {
        const formatted = formatDate(item.createdAt);
        return { date: formatted.date, time: formatted.time };
      }
      if (statusToFind === "pending") {
        const formatted = formatDate(orderDate);
        return { date: formatted.date, time: formatted.time };
      }
      return {};
    };

    // Create base status steps
    const steps: StatusStep[] = [
      {
        id: "placed",
        label: "Order Placed",
        ...getDateForStatus("pending"),
        description: "An order has been placed.",
        completed: currentStepIndex >= 0 && !isOrderCancelled,
        active: currentStepIndex === 0 && !isOrderCancelled,
        icon: (
          <ShoppingBagOutlinedIcon
            color={
              currentStepIndex >= 0 && !isOrderCancelled
                ? "success"
                : "disabled"
            }
          />
        ),
      },
      {
        id: "packed",
        label: "Packed",
        ...getDateForStatus("packed"),
        description:
          findHistoryItem("packed")?.description ||
          "Your item has been picked up by courier partner",
        completed: currentStepIndex >= 1 && !isOrderCancelled,
        active: currentStepIndex === 1 && !isOrderCancelled,
        icon: (
          <InventoryOutlinedIcon
            color={
              currentStepIndex >= 1 && !isOrderCancelled
                ? "success"
                : "disabled"
            }
          />
        ),
      },
      {
        id: "shipped",
        label: "Shipping",
        ...getDateForStatus("shipped"),
        description: "Your item has been shipped.",
        additionalInfo: findHistoryItem("shipped")?.trackingInfo,
        completed: currentStepIndex >= 2 && !isOrderCancelled,
        active: currentStepIndex === 2 && !isOrderCancelled,
        icon: (
          <LocalShippingOutlinedIcon
            color={
              currentStepIndex >= 2 && !isOrderCancelled
                ? "success"
                : "disabled"
            }
          />
        ),
      },
      {
        id: "out_for_delivery",
        label: "Out For Delivery",
        ...getDateForStatus("out_for_delivery"),
        completed: currentStepIndex >= 3 && !isOrderCancelled,
        active: currentStepIndex === 3 && !isOrderCancelled,
        icon: (
          <DeliveryDiningIcon
            color={
              currentStepIndex >= 3 && !isOrderCancelled
                ? "success"
                : "disabled"
            }
          />
        ),
      },
      {
        id: "delivered",
        label: "Delivered",
        ...getDateForStatus("delivered"),
        completed: currentStepIndex >= 4 && !isOrderCancelled,
        active: currentStepIndex === 4 && !isOrderCancelled,
        icon: (
          <CheckCircleOutlineIcon
            color={
              currentStepIndex >= 4 && !isOrderCancelled
                ? "success"
                : "disabled"
            }
          />
        ),
      },
    ];

    // If order is cancelled, add cancelled status
    if (isOrderCancelled) {
      const cancelledItem = findHistoryItem("cancel");
      if (cancelledItem) {
        const formatted = formatDate(cancelledItem.createdAt);
        steps.push({
          id: "cancelled",
          label: "Order Cancelled",
          date: formatted.date,
          time: formatted.time,
          description:
            cancelledItem.description || "Your order has been cancelled.",
          completed: true,
          active: true,
          icon: <DoDisturbAltOutlinedIcon color="error" />,
        });
      }
    }

    return steps;
  };

  const statusSteps = getStatusSteps();
  const { date: formattedDate } = formatDate(orderDate);

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
        {statusSteps.map((step, index) => (
          <div key={step.id} className="flex mb-6 relative">
            {/* Vertical line connecting steps */}
            {index < statusSteps.length - 1 && (
              <div
                className={`absolute left-[20px] top-[28px] w-[2px] h-[calc(100%-8px)] ${
                  step.completed ? "bg-green-500" : "bg-gray-200"
                }`}
                style={{
                  bottom: index === statusSteps.length - 1 ? "0" : "auto",
                }}
              />
            )}

            {/* Status icon */}
            <div
              className={`relative flex items-center justify-center w-10 h-10 rounded-full mr-4 ${
                step.active
                  ? "bg-green-100"
                  : step.completed
                  ? "bg-green-100"
                  : "bg-gray-100"
              }`}
            >
              {step.icon}
            </div>

            {/* Status content */}
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <Typography
                  variant="subtitle1"
                  className={`font-medium ${
                    step.active ? "text-gray-800" : "text-gray-700"
                  }`}
                >
                  {step.label} {step.date && `- ${step.date}`}
                </Typography>
              </div>

              {step.time && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="mb-1"
                >
                  {step.time}
                </Typography>
              )}

              {step.description && (
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              )}

              {step.additionalInfo && (
                <Typography variant="body2" className="text-gray-600 mt-1">
                  {step.id === "shipped" && "Tracking ID: "}
                  {step.additionalInfo}
                </Typography>
              )}
            </div>
          </div>
        ))}
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
