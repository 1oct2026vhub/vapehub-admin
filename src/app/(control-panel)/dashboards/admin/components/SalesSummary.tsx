import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { SalesSummary as SalesSummaryData } from '@/services/apiDashboard';
import { formatPounds } from '@/utils/actions';

interface SalesSummaryProps {
  summary: SalesSummaryData;
}

const SalesSummary: React.FC<SalesSummaryProps> = ({ summary }) => {
  return (
    <Box sx={{ p: 2, mb: 2, border: '1px solid #eee', borderRadius: 1 }}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={6} sm={4} md={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Gross Sales</Typography>
          <Typography variant="h6">{formatPounds(summary.grossSales)}</Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Net Sales</Typography>
          <Typography variant="h6">{formatPounds(summary.netSales)}</Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Orders Placed</Typography>
          <Typography variant="h6">{summary.ordersPlaced}</Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Items Purchased</Typography>
          <Typography variant="h6">{summary.itemsPurchased}</Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Shipping Charged</Typography>
          <Typography variant="h6">{formatPounds(summary.shippingCharged)}</Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Coupons Used</Typography>
          <Typography variant="h6">{formatPounds(summary.couponsUsed)}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesSummary; 