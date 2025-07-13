'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBannerDetails, type BannerItem } from '@/services/apiBanner';
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
  CardMedia,
} from '@mui/material';
import { useSnackbar } from '@/contexts/SnackbarContext';
// import PageBreadcrumb from '@/components/Shared/PageBreadcrumb'; // Assuming this path
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Image from 'next/image'; // Using Next.js Image for optimization

const BannerDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const bannerId = params.bannerId ? parseInt(params.bannerId as string, 10) : null;
  const { showSnackbar } = useSnackbar();

  const [banner, setBanner] = useState<BannerItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bannerId) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getBannerDetails(bannerId);
          setBanner(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch banner details.');
          showSnackbar(err.message || 'Failed to fetch banner details.', 'error');
          // Optionally redirect if not found, or show error prominently
          // if (err.response?.status === 404) router.push('/apps/banner'); 
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setError('Invalid Banner ID.');
      showSnackbar('Invalid Banner ID.', 'error');
      setLoading(false);
      router.push('/apps/banner'); // Redirect if no ID
    }
  }, [bannerId, showSnackbar, router]);

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
            onClick={() => router.push('/apps/banner')}
        >
            Back to Banner List
        </Button>
      </Container>
    );
  }

  if (!banner) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Banner not found.</Alert>
         <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/apps/banner')}
        >
            Back to Banner List
        </Button>
      </Container>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Banners', href: '/apps/banner' },
    { label: banner.title || 'Banner Details' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* <PageBreadcrumb items={breadcrumbItems} /> */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 2, bgcolor: 'white' }}>
        <Grid container spacing={3} alignItems="center" justifyContent="center">
          <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1" gutterBottom>
              {banner.title}
            </Typography>
            <Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/apps/banner')}
                    sx={{ mr: 1}}
                >
                    Back to List
                </Button>
                <Button
                    variant="contained"
                    component={Link}
                    href={`/apps/banner/edit/${banner.id}`}
                    startIcon={<EditIcon />}
                >
                    Edit Banner
                </Button>
            </Box>
          </Grid>

          {/* Main content row: image left, details right */}
          <Grid item xs={12} md={12}>
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              {/* Image on the left */}
              <Grid item xs={12} md={5} display="flex" justifyContent="center">
                {(banner.image_url || banner.image_url_low) && (
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
                      src={banner.image_url || banner.image_url_low || '/assets/images/placeholder/16x9.svg'}
                      alt={`${banner.title} - Banner Image`}
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
                  {banner.description && (
                    <div className='flex gap-2 items-center'>
                      <Typography variant="subtitle2" color="text.secondary">Description:</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{banner.description}</Typography>
                    </div>
                  )}
                  {/* <div className='flex gap-2 items-center'>
                    <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
                    <Chip
                      label={banner.status ? 'Active' : 'Inactive'}
                      color={banner.status ? 'success' : 'error'}
                      size="small"
                    />
                  </div> */}
                  {/* <div>
                    <Typography variant="subtitle2" color="text.secondary">Display Order:</Typography>
                    <Typography variant="body1">{banner.display_order}</Typography>
                  </div> */}
                  {banner.redirect_url && (
                    <div className='flex gap-2 items-center'>
                      <Typography variant="subtitle2" color="text.secondary">Redirect URL:</Typography>
                      <Typography variant="body1" component={Link} href={banner.redirect_url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                        {banner.redirect_url}
                      </Typography>
                    </div>
                  )}
                  <div className='flex gap-2 items-center'>
                    <Typography variant="subtitle2" color="text.secondary">Last Updated:</Typography>
                    <Typography variant="body1">{new Date(banner.updatedAt).toLocaleString()}</Typography>
                  </div>
                  <div className='flex gap-2 items-center'>
                    <Typography variant="subtitle2" color="text.secondary">Created At:</Typography>
                    <Typography variant="body1">{new Date(banner.createdAt).toLocaleString()}</Typography>
                  </div>
                  {banner.deletedAt && (
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">Deleted At:</Typography>
                      <Typography variant="body1" sx={{color: 'error.main'}}>{new Date(banner.deletedAt).toLocaleString()}</Typography>
                    </div>
                  )}
                  {/* {banner.updated_by && (
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">Updated By:</Typography>
                      <Typography variant="body1">{banner.updated_by}</Typography>
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

export default BannerDetailPage; 