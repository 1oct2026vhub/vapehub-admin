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
import { RecentTransaction } from "@/services/apiDashboard";

interface RecentTransactionsTableProps {
  transactions: RecentTransaction[];
}

const RecentTransactionsTable = ({
  transactions,
}: RecentTransactionsTableProps) => {
  if (transactions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <Typography variant="body1" color="textSecondary">
          No recent transactions available
        </Typography>
      </Box>
    );
  }



  return (
    <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
      <Table aria-label="recent transactions table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Order Id</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Payment Method</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Reference Number</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Transaction Type</TableCell>
            <TableCell sx={{ fontWeight: "bold", textAlign: "right" }}>
              Amount
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow
              key={`transaction-${index}`}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <Chip
                  label={transaction?.orderId || "No ID"}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: "medium" }}
                />
              </TableCell>
              <TableCell>
                {transaction.createdAt
                  ? format(new Date(transaction.createdAt), "MMM dd, yyyy")
                  : "N/A"}
              </TableCell>
              {/* These fields don't exist in the RecentTransaction interface */}
              <TableCell>{transaction.paymentMethod || "N/A"}</TableCell>
              <TableCell>{transaction.status || "N/A"}</TableCell>
              <TableCell>{transaction.referenceNumber || "N/A"}</TableCell>
              <TableCell>{transaction.transactionType || "N/A"}</TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  sx={{ color: "#2E9970" }}
                >
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(transaction.amount || 0)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RecentTransactionsTable;
