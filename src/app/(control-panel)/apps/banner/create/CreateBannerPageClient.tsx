'use client';

import React from 'react';
import CreateBannerForm from './CreateBannerForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Box, Typography } from '@mui/material';

const CreateBannerPageClient: React.FC = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageBreadcrumb /> 
      <CreateBannerForm />
    </Box>
  );
};

export default CreateBannerPageClient; 