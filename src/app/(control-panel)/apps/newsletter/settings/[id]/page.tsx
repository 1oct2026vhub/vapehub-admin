'use client';

import { useEffect, useState } from 'react';
import { getMailSubscriptionSettingById } from '@/services/apiMailSubscriptionSettings';
import type { MailSubscriptionSetting } from '@/services/apiMailSubscriptionSettings';
import MailSubscriptionSettingForm from '../_components/MailSubscriptionSettingForm';
import { Typography } from '@mui/material';
import FuseLoading from '@fuse/core/FuseLoading';

interface Params {
    id: string;
}

function EditMailSubscriptionSettingPage({ params }: { params: Params }) {
    const [setting, setSetting] = useState<MailSubscriptionSetting | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                if (params.id) {
                    const response = await getMailSubscriptionSettingById(Number(params.id));
                    setSetting(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch setting', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSetting();
    }, [params.id]);

    if (loading) {
        return <FuseLoading />;
    }

    return (
        <div className="w-full flex flex-col min-h-full p-8">
            <Typography variant="h4" className="font-semibold mb-4">
                Edit Mail Subscription Setting
            </Typography>
            <MailSubscriptionSettingForm initialData={setting} />
        </div>
    );
}

export default EditMailSubscriptionSettingPage; 