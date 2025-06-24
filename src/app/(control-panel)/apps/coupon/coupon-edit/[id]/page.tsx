import { Box, Typography } from '@mui/material';
import EditCouponForm from '../EditCouponForm';

export default function EditCouponPage() {
  return (
      <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
      Edit Coupon      
      </Typography>
      <EditCouponForm />
      </Box>
  );
} 