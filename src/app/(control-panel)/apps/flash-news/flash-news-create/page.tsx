import React from 'react';
import FlashNewsForm from './FlashNewsForm';
import { Box, Typography } from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const FlashNewsCreatePage = () => {
  return ( 
      <Box sx={{ p: 3 }}>
      <div> 

    <Typography variant="h6" sx={{ mb: 2 }}>Create Flash News</Typography>
     <FlashNewsForm />
     </div>
      </Box>
  
  )
};

export default FlashNewsCreatePage; 