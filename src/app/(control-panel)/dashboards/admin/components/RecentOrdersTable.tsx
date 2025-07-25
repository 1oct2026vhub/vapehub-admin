"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  Link,
} from "@mui/material";
import { RecentOrder } from "@/services/apiDashboard";
import { formatDate } from "@/utils/actions";
import NextLink from "next/link";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

const RecentOrdersTable = ({ orders }: RecentOrdersTableProps) => {
  if (orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <Typography variant="body1" color="textSecondary">
          No recent orders available
        </Typography>
      </Box>
    );
  }

  const formatName = (order: RecentOrder) => {
    if (!order.userId) return "Unknown";

    const firstName = order.userId.firstName || "";
    const lastName = order.userId.lastName || "";

    if (!firstName && !lastName) return "Unknown User";
    
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const formattedFirstName = firstName ? capitalize(firstName) : "";
    const formattedLastName = lastName ? capitalize(lastName) : "";
    
    return `${formattedFirstName} ${formattedLastName}`.trim();
  };

  const getEmail = (order: RecentOrder) => {
    return order.userId?.email || "N/A";
  };

  const getStatusColor = (status: string) => {
    // Match the exact colors from OrderStatistics
    const statusColors = {
      pending: "#FF9800", // Orange
      processing: "#2196F3", // Blue
      shipped: "#9C27B0", // Purple
      completed: "#009688", // Teal
      failed: "#E53935", // Red
      cancelled: "#795548", // Brown
      fail: "#E53935", // Red (alternative name)
      cancel: "#795548" // Brown (alternative name)
    };
    
    // Convert status to lowercase for matching
    const normalizedStatus = status.toLowerCase();
    
    // Return the appropriate MUI color based on the status
    switch (normalizedStatus) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
      case "cancel":
        return "error";
      case "processing":
        return "info";
      case "shipped":
        return "secondary";
      case "failed":
      case "fail":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
        <Table aria-label="recent orders table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Order Id</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow
                key={`order-${order.order_unique_id || ""}-${index}`}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Chip
                    label={order.order_unique_id || "No ID"}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: "medium" }}
                  />
                </TableCell>
                <TableCell>
                  {order?.user?.first_name && order?.user?.last_name 
                    ? (() => {
                        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                        const formattedFirstName = capitalize(order.user.first_name);
                        const formattedLastName = capitalize(order.user.last_name);
                        return `${formattedFirstName} ${formattedLastName}`;
                      })()
                    : order?.user?.email || "N/A"}
                </TableCell>
                <TableCell>
                  {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                </TableCell>
                <TableCell>{order.total || "N/A"}</TableCell>
                <TableCell>
                  {order.status 
                    ? (
                      <Chip 
                        label={order.status === "fail" 
                          ? "Failed"
                          : order.status === "cancel"
                          ? "Cancelled"
                          : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        size="small"
                        color={getStatusColor(order.status)}
                        sx={{ fontWeight: "medium" }}
                      />
                    )
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        display="flex"
        justifyContent="flex-end"
        mt={2}
        sx={{ borderTop: "1px solid #e0e0e0", pt: 2 }}
      >
        {/* <NextLink href="/apps/order/list" passHref> */}
          <Link
            sx={{
              display: "flex",
              alignItems: "center",
              color: "#2E9970",
              textDecoration: "none",
              fontWeight: "medium",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            href="/apps/order/list"
          >
            View all orders
            <ArrowForwardIcon fontSize="small" sx={{ ml: 0.5 }} />
          </Link>
        {/* </NextLink> */}
      </Box>
    </Box>
  );
};

export default RecentOrdersTable;
