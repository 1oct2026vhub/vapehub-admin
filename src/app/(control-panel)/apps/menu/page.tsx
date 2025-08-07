import { Metadata } from 'next';
import React from 'react';
import MenuList from './MenuList';
import { Box } from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Menu | VapeHub',
};

const MenuPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumb />
      <MenuList />
    </Box>
  );
};

export default MenuPage; 