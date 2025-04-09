"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Card,
  CardContent,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  getTransactionById,
  Transaction,
  updateTransactionStatus,
  TransactionStatus,
  generateTransactionReport,
  TransactionType,
} from "@/services/apiTransaction";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import TransactionStatusChip from "../../components/TransactionStatusChip";
import TransactionTypeChip from "../../components/TransactionTypeChip";
import { useSnackbar } from "@/contexts/SnackbarContext";
import RefundModal from "./RefundModal";

const TransactionDetailApp = () => {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { showSnackbar } = useSnackbar();
  
  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  // Fetch transaction data (refresh after refund)
  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const transactionId = parseInt(params.transactionId as string);
      const response = await getTransactionById(transactionId);
      setTransaction(response);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load transaction details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [params.transactionId]);

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

  const handleGoBack = () => {
    router.push("/apps/transaction/list");
  };

  // Handle status change
  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    if (!transaction) return;

    const newStatus = event.target.value.toLowerCase() as TransactionStatus;
    setUpdatingStatus(true);

    try {
      const response = await updateTransactionStatus(transaction.id, newStatus);
      setTransaction({
        ...transaction,
        status: newStatus,
      });
      if (response) {
        showSnackbar(response?.message, "success");
      }
    } catch (error) {
      console.error("Failed to update transaction status:", error);
      showSnackbar("Failed to update transaction status", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Refund Modal
  const handleRefundClick = () => {
    setRefundModalOpen(true);
  };

  const handleRefundClose = () => {
    setRefundModalOpen(false);
  };

  const handleRefundSuccess = () => {
    showSnackbar("Transaction refunded successfully", "success");
    fetchTransaction(); // Reload transaction data
  };

  // Handle export receipt
  const handleExportReceipt = async () => {
    if (!transaction) return;
    
    try {
      console.log('Exporting receipt with params:', {
        format: 'excel',
        status: transaction.status,
        startDate: transaction.createdAt.split('T')[0],
        endDate: transaction.createdAt.split('T')[0],
      });
      
      await generateTransactionReport('excel', {
        status: transaction.status as TransactionStatus,
        startDate: transaction.createdAt.split('T')[0],
        endDate: transaction.createdAt.split('T')[0],
        // Add transaction ID filter if API supports it
        transactionType: transaction.transactionType as TransactionType,
      });
      
      showSnackbar("Transaction receipt exported successfully", "success");
    } catch (error) {
      console.error("Failed to export transaction receipt:", error);
      showSnackbar(
        typeof error === 'string' 
          ? error 
          : "Failed to export transaction receipt. Please check your network connection.", 
        "error"
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%", padding: 3 }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
          Loading transaction details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: "100%", padding: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          Return to transactions list
        </Button>
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box sx={{ width: "100%", padding: 3 }}>
        <Alert severity="warning">Transaction not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          Return to transactions list
        </Button>
      </Box>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Transaction Header */}
      <Paper className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconButton size="small" onClick={handleGoBack}>
              <ArrowBackIcon />
            </IconButton>
            <div>
              <Typography variant="h5" className="font-bold">
                Transaction #{transaction.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reference: {transaction.referenceNumber}
              </Typography>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {updatingStatus && <LinearProgress className="w-24" />}
            <TransactionStatusChip
              status={transaction.status.toLowerCase() as TransactionStatus}
              className="px-3 py-1"
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="transaction-status-label">Status</InputLabel>
              <Select
                labelId="transaction-status-label"
                id="transaction-status"
                value={transaction.status.toLowerCase()}
                label="Status"
                onChange={handleStatusChange}
                disabled={updatingStatus}
                className="bg-white"
              >
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
            <div className="flex gap-2">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                size="small"
                onClick={handleExportReceipt}
                sx={{
                  borderColor: "#2E9970",
                  color: "#2E9970",
                  "&:hover": {
                    borderColor: "#1d7d59",
                    backgroundColor: "rgba(46, 153, 112, 0.04)",
                  },
                }}
              >
                Export Receipt
              </Button>
              <Tooltip title="Process full or partial refund">
                <Button
                  variant="outlined"
                  startIcon={<MoneyOffIcon />}
                  size="small"
                  color="secondary"
                  onClick={handleRefundClick}
                  disabled={
                    transaction.status.toLowerCase() === "refunded" ||
                    transaction.transactionType.toLowerCase() !== "purchase"
                  }
                >
                  Refund
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Transaction Details and Order Items */}
        <Grid item xs={12} md={8}>
          {/* Transaction Summary */}
          <Paper className="p-4 mb-4">
            <Typography variant="h6" className="mb-3 font-medium">
              Transaction Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <PaymentIcon color="primary" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="mt-1"
                  >
                    Payment Method
                  </Typography>
                  <Typography
                    variant="body1"
                    className="font-medium text-center"
                  >
                    {transaction.paymentMethod.charAt(0).toUpperCase() +
                      transaction.paymentMethod.slice(1)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <AttachMoneyIcon color="success" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="mt-1"
                  >
                    Amount
                  </Typography>
                  <Typography variant="body1" className="font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: transaction.currency,
                    }).format(parseFloat(transaction.amount))}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <CalendarTodayIcon color="info" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="mt-1"
                  >
                    Date
                  </Typography>
                  <Typography
                    variant="body1"
                    className="font-medium text-center"
                  >
                    {formatDate(transaction.createdAt)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <ShoppingCartIcon color="warning" />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="mt-1"
                  >
                    Type
                  </Typography>
                  <TransactionTypeChip
                    type={transaction.transactionType.toLowerCase() as any}
                  />
                </Box>
              </Grid>
            </Grid>

            {transaction.notes && (
              <Box className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Typography variant="subtitle2" className="mb-1">
                  Notes:
                </Typography>
                <Typography variant="body2">{transaction.notes}</Typography>
              </Box>
            )}

            {/* {transaction.metadata && (
              <Box className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Typography variant="subtitle2" className="mb-1">
                  Metadata:
                </Typography>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </Box>
            )} */}
          </Paper>

          {/* Order Details Section */}
          {transaction.order && (
            <Paper className="p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <Typography variant="h6" className="font-medium">
                  Order #{transaction.order.order_unique_id}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    router.push(`/apps/order/detail/${transaction.order?.id}`)
                  }
                  sx={{ color: "#6366F1" }}
                >
                  View Order
                </Button>
              </div>

              {transaction.order.orderItems &&
                transaction.order.orderItems.length > 0 && (
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
                            Total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transaction.order.orderItems.map((item) => (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{
                              "&:nth-of-type(even)": {
                                backgroundColor: "#fafafa",
                              },
                              "&:last-child td, &:last-child th": { border: 0 },
                              transition: "background-color 0.2s ease",
                              "&:hover": {
                                backgroundColor: "#f5f5f5",
                              },
                            }}
                          >
                            <TableCell>
                              <div>
                                <Typography
                                  variant="body1"
                                  className="font-medium text-gray-800"
                                >
                                  {item.product.name}
                                </Typography>
                                {item.variant?.slug && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Variant: {item.variant.slug}
                                  </Typography>
                                )}
                              </div>
                            </TableCell>
                            <TableCell align="center" className="font-medium">
                              {item.quantity}
                            </TableCell>
                            <TableCell align="right" className="font-medium">
                              ${Number(item.unit_price).toFixed(2)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="font-medium text-gray-800"
                            >
                              ${Number(item.total).toFixed(2)}
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
                          <TableCell
                            colSpan={2}
                            className="text-right font-semibold"
                          >
                            Total:
                          </TableCell>
                          <TableCell
                            align="right"
                            className="font-semibold"
                          ></TableCell>
                          <TableCell align="right" className="font-semibold">
                            ${Number(transaction.order.total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

              {/* Shipping Method */}
              {transaction.order.shippingMethod && (
                <Box className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Typography variant="subtitle2" className="mb-1">
                    Shipping Method:
                  </Typography>
                  <Typography variant="body2">
                    {transaction.order.shippingMethod.shipping_method} - $
                    {transaction.order.shippingMethod.shipping_cost.toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* Right Column - Customer and Addresses */}
        <Grid item xs={12} md={4}>
          {/* Customer Details */}
          {transaction.user && (
            <Paper className="p-0 mb-4 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <Typography variant="h6" className="font-medium">
                  Customer Details
                </Typography>
                {/* <Button
                  size="small"
                  variant="text"
                  sx={{ color: "#6366F1" }}
                  onClick={() =>
                    router.push(`/apps/customer/detail/${transaction.user?.id}`)
                  }
                >
                  View Profile
                </Button> */}
              </div>

              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-blue-100">
                    {transaction.user.profile_pic_url ? (
                      <img
                        src={transaction.user.profile_pic_url}
                        alt={`${transaction.user.first_name} ${transaction.user.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-300 to-blue-400 text-white text-xl font-bold">
                        {transaction.user.first_name?.charAt(0) || ""}
                        {transaction.user.last_name?.charAt(0) || ""}
                      </div>
                    )}
                  </div>
                  <div>
                    <Typography variant="h6" className="font-medium">
                      {transaction.user.first_name} {transaction.user.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer ID: {transaction.user.id}
                    </Typography>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 mt-3 text-gray-600">
                    <MailOutlineIcon
                      fontSize="small"
                      sx={{ color: "#6B7280" }}
                    />
                    <Typography variant="body2">
                      {transaction.user.email}
                    </Typography>
                  </div>
                  {transaction.user.phone && (
                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                      <PhoneIcon fontSize="small" sx={{ color: "#6B7280" }} />
                      <Typography variant="body2">
                        {transaction.user.phone}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </Paper>
          )}

          {/* Addresses */}
          {transaction.order &&
            (transaction.order.billingAddress ||
              transaction.order.shippingAddress) && (
              <Paper className="p-0 mb-3 overflow-hidden">
                {/* Billing Address */}
                {transaction.order.billingAddress && (
                  <>
                    <div className="flex items-center gap-2 p-4 border-b border-gray-200">
                      <LocationOnIcon
                        fontSize="small"
                        sx={{ color: "#6B7280" }}
                      />
                      <Typography variant="h6" className="font-medium">
                        Billing Address
                      </Typography>
                    </div>

                    <div className="p-4 border-b border-gray-200">
                      <Typography variant="body1" className="font-medium">
                        {transaction.order.billingAddress.name}{" "}
                        {transaction.order.billingAddress.last_name}
                      </Typography>

                      {transaction.order.billingAddress.phone && (
                        <Typography
                          variant="body2"
                          className="text-gray-600 mt-2"
                        >
                          {transaction.order.billingAddress.phone}
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        className="text-gray-600 mt-2"
                      >
                        {transaction.order.billingAddress.street}
                      </Typography>

                      <Typography variant="body2" className="text-gray-600">
                        {transaction.order.billingAddress.town} -{" "}
                        {transaction.order.billingAddress.post_code}
                      </Typography>

                      {transaction.order.billingAddress.country && (
                        <Typography variant="body2" className="text-gray-600">
                          {transaction.order.billingAddress.country}
                        </Typography>
                      )}
                    </div>
                  </>
                )}

                {/* Shipping Address */}
                {transaction.order.shippingAddress && (
                  <>
                    <div className="flex items-center gap-2 p-4 border-b border-gray-200">
                      <LocationOnIcon
                        fontSize="small"
                        sx={{ color: "#6B7280" }}
                      />
                      <Typography variant="h6" className="font-medium">
                        Shipping Address
                      </Typography>
                    </div>

                    <div className="p-4">
                      <Typography variant="body1" className="font-medium">
                        {transaction.order.shippingAddress.name}{" "}
                        {transaction.order.shippingAddress.last_name}
                      </Typography>

                      {transaction.order.shippingAddress.phone && (
                        <Typography
                          variant="body2"
                          className="text-gray-600 mt-2"
                        >
                          {transaction.order.shippingAddress.phone}
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        className="text-gray-600 mt-2"
                      >
                        {transaction.order.shippingAddress.street}
                      </Typography>

                      <Typography variant="body2" className="text-gray-600">
                        {transaction.order.shippingAddress.town} -{" "}
                        {transaction.order.shippingAddress.post_code}
                      </Typography>

                      {transaction.order.shippingAddress.country && (
                        <Typography variant="body2" className="text-gray-600">
                          {transaction.order.shippingAddress.country}
                        </Typography>
                      )}
                    </div>
                  </>
                )}
              </Paper>
            )}

          {/* Payment Summary */}
          <Paper className="p-4 mb-3">
            <Typography variant="h6" className="mb-4 font-medium">
              Payment Summary
            </Typography>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Typography variant="body2">Transaction Amount</Typography>
                <Typography variant="body2">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: transaction.currency,
                  }).format(parseFloat(transaction.amount))}
                </Typography>
              </div>
              {transaction.order && (
                <>
                  {transaction.order.discount_price &&
                    parseFloat(transaction.order.discount_price) > 0 && (
                      <div className="flex justify-between">
                        <Typography variant="body2">Discount</Typography>
                        <Typography variant="body2" color="error">
                          -
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: transaction.currency,
                          }).format(
                            parseFloat(transaction.order.discount_price)
                          )}
                        </Typography>
                      </div>
                    )}
                  {transaction.order.shippingMethod && (
                    <div className="flex justify-between">
                      <Typography variant="body2">Shipping Cost</Typography>
                      <Typography variant="body2">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: transaction.currency,
                        }).format(
                          transaction.order.shippingMethod.shipping_cost
                        )}
                      </Typography>
                    </div>
                  )}
                </>
              )}
              <Divider />
              <div className="flex justify-between">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total Paid
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: transaction.currency,
                  }).format(parseFloat(transaction.amount))}
                </Typography>
              </div>
            </div>
          </Paper>
        </Grid>
      </Grid>

      {/* Refund Modal */}
      {transaction && (
        <RefundModal
          open={refundModalOpen}
          onClose={handleRefundClose}
          transactionId={transaction.id}
          transactionAmount={transaction.amount}
          currency={transaction.currency}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
};

export default TransactionDetailApp;
