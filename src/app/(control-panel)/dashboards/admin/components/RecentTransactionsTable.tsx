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
  Chip
} from '@mui/material';
import { format } from 'date-fns';
import { RecentTransaction } from '@/services/apiDashboard';

interface RecentTransactionsTableProps {
  transactions: RecentTransaction[];
}

const RecentTransactionsTable = ({ transactions }: RecentTransactionsTableProps) => {
  if (transactions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <Typography variant="body1" color="textSecondary">
          No recent transactions available
        </Typography>
      </Box>
    );
  }

  const getOrderNumber = (transaction: RecentTransaction) => {
    return transaction.orderId?.orderNumber || 'No Order ID';
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
      <Table aria-label="recent transactions table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Order Number</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow 
              key={`transaction-${getOrderNumber(transaction)}-${index}`}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <Chip 
                  label={getOrderNumber(transaction)} 
                  size="small" 
                  color="secondary" 
                  sx={{ fontWeight: 'medium' }}
                />
              </TableCell>
              <TableCell>
                {transaction.createdAt ? format(new Date(transaction.createdAt), 'MMM dd, yyyy') : 'N/A'}
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="body2" 
                  fontWeight="medium" 
                  sx={{ color: '#2E9970' }}
                >
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
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