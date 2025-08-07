'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EditBannerForm from './EditBannerForm';
import { getBannerDetails, type BannerItem } from '@/services/apiBanner';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

const EditBannerPageClient: React.FC = () => {
  const params = useParams();
  const bannerId = Number(params.bannerId as string);

  const [bannerData, setBannerData] = useState<BannerItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bannerId) {
      setLoading(true);
      getBannerDetails(bannerId)
        .then((data) => {
          setBannerData(data);
          setError(null);
        })
        .catch((err) => {
          console.error("Failed to load banner data:", err);
          setError(err.message || 'Failed to load banner data. Please try again.');
          setBannerData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [bannerId]);

  const breadcrumbItems = [
    { title: 'Dashboard', url: '/' },
    { title: 'Banners', url: '/apps/banner' },
    { title: bannerData ? `Edit: ${bannerData.title}` : 'Edit Banner' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading banner details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumb />
        <Typography variant="h3" component="h1" sx={{ my: 3, fontWeight: 'bold' }}>
          Edit Banner
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!bannerData) {
    return (
      <Box sx={{ p: 3 }}>
        <PageBreadcrumb />
        <Alert severity="warning" sx={{ mt: 2 }}>
          Banner data not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageBreadcrumb />
      <Typography variant="h5" component="h1" sx={{ my: 3, fontWeight: 'bold' }}>
        Edit Banner
      </Typography>
      <EditBannerForm initialBannerData={bannerData} />
    </Box>
  );
};

export default EditBannerPageClient; 