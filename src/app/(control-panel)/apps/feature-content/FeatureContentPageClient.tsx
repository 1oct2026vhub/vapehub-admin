"use client";
import React, { useState } from 'react';
import PageHeader from '@/components/Shared/PageHeader';
import FeatureContentList from './components/FeatureContentList';

const FeatureContentPageClient: React.FC = () => {
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Feature Content" actionLabel="Add Feature Content" onActionClick={() => setOpenCreate(true)} />
      <FeatureContentList openCreate={openCreate} onCreateClosed={() => setOpenCreate(false)} />
    </div>
  );
};

export default FeatureContentPageClient;
