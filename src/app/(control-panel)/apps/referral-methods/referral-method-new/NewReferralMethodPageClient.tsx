'use client';

import { Box, Typography } from "@mui/material";
import ReferralMethodForm from "./ReferralMethodForm";
import PageBreadcrumb from '@/components/PageBreadcrumb';

function NewReferralMethodPageClient() {
	return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumb />
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Create New Referral Method
      </Typography>
      <ReferralMethodForm />
      </Box>
	);
}

export default NewReferralMethodPageClient; 