'use client';
import { useEffect, useState } from 'react';
import { getMailSubscriptionSettingById } from '@/services/apiMailSubscriptionSettings';
import type { MailSubscriptionSetting } from '@/services/apiMailSubscriptionSettings';
import MailSubscriptionSettingForm from '../_components/MailSubscriptionSettingForm';
import { Typography } from '@mui/material';
import FuseLoading from '@fuse/core/FuseLoading';
import { useParams, notFound } from 'next/navigation';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function EditMailSubscriptionSettingPage() {
    const [setting, setSetting] = useState<MailSubscriptionSetting | null>(null);
    const [loading, setLoading] = useState(true);
    const params = useParams();
    const settingId = Number(params.id);

    useEffect(() => {
        if (isNaN(settingId)) {
            notFound();
            return;
        }

        const fetchSetting = async () => {
            try {
                const response = await getMailSubscriptionSettingById(settingId);
                setSetting(response.data);
            } catch (error) {
                console.error('Failed to fetch setting', error);
                notFound();
            } finally {
                setLoading(false);
            }
        };

        fetchSetting();
    }, [settingId]);

    if (loading) {
        return <FuseLoading />;
    }

    return (
        <div className="w-full flex flex-col min-h-full p-8">
            <PageBreadcrumb />      
            <Typography variant="h4" className="font-semibold mb-4">
                Edit Mail Subscription Setting
            </Typography>
            <MailSubscriptionSettingForm initialData={setting} />
        </div>
    );
}

export default EditMailSubscriptionSettingPage; 