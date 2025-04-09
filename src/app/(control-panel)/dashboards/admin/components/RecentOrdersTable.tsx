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
} from "@mui/material";
import { format } from "date-fns";
import { RecentOrder } from "@/services/apiDashboard";

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
    return `${firstName} ${lastName}`.trim();
  };

  const getEmail = (order: RecentOrder) => {
    return order.userId?.email || "N/A";
  };

  return (
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
               {order?.user?.first_name ||
                  order?.user?.last_name ||
                  order?.user?.email ||
                  "N/A"}
              </TableCell>
              <TableCell>
                {order.createdAt
                  ? format(new Date(order.createdAt), "MMM dd, yyyy")
                  : "N/A"}
              </TableCell>
              <TableCell>{order.total || "N/A"}</TableCell>
              <TableCell>{order.status ||"N/A"}</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecentOrdersTable;
