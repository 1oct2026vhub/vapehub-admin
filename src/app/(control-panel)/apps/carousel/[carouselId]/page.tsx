'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCarousel, type Carousel } from '@/services/apiCarousel';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  Button,
  Chip,
  Container,
  Alert,
} from '@mui/material';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Image from 'next/image';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const CarouselDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const carouselId = params.carouselId ? parseInt(params.carouselId as string, 10) : null;
  const { showSnackbar } = useSnackbar();

  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (carouselId) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getCarousel(carouselId);
          setCarousel(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch carousel details.');
          showSnackbar(err.message || 'Failed to fetch carousel details.', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setError('Invalid Carousel ID.');
      showSnackbar('Invalid Carousel ID.', 'error');
      setLoading(false);
      router.push('/apps/carousel');
    }
  }, [carouselId, showSnackbar, router]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/apps/carousel')}
        >
          Back to Carousel List
        </Button>
      </Container>
    );
  }

  if (!carousel) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Carousel not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/apps/carousel')}
        >
          Back to Carousel List
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <PageBreadcrumb />
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 2, bgcolor: 'white' }}>
        <Grid container spacing={3} alignItems="center" justifyContent="center">
          <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1" gutterBottom>
              {carousel.title}
            </Typography>
            <Box>
              {/* <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/apps/carousel')}
                sx={{ mr: 1 }}
              >
                Back to List
              </Button> */}
              <Button
                variant="contained"
                component={Link}
                href={`/apps/carousel/${carousel.id}/edit`}
                startIcon={<EditIcon />}
              >
                Edit Carousel
              </Button>
            </Box>
          </Grid>

          {/* Main content row: image left, details right */}
          <Grid item xs={12} md={12}>
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              {/* Image on the left */}
              <Grid item xs={12} md={5} display="flex" justifyContent="center">
                {(carousel.image_url || carousel.image_url_low) && (
                  <Box sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '400px',
                    aspectRatio: '16/9',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    mx: 'auto',
                  }}>
                    <Image
                      src={carousel.image_url || carousel.image_url_low || '/assets/images/placeholder/16x9.svg'}
                      alt={`${carousel.title} - Carousel Image`}
                      layout="fill"
                      objectFit="contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder/16x9.svg';
                      }}
                    />
                  </Box>
                )}
              </Grid>
              {/* Details on the right */}
              <Grid item xs={12} md={7}>
                <Typography variant="h6" gutterBottom sx={{mt: { xs: 3, md: 0 }}}>Details</Typography>
                <Box sx={{ '& > div': { mb: 1.5 } }}>
                  {carousel.description && (
                    <div className='flex gap-2 items-center'>
                      <Typography variant="subtitle2" color="text.secondary">Description:</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{carousel.description}</Typography>
                    </div>
                  )}
                  {/* <div className='flex gap-2 items-center'>
                    <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                    <Chip
                      label={carousel.status ? 'Active' : 'Inactive'}
                      color={carousel.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </div> */}
                  {/* <div>
                    <Typography variant="subtitle2" color="text.secondary">Display Order:</Typography>
                    <Typography variant="body1">{carousel.display_order}</Typography>
                  </div> */}
                  {carousel.redirect_url && (
                    <div className='flex gap-2 items-center'>
                      <Typography variant="subtitle2" color="text.secondary">Redirect URL:</Typography>
                      <Typography variant="body1" component={Link} href={carousel.redirect_url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                        {carousel.redirect_url}
                      </Typography>
                    </div>
                  )}
                  <div className='flex gap-2 items-center'>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated:</Typography>
                    <Typography variant="body1">{new Date(carousel.updatedAt).toLocaleString()}</Typography>
                  </div>
                  <div className='flex gap-2 items-center'>
                    <Typography variant="subtitle2" color="text.secondary">Created At:</Typography>
                    <Typography variant="body1">{new Date(carousel.createdAt).toLocaleString()}</Typography>
                  </div>
                  {/* {carousel.updated_by && (
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">Updated By:</Typography>
                      <Typography variant="body1">{carousel.updated_by}</Typography>
                    </div>
                  )} */}
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CarouselDetailPage; 