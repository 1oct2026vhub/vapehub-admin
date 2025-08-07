'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import FusePageCarded from '@fuse/core/FusePageCarded';
import { Typography } from '@mui/material';
import FuseLoading from '@fuse/core/FuseLoading';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { getLoyaltyPointSettingById, LoyaltyPointSetting } from '@/services/apiLoyaltyPoints';
import LoyaltyPointForm from '@/app/(control-panel)/apps/loyalty-points/LoyaltyPointForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function EditLoyaltyPointPageClient() {
    const [loading, setLoading] = useState(true);
    const [setting, setSetting] = useState<LoyaltyPointSetting | null>(null);
    const { showSnackbar } = useSnackbar();
    const params = useParams();

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const id = Number(params.id);
                const result = await getLoyaltyPointSettingById(id);
                setSetting(result.data);
            } catch (error) {
                showSnackbar('Failed to fetch loyalty point setting.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchSetting();
    }, [params.id, showSnackbar]);

    if (loading) {
        return <FuseLoading />;
    }
    return (
      <div className="p-10">
        <PageBreadcrumb />
            <Typography variant="h4" component="h1" className="mb-4 font-bold">
              Edit Loyalty Points Setting
            </Typography>
            <LoyaltyPointForm initialData={setting} />
        </div>
    );
}

export default EditLoyaltyPointPageClient; 