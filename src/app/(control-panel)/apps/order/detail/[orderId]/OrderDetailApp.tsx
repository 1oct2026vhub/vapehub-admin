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
} from "@mui/material";
import { getOrderById, Order } from "@/services/apiOrder";
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

const OrderDetailApp = () => {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
    const statuses = ["pending", "processing", "shipped", "delivered", "completed"];
    const currentIndex = statuses.indexOf(status);
    return currentIndex !== -1 ? (currentIndex / (statuses.length - 1)) * 100 : 0;
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Order Header */}
      <Paper className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconButton size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="font-bold">
              #{order?.order_unique_id || ""}
            </Typography>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              size="small"
            >
              Delete Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              size="small"
            >
              Track Order
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              size="small"
              color="primary"
            >
              Edit Order
            </Button>
          </div>
        </div>
        <Typography variant="body2" color="text.secondary">
          Order History / Order Details / {order?.order_unique_id} - {formatDate(order?.createdAt || "")}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Progress and Products */}
        <Grid item xs={12} md={8}>
          {/* Progress Section */}
          <Paper className="p-4 mb-3">
            <Typography variant="h6" className="mb-2 font-medium">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              Current Order Status
            </Typography>
            
            <Grid container spacing={2} className="mb-2">
              <Grid item xs={2} className="text-center">
                <CheckCircleOutlineIcon color={order?.status === "pending" || order?.status === "processing" || order?.status === "shipped" || order?.status === "delivered" ? "primary" : "disabled"} />
                <Typography variant="body2" className="mt-1">
                  Order Confirming
                </Typography>
              </Grid>
              <Grid item xs={2} className="text-center">
                <MailOutlineIcon color={order?.status === "processing" || order?.status === "shipped" || order?.status === "delivered" ? "primary" : "disabled"} />
                <Typography variant="body2" className="mt-1">
                  Payment Pending
                </Typography>
              </Grid>
              <Grid item xs={2} className="text-center">
                <LocalShippingOutlinedIcon color={order?.status === "processing" || order?.status === "shipped" || order?.status === "delivered" ? "primary" : "disabled"} />
                <Typography variant="body2" className="mt-1">
                  Processing
                </Typography>
              </Grid>
              <Grid item xs={2} className="text-center">
                <DeliveryDiningOutlinedIcon color={order?.status === "shipped" || order?.status === "delivered" ? "primary" : "disabled"} />
                <Typography variant="body2" className="mt-1">
                  Shipping
                </Typography>
              </Grid>
              <Grid item xs={2} className="text-center">
                <CheckCircleOutlineIcon color={order?.status === "delivered" ? "primary" : "disabled"} />
                <Typography variant="body2" className="mt-1">
                  Delivered
                </Typography>
              </Grid>
            </Grid>
            
            <LinearProgress
              variant="determinate"
              value={order ? getStatusProgress(order.status) : 0}
              className="h-1 rounded-full"
              color="primary"
            />
          </Paper>

          {/* Product Section */}
          <Paper className="p-4">
            <div className="flex justify-between items-center mb-3">
              <Typography variant="h6" className="font-medium">
                Product
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                variant="outlined"
              >
                Download CSV
              </Button>
            </div>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              Your Shipment
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Tax</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order?.orderItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            {item.product.ProductImages && item.product.ProductImages.length > 0 ? (
                              <img 
                                src={item.product.ProductImages[0].url} 
                                alt={item.product.name} 
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <span className="text-xs text-gray-500">No img</span>
                            )}
                          </div>
                          <div>
                            <Typography variant="body1">{item.product.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Variant: {item.variant.slug}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          className="bg-green-100 text-green-800"
                        />
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell align="right">$0.00</TableCell>
                      <TableCell align="right">${Number(item.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Column - Payment and Customer Info */}
        <Grid item xs={12} md={4}>
          {/* Payment Section */}
          <Paper className="p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <Typography variant="h6" className="font-medium">
                Payment
              </Typography>
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                variant="outlined"
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
                <Typography variant="body2">${Number(order?.total || 0).toFixed(2)}</Typography>
              </div>
              {order?.discount_price && (
                <div className="flex justify-between">
                  <Typography variant="body2">Discount (10%)</Typography>
                  <Typography variant="body2" color="error">-${Number(order.discount_price).toFixed(2)}</Typography>
                </div>
              )}
              <div className="flex justify-between">
                <Typography variant="body2">Shipping Cost</Typography>
                <Typography variant="body2">$0.00</Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="body2">Tax (8%)</Typography>
                <Typography variant="body2">$0.00</Typography>
              </div>
              <Divider />
              <div className="flex justify-between">
                <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                <Typography variant="subtitle1" fontWeight="bold">${Number(order?.total || 0).toFixed(2)}</Typography>
              </div>
            </div>
          </Paper>

          {/* Customer Information */}
          <Paper className="p-4">
            <Typography variant="h6" className="font-medium mb-3">
              Customer
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-4">
              Information Detail
            </Typography>
            
            <div className="space-y-4">
              {/* General Information */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PersonOutlineOutlinedIcon fontSize="small" />
                  <Typography variant="subtitle2">General Information</Typography>
                </div>
                <ul className="list-disc pl-6 space-y-1">
                  <li className="text-gray-700">
                    {order?.user.first_name && order?.user.last_name 
                      ? `${order.user.first_name} ${order.user.last_name}`
                      : "N/A"}
                  </li>
                  <li className="text-gray-700">{order?.user.email || "N/A"}</li>
                  <li className="text-gray-700">{order?.user.phone || "N/A"}</li>
                </ul>
              </div>
              
              {/* Shipping Address */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HomeOutlinedIcon fontSize="small" />
                  <Typography variant="subtitle2">Shipping Address</Typography>
                </div>
                {order?.shippingAddress && (
                  <ul className="list-disc pl-6 space-y-1">
                      <li className="text-gray-700">
                      {order.shippingAddress.name}
                    </li>
                      <li className="text-gray-700">
                      {order.shippingAddress.company_name || "N/A"}
                    </li>
                    <li className="text-gray-700">
                      {order.shippingAddress.street}
                      {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}
                    </li>
                    <li className="text-gray-700">
                      {order.shippingAddress.town}, {order.shippingAddress.post_code}
                    </li>
                    <li className="text-gray-700">{order.shippingAddress.country}</li>
                    {order.shippingAddress.phone && (
                      <li className="text-gray-700">{order.shippingAddress.phone}</li>
                    )}
                    
                  </ul>
                )}
              </div>
              
              {/* Billing Address */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AttachMoneyIcon fontSize="small" />
                  <Typography variant="subtitle2">Billing Address</Typography>
                </div>
                {order?.billingAddress && (
                  <ul className="list-disc pl-6 space-y-1">
                      <li className="text-gray-700">
                      {order.billingAddress.name}
                    </li>
                      <li className="text-gray-700">
                      {order.billingAddress.company_name || "N/A"}
                    </li>
                    <li className="text-gray-700">
                      {order.billingAddress.street}
                      {order.billingAddress.apartment && `, ${order.billingAddress.apartment}`}
                    </li>
                    <li className="text-gray-700">
                      {order.billingAddress.town}, {order.billingAddress.post_code}
                    </li>
                    <li className="text-gray-700">{order.billingAddress.country}</li>
                    {order.billingAddress.phone && (
                      <li className="text-gray-700">{order.billingAddress.phone}</li>
                    )}
                    
                  </ul>
                )}
              </div>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default OrderDetailApp;