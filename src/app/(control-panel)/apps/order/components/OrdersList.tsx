"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/navigation";
import {
  getOrders,
  OrderStatus,
  PaymentStatus,
  Order,
  updateOrderStatus,
} from "@/services/apiOrder";
import OrderStatusChip from "./OrderStatusChip";
import PaymentStatusChip from "./PaymentStatusChip";
import FuseLoading from "@fuse/core/FuseLoading";

interface OrdersListProps {
  statusFilter?: OrderStatus;
  paymentStatusFilter?: PaymentStatus;
  startDateFilter?: string;
  endDateFilter?: string;
}

const OrdersList = ({
  statusFilter,
  paymentStatusFilter,
  startDateFilter,
  endDateFilter,
}: OrdersListProps) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  useEffect(() => {
    fetchOrders();
  }, [
    statusFilter,
    paymentStatusFilter,
    startDateFilter,
    endDateFilter,
    page,
    rowsPerPage,
  ]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders({
        status: statusFilter,
        payment_status: paymentStatusFilter,
        start_date: startDateFilter,
        end_date: endDateFilter,
        search: searchQuery || undefined,
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
      });

      setOrders(response.data.orders);
      setTotalOrders(response.data.pagination.total);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
    fetchOrders();
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrder = (orderId: number) => {
    router.push(`/apps/order/${orderId}`);
  };

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setNewStatus(event.target.value as OrderStatus);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      await updateOrderStatus(selectedOrder.id, newStatus);

      // Update local state to reflect the change
      setOrders(
        orders.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: newStatus }
            : order
        )
      );

      handleCloseStatusDialog();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <FuseLoading />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" mb={3} alignItems="center">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search orders by number or customer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleSearchKeyPress}
          sx={{ mr: 1, flexGrow: 1 }}
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleSearch} edge="end">
                <SearchIcon />
              </IconButton>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" py={2}>
                    No orders found matching the criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {order.order_unique_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {order.user
                      ? `${order.user.first_name} ${order.user.last_name}`
                      : "Guest"}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(order.total))}
                  </TableCell>
                  <TableCell>
                    <OrderStatusChip
                      status={order.status}
                      onClick={() => handleOpenStatusDialog(order)}
                    />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusChip status={order.payment_status} />
                  </TableCell>
                  <TableCell>{order.orderItems.length}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        onClick={() => handleViewOrder(order.id)}
                        size="small"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalOrders}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Change the status for order #{selectedOrder?.order_unique_id}
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

export default OrdersList;
