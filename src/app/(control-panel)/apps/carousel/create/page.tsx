import React from 'react';
import CreateCarouselForm from './CreateCarouselForm';
import { Box, Typography } from '@mui/material';

const CreateCarouselPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Create New Carousel
      </Typography>
      <CreateCarouselForm />
    </Box>
  );
};

export default CreateCarouselPage; 