'use client';

import React from 'react';
import BannerList from './BannerList';
import PageBreadcrumb from '@/components/PageBreadcrumb'; // Assuming you have this for consistency
import { Box, Typography } from '@mui/material';

const BannerPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      {/* You can add a PageBreadcrumb component here if you use it elsewhere */}
      {/* <PageBreadcrumb title="Banners" /> */}
      {/* The Typography for the main title is now inside BannerList for better layout control with the Add button */}
      <BannerList />
    </Box>
  );
};

export default BannerPage; 