import React from 'react';
import MenuList from './MenuList';
import { Box } from '@mui/material';

const MenuPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <MenuList />
    </Box>
  );
};

export default MenuPage; 