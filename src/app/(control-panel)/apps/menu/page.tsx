import React from 'react';
import MenuList from './MenuList';
import { Box } from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const MenuPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumb />
      <MenuList />
    </Box>
  );
};

export default MenuPage; 