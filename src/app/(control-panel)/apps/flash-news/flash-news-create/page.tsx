import { Metadata } from 'next';
import React from 'react';
import FlashNewsForm from './FlashNewsForm';
import { Box, Typography } from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Create Flash News | VapeHub',
};

const FlashNewsCreatePage = () => {
  return ( 
      <Box sx={{ p: 3 }}>
      <div> 
        <PageBreadcrumb />
    <Typography variant="h6" sx={{ mb: 2 }}>Create Flash News</Typography>
     <FlashNewsForm />
     </div>
      </Box>
  )
};

export default FlashNewsCreatePage; 