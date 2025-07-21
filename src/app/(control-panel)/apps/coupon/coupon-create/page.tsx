'use client';

import { Box, Typography } from '@mui/material';
import CouponForm from './CouponForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export default function CreateCouponPage() {
  return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumb />
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Create New Coupon
      </Typography>
      <CouponForm />
      </Box>
  );
} 