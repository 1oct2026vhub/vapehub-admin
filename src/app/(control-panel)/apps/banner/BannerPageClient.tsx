'use client';

import React from 'react';
import BannerList from './BannerList';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Box, Typography } from '@mui/material';

const BannerPageClient: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumb />  
      <BannerList />
    </Box>
  );
};

export default BannerPageClient; 