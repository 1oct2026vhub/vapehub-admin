"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Paper,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Divider,
  Chip,
  LinearProgress,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  getOrderById,
  Order,
  updateOrderStatus,
  OrderStatus,
} from "@/services/apiOrder";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import DeliveryDiningOutlinedIcon from "@mui/icons-material/DeliveryDiningOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import OrderStatusTimeline from "./OrderStatusTimeline";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate, formatPounds, formatStatusText } from "@/utils/actions";

const OrderDetailApp = () => {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { showSnackbar } = useSnackbar();

  // const [snackbar, setSnackbar] = useState({
  //   open: false,
  //   message: "",
  //   severity: "success" as "success" | "error",
  // });

  // Sample order history data - in a real app, this would come from the API
  // const [orderHistory, setOrderHistory] = useState([
  //   {
  //     status: "pending",
  //     description: "An order has been placed.",
  //     createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  //   },
  //   {
  //     status: "processing",
  //     description: "Seller has processed your order.",
  //     createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  //   },
  //   {
  //     status: "packed",
  //     description: "Your item has been picked up by courier partner",
  //     createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  //   },
  //   {
  //     status: "shipped",
  //     description: "Your item has been shipped.",
  //     trackingInfo: "MFDS1400457854",
  //     createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  //   },
  // ]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = parseInt(params.orderId as string);
        const response = await getOrderById(orderId);
        setOrder(response);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId]);

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // Calculate status progress
  const getStatusProgress = (status: string) => {
    const statuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "completed",
    ];
    const currentIndex = statuses.indexOf(status);
    return currentIndex !== -1
      ? (currentIndex / (statuses.length - 1)) * 100
      : 0;
  };

  // Handle status change
  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    if (!order) return;

    const newStatus = event.target.value as OrderStatus;
    setUpdatingStatus(true);

    try {
      const response = await updateOrderStatus(order.id, newStatus);
      
      // Fetch updated order data after status change to get fresh timeline and logs
      const updatedOrder = await getOrderById(order.id);
      setOrder(updatedOrder);
      
      if (response) {
        showSnackbar(response?.message, "success");
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      showSnackbar("Failed to update order status", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get color based on status
  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string, text: string }> = {
      pending: { bg: "#FFF4E5", text: "#FF9800" },
      processing: { bg: "#E8F4FD", text: "#2196F3" },
      shipped: { bg: "#E3F2FD", text: "#1E88E5" },
      delivered: { bg: "#E6F6EC", text: "#4CAF50" },
      completed: { bg: "#E6F6EC", text: "#4CAF50" },
      fail: { bg: "#FEEBEB", text: "#F44336" },
      cancel: { bg: "#F5F5F5", text: "#9E9E9E" },
      out_for_delivery: { bg: "#E0F7FA", text: "#00ACC1" },
      return_requested: { bg: "#FFF8E1", text: "#FFA000" },
      return_approved: { bg: "#FFF8E1", text: "#FFA000" },
      return_received: { bg: "#E8EAF6", text: "#3F51B5" },
      refunded: { bg: "#EDE7F6", text: "#673AB7" },
      packed: { bg: "#F1F8E9", text: "#8BC34A" },
    };
    
    return colors[status.toLowerCase()] || { bg: "#EEEEEE", text: "#616161" };
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Order Header */}
      <Paper className="p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconButton size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="font-bold">
              #{order?.order_unique_id || ""}
            </Typography>
          </div>
          <div className="flex items-center gap-4">
            {updatingStatus && <LinearProgress className="w-20" />}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="order-status-label">Status</InputLabel>
              <Select
                labelId="order-status-label"
                id="order-status"
                value={order?.status || ""}
                label="Status"
                onChange={handleStatusChange}
                disabled={updatingStatus}
                className="bg-white"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="fail">Failed</MenuItem>
                <MenuItem value="cancel">Cancelled</MenuItem>
                <MenuItem value="packed">Packed</MenuItem>
                <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                <MenuItem value="return_requested">Return Requested</MenuItem>
                <MenuItem value="return_approved">Return Approved</MenuItem>
                <MenuItem value="return_received">Return Received</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
        <Typography variant="body2" color="text.secondary">
          Order History / Order Details / {order?.order_unique_id} -{" "}
          {formatDate(order?.createdAt || "")}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Progress and Products */}
        <Grid item xs={12} md={8}>
          {/* Product Section */}
          <Paper className="p-4 mb-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <Typography variant="h6" className="font-medium">
                Order #{order?.order_unique_id || ""}
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "#2E9970",
                  color: "#2E9970",
                  "&:hover": {
                    borderColor: "#1d7d59",
                    backgroundColor: "rgba(46, 153, 112, 0.04)",
                  },
                }}
              >
                Export Invoice
              </Button>
            </div>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              Shipping Details 
            </Typography>
            <TableContainer className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHead className="bg-[#f0f7f4]">
                  <TableRow>
                    <TableCell
                      className="font-semibold text-gray-700"
                      sx={{ borderBottom: "2px solid #c9e7dc", py: 2 }}
                    >
                      Item
                    </TableCell>
                    <TableCell
                      className="font-semibold text-gray-700"
                      sx={{ borderBottom: "2px solid #c9e7dc", py: 2 }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      align="center"
                      className="font-semibold text-gray-700"
                      sx={{ borderBottom: "2px solid #c9e7dc", py: 2 }}
                    >
                      Quantity
                    </TableCell>
                    <TableCell
                      align="right"
                      className="font-semibold text-gray-700"
                      sx={{ borderBottom: "2px solid #c9e7dc", py: 2 }}
                    >
                      Price
                    </TableCell>
                    <TableCell
                      align="right"
                      className="font-semibold text-gray-700"
                      sx={{ borderBottom: "2px solid #c9e7dc", py: 2 }}
                    >
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order?.orderItems?.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                        "&:last-child td, &:last-child th": { border: 0 },
                        transition: "background-color 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            {item.product?.ProductImages &&
                            item.product.ProductImages.length > 0 ? (
                              <img
                                src={
                                  (item.product.ProductImages[0] as any)
                                    .image_url ||
                                  item.product.ProductImages[0].url
                                }
                                alt={item.product.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder-image.png";
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-500">
                                No img
                              </span>
                            )}
                          </div>
                          <div>
                            <Typography
                              variant="body1"
                              className="font-medium text-gray-800"
                            >
                              {item.product.name}
                            </Typography>
                            {/* Display Variant Attributes if they exist */}
                            {(item.variant as any)?.variantAttributes && ((item.variant as any).variantAttributes as any[]).length > 0 ? (
                              <Box sx={{ mt: 0.5 }}>
                                {((item.variant as any).variantAttributes as any[]).map((attr: any, index: number) => (
                                  <Typography
                                    key={index}
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', textTransform: 'capitalize' }}
                                  >
                                    {attr.attribute.name}: {attr.term.name}
                                  </Typography>
                                ))}
                              </Box>
                            ) : (item.variant as any)?.slug ? ( // Fallback to slug if no attributes
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Variant: {(item.variant as any).slug}
                              </Typography>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.status && (
                          <Chip
                            label={formatStatusText(order.status)}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(order.status).bg,
                              color: getStatusColor(order.status).text,
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center" className="font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" className="font-medium">
                        {formatPounds(item.unit_price)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="font-medium text-gray-800"
                      >
                        {formatPounds(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow
                    sx={{
                      backgroundColor: "#f0f7f4",
                      fontWeight: "bold",
                      "& td": {
                        borderTop: "2px solid #c9e7dc",
                        fontWeight: 600,
                        py: 2,
                      },
                    }}
                  >
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Sub Total:
                    </TableCell>
                    <TableCell align="right" className="font-semibold">
                      {formatPounds(
                        order?.orderItems?.reduce(
                          (sum, item) =>
                            sum + Number(item.unit_price) * item.quantity,
                          0
                        ) || 0
                      )}
                    </TableCell>
                    <TableCell align="right" className="font-semibold">
                      {formatPounds(order?.total || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Order Status Timeline */}
          {order && (
            <OrderStatusTimeline
              status={order.status}
              orderDate={order.createdAt}
              orderId={order.id}
              onStatusUpdate={(newStatus) => {
                // After status update, fetch fresh order data to update the timeline
                const fetchUpdatedOrder = async () => {
                  try {
                    const updatedOrder = await getOrderById(order.id);
                    setOrder(updatedOrder);
                  } catch (err) {
                    console.error("Error fetching updated order:", err);
                  }
                };
                
                // First update local state for immediate UI feedback
                setOrder({ ...order, status: newStatus });
                // Then fetch the full updated order data
                fetchUpdatedOrder();
              }}
              orderLogs={order.orderLogs || []}
              statusTimeline={order.statusTimeline || []}
            />
          )}
        </Grid>

        {/* Right Column - Payment and Customer Info */}
        <Grid item xs={12} md={4}>
          {/* Payment Section */}
          <Paper className="p-4 mb-3 bg-white">
            <div className="flex justify-between items-center mb-3">
              <Typography variant="h6" className="font-medium">
                Payment Details
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "#2E9970",
                  color: "#2E9970",
                  "&:hover": {
                    borderColor: "#1d7d59",
                    backgroundColor: "rgba(46, 153, 112, 0.04)",
                  },
                }}
              >
                Download Invoice
              </Button>
            </div>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              Final Payment Amount
            </Typography>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">
                  {formatPounds(order?.total || 0)}
                </Typography>
              </div>
              {order?.discount_price && (
                <div className="flex justify-between">
                  <Typography variant="body2">Discount (10%)</Typography>
                  <Typography variant="body2" color="error">
                    -{formatPounds(order.discount_price)}
                  </Typography>
                </div>
              )}
              <div className="flex justify-between">
                <Typography variant="body2">Shipping Cost</Typography>
                <Typography variant="body2">{formatPounds(order?.shipping_cost || 0)}</Typography>
              </div>
              <Divider />
              <div className="flex justify-between">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatPounds(order?.total || 0)}
                </Typography>
              </div>
            </div>
          </Paper>

          {/* Customer Details */}
          <Paper className="p-0 mb-3 overflow-hidden bg-white">
            {/* Header with View Profile button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Typography variant="h6" className="font-medium">
                Customer Details
              </Typography>
              {/* <Button size="small" variant="text" sx={{ color: "#6366F1" }}>
                View Profile
              </Button> */}
            </div>

            {/* Customer basic info with profile image */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-md overflow-hidden bg-orange-100">
                  {order?.user?.profile_pic_url ? (
                    <img
                      src={order.user.profile_pic_url}
                      alt={`${order.user.first_name} ${order.user.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-orange-300 to-orange-400 text-white text-xl font-bold">
                      {order?.user?.first_name?.charAt(0) || ""}
                      {order?.user?.last_name?.charAt(0) || ""}
                    </div>
                  )}
                </div>
                <div>
                  <Typography variant="h6" className="font-medium">
                    {order?.user?.first_name} {order?.user?.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer ID: {order?.user?.id}
                  </Typography>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mt-3 text-gray-600">
                  <MailOutlineIcon fontSize="small" sx={{ color: "#6B7280" }} />
                  <Typography variant="body2">{order?.user?.email}</Typography>
                </div>
                {order?.user?.phone && (
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <PhoneIcon fontSize="small" sx={{ color: "#6B7280" }} />
                    <Typography variant="body2">
                      {order?.user?.phone}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          </Paper>

          {/* Billing Address */}
          <Paper className="p-0 mb-3 overflow-hidden bg-white">
            {/* Header with View Profile button */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <LocationOnIcon fontSize="small" sx={{ color: "#6B7280" }} />
              <Typography variant="h6" className="font-medium">
                Billing Details
              </Typography>
            </div>

            {order?.orderBillingAddress && (
              <div className="p-4">
                <Typography variant="body1" className="font-medium">
                  {order.orderBillingAddress.name} {order.orderBillingAddress.last_name}
                </Typography>

                {order.orderBillingAddress.phone && (
                  <Typography variant="body2" className="text-gray-600 mt-2">
                  {order.orderBillingAddress.phone}</Typography>
                   )}

                <Typography variant="body2" className="text-gray-600 mt-2">
                  {order.orderBillingAddress.street}
                  {order.orderBillingAddress.apartment
                    ? `, ${order.orderBillingAddress.apartment}`
                    : ""}
                </Typography>

                <Typography variant="body2" className="text-gray-600">
                  {order.orderBillingAddress.town} - {order.orderBillingAddress.post_code}
                </Typography>

                <Typography variant="body2" className="text-gray-600">
                  {order.orderBillingAddress.country}
                </Typography>
              </div>
            )}
          </Paper>

          {/* Shipping Address */}
          <Paper className="p-0 overflow-hidden bg-white">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <LocationOnIcon fontSize="small" sx={{ color: "#6B7280" }} />
              <Typography variant="h6" className="font-medium">
                Shipping Details
              </Typography>
            </div>

            {order?.orderShippingAddress && (
              <div className="p-4">
                <Typography variant="body1" className="font-medium">
                  {order.orderShippingAddress.name} {order.orderShippingAddress.last_name}
                </Typography>

                {order.orderShippingAddress.phone && (
                  <Typography variant="body2" className="text-gray-600 mt-2">
                    {order.orderShippingAddress.phone}
                  </Typography>
                )}

                <Typography variant="body2" className="text-gray-600 mt-2">
                  {order.orderShippingAddress.street}
                  {order.orderShippingAddress.apartment
                    ? `, ${order.orderShippingAddress.apartment}`
                    : ""}
                </Typography>

                <Typography variant="body2" className="text-gray-600">
                  {order.orderShippingAddress.town} -{" "}
                  {order.orderShippingAddress.post_code}
                </Typography>

                <Typography variant="body2" className="text-gray-600">
                  {order.orderShippingAddress.country}
                </Typography>
              </div>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      {/* <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar> */}
    </div>
  );
};

export default OrderDetailApp;
