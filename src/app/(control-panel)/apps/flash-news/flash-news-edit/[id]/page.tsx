import React from 'react';
import EditFlashNewsForm from './EditFlashNewsForm';
import { Box, Typography } from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const FlashNewsEditPage = () => {
  return ( 
      <Box sx={{ p: 3 }}>
      <div>  
        <PageBreadcrumb />
      <Typography variant="h6" sx={{ mb: 2 }}>Edit Flash News</Typography>
      <EditFlashNewsForm  />
      </div>
      </Box>
  
  )
};
export default FlashNewsEditPage; 