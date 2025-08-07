'use client';

import { Box, Typography } from "@mui/material";
import RefferalMethodForm from "./RefferalMethodForm";
import PageBreadcrumb from '@/components/PageBreadcrumb';

function NewRefferalMethodPageClient() {
	return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumb />
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Create New Referral Method
      </Typography>
      <RefferalMethodForm />
      </Box>
	);
}

export default NewRefferalMethodPageClient; 