"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { getOrderById, updateOrderStatus, OrderStatus, Order } from "@/services/apiOrder";
import OrderStatusChip from "../components/OrderStatusChip";
import PaymentStatusChip from "../components/PaymentStatusChip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FuseLoading from "@fuse/core/FuseLoading";

interface OrderDetailProps {
  orderId: number;
}

const OrderDetail = ({ orderId }: OrderDetailProps) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(orderId);
      setOrder(data);
      setNewStatus(data.status);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOrders = () => {
    router.push("/apps/order");
  };

  const handleOpenStatusDialog = () => {
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setNewStatus(event.target.value as OrderStatus);
  };

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;

    try {
      await updateOrderStatus(order.id, newStatus as OrderStatus);
      
      // Update local state
      setOrder({
        ...order,
        status: newStatus as OrderStatus,
      });
      
      handleCloseStatusDialog();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={5}>
        <FuseLoading />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box p={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={handleBackToOrders}
          sx={{ mb: 3 }}
        >
          Back to Orders
        </Button>
        <Typography variant="h5" color="error">
          Order not found or error loading order details.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={handleBackToOrders}
        >
          Back to Orders
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenStatusDialog}
        >
          Update Status
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            Order #{order.order_number}
          </Typography>
          <OrderStatusChip status={order.status} />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Placed on {new Date(order.created_at).toLocaleString()}
        </Typography>

        <Grid container spacing={3} mt={1}>
          {/* Customer Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Customer Information</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {order.user ? (
                  <>
                    <Typography variant="body1" fontWeight="medium">
                      {order.user.first_name} {order.user.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.user.email}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1">Guest Customer</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <PaymentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Payment Information</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Method:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {order.payment_method}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Status:</Typography>
                  <PaymentStatusChip status={order.payment_status} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Shipping Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocalShippingIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Shipping Information</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </Typography>
                <Typography variant="body2">
                  {order.shipping_address.address_line1}
                </Typography>
                {order.shipping_address.address_line2 && (
                  <Typography variant="body2">
                    {order.shipping_address.address_line2}
                  </Typography>
                )}
                <Typography variant="body2">
                  {order.shipping_address.city}, {order.shipping_address.state}{" "}
                  {order.shipping_address.postal_code}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {order.shipping_address.country}
                </Typography>
                <Typography variant="body2">
                  {order.shipping_address.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shipping_address.email}
                </Typography>
                {order.tracking_number && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                      Tracking Number:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {order.tracking_number}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Billing Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Billing Information</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  {order.billing_address.first_name} {order.billing_address.last_name}
                </Typography>
                <Typography variant="body2">
                  {order.billing_address.address_line1}
                </Typography>
                {order.billing_address.address_line2 && (
                  <Typography variant="body2">
                    {order.billing_address.address_line2}
                  </Typography>
                )}
                <Typography variant="body2">
                  {order.billing_address.city}, {order.billing_address.state}{" "}
                  {order.billing_address.postal_code}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {order.billing_address.country}
                </Typography>
                <Typography variant="body2">
                  {order.billing_address.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.billing_address.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Order Items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Order Items</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Variant</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {item.product.image && (
                        <Box
                          component="img"
                          sx={{
                            width: 50,
                            height: 50,
                            objectFit: "cover",
                            mr: 2,
                            borderRadius: 1,
                          }}
                          src={item.product.image}
                          alt={item.product.name}
                        />
                      )}
                      <Typography variant="body2" fontWeight="medium">
                        {item.product.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {item.variant?.attributes?.map((attr, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        {attr.attribute}: {attr.value}
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(item.price)}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={3} p={2} bgcolor="background.default" borderRadius={1}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6} md={8} />
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(order.subtotal)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Shipping:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(order.shipping_cost)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Tax:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(order.tax)}
                </Typography>
              </Box>
              {order.discount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="error">
                    -{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(order.discount)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(order.total)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Notes */}
      {order.notes && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Order Notes
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2">{order.notes}</Typography>
        </Paper>
      )}

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Change the status for order #{order.order_number}
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="update-status-label">Status</InputLabel>
            <Select
              labelId="update-status-label"
              value={newStatus}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="fail">Failed</MenuItem>
              <MenuItem value="cancel">Cancelled</MenuItem>
              <MenuItem value="return_requested">Return Requested</MenuItem>
              <MenuItem value="return_approved">Return Approved</MenuItem>
              <MenuItem value="return_received">Return Received</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateStatus}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail; 