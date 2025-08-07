"use client";

import SeoListTable from './SeoListTable';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AppButton from '@/components/Shared/AppButton';
import { useState } from 'react';
import SeoFormModal from './components/SeoFormModal';
import { SeoListItem } from '@/services/apiSeo';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function SeoListPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeo, setSelectedSeo] = useState<SeoListItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenCreate = () => {
    setSelectedSeo(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (data: SeoListItem) => {
    setSelectedSeo(data);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSeo(null);
  };

  const handleSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box className="w-full p-6">
      <PageBreadcrumb />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">SEO Management</Typography>
        <AppButton
            label="Create SEO"
            onClick={handleOpenCreate}
            variant="contained"
        />
      </Box>
      <SeoListTable refreshTrigger={refreshTrigger} onEdit={handleOpenEdit} />
      <SeoFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
        initialData={selectedSeo}
      />
    </Box>
  );
}

export default SeoListPageClient; 