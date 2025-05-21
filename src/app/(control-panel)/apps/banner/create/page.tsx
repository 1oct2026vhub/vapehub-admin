'use client';

import React from 'react';
import CreateBannerForm from './CreateBannerForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Box, Typography } from '@mui/material';

const CreateBannerPage: React.FC = () => {
  // const breadcrumbItems = [
  //   { title: 'Dashboard', url: '/' }, 
  //   { title: 'Banners', url: '/apps/banner' },
  //   { title: 'Create Banner' },
  // ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Updated to a simpler usage based on other examples */}
      <PageBreadcrumb /> 
      {/* <Typography variant="h3" component="h1" sx={{ my: 3, fontWeight: 'bold' }}>
        Add New Banner
      </Typography> */}
      <CreateBannerForm />
    </Box>
  );
};

export default CreateBannerPage; 