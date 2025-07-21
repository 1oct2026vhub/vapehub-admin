'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EditCarouselForm from './EditCarouselForm';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getCarousel } from '@/services/apiCarousel';
import { Carousel } from '@/types/carousel';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const EditCarouselPage = () => {
  const params = useParams();
  const carouselId = Number(params.carouselId);
  const [carouselData, setCarouselData] = useState<Carousel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        const data = await getCarousel(carouselId);
        setCarouselData(data);
      } catch (error) {
        console.error('Error fetching carousel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarousel();
  }, [carouselId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageBreadcrumb />
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Edit Carousel
      </Typography>
      {carouselData && <EditCarouselForm initialCarouselData={carouselData} />}
    </Box>
  );
};

export default EditCarouselPage; 