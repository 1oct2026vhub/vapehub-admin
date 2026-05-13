'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import AppButton from '@/components/Shared/AppButton';
import SubscriberStats from './_components/SubscriberStats';
import SubscribersTable from './_components/SubscribersTable';
import AddSubscriberModal from './_components/AddSubscriberModal';

function SubscribersPageClient() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [listRefreshSignal, setListRefreshSignal] = useState(0);

  const handleAddSuccess = () => {
    setListRefreshSignal((n) => n + 1);
  };

  return (
    <div className="w-full flex flex-col min-h-full p-12">
      <PageBreadcrumb />
      <div className="pb-12">
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-4">
          Subscriber Analytics
        </Typography>
        <SubscriberStats />
      </div>

      <div>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <Typography className="text-4xl font-extrabold leading-none tracking-tight">
            Subscribers
          </Typography>
          <AppButton
            type="button"
            variant="contained"
            label="Add subscriber"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
          />
        </div>
        <SubscribersTable listRefreshSignal={listRefreshSignal} />
        <AddSubscriberModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </div>
    </div>
  );
}

export default SubscribersPageClient; 