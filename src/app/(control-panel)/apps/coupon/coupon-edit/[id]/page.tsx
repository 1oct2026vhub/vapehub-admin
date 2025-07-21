import { Box, Typography } from '@mui/material';
import EditCouponForm from '../EditCouponForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export default function EditCouponPage() {
  return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumb />
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
      Edit Coupon      
      </Typography>
      <EditCouponForm />
      </Box>
  );
} 