'use client';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { Typography } from '@mui/material';
import LoyaltyPointForm from '../LoyaltyPointForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function CreateLoyaltyPointPage() {
    return (
        <div className="p-10">
          <PageBreadcrumb />
            <Typography variant="h4" component="h1" className="mb-4 font-bold">
              Create Loyalty Points Setting
            </Typography>
            <LoyaltyPointForm />
        </div>
        // <FusePageCarded
        //     header={
        //         <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-8 sm:space-y-0 sm:space-x-4 mt-4 mb-4">
        //             <div className="flex flex-col items-center sm:items-start space-y-8 sm:space-y-0">
        //                 <Typography variant="h5">Create Loyalty Points Setting</Typography>
        //             </div>
        //         </div>
        //     }
        //     content={<LoyaltyPointForm />}
        // />
    );
}

export default CreateLoyaltyPointPage; 