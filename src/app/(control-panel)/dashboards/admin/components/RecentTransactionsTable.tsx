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
import { RecentTransaction } from "@/services/apiDashboard";
import { formatDate, formatCurrency } from "@/utils/actions";
import NextLink from "next/link";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "successful":
      case "success":
      case "completed":
        return "success";
      case "pending":
      case "processing":
        return "warning";
      case "cancelled":
      case "failed":
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
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
                  {transaction.createdAt ? formatDate(transaction.createdAt) : "N/A"}
                </TableCell>
                {/* These fields don't exist in the RecentTransaction interface */}
                <TableCell>{transaction.paymentMethod || "N/A"}</TableCell>
                <TableCell>
                  {transaction.status ? (
                    <Chip 
                      label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      size="small"
                      color={getStatusColor(transaction.status)}
                      sx={{ fontWeight: "medium" }}
                    />
                  ) : "N/A"}
                </TableCell>
                <TableCell>{transaction.referenceNumber || "N/A"}</TableCell>
                <TableCell>{transaction.transactionType || "N/A"}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ color: "#2E9970" }}
                  >
                    {formatCurrency(transaction.amount || 0)}
                  </Typography>
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
        <NextLink href="/apps/transaction/list" passHref>
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
          >
            View all transactions
            <ArrowForwardIcon fontSize="small" sx={{ ml: 0.5 }} />
          </Link>
        </NextLink>
      </Box>
    </Box>
  );
};

export default RecentTransactionsTable;
