'use client';

import FusePageCarded from '@fuse/core/FusePageCarded';
import { Typography } from '@mui/material';
import LoyaltyPointForm from '../LoyaltyPointForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function CreateLoyaltyPointPageClient() {
    return (
        <div className="p-10">
          <PageBreadcrumb />
            <Typography variant="h4" component="h1" className="mb-4 font-bold">
              Create Loyalty Points Setting
            </Typography>
            <LoyaltyPointForm />
        </div>
    );
}

export default CreateLoyaltyPointPageClient; 