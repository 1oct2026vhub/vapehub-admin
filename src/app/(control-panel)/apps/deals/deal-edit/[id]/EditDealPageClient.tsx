'use client';

import { useEffect, useState } from 'react';
import { getDealById, Deal } from '@/services/apiDeals';
import DealForm from '../../DealForm';
import { useParams } from 'next/navigation';
import { Typography } from '@mui/material';
import FuseLoading from '@fuse/core/FuseLoading';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function EditDealPageClient() {
    const params = useParams();
    const id = params.id as string;
    const [deal, setDeal] = useState<Deal | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchDeal = async () => {
            try {
                const res = await getDealById(Number(id));
                setDeal(res.data);
            } catch (error) {
                console.error('Failed to fetch deal', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeal();
    }, [id]);

    if (loading) {
        return <FuseLoading />;
    }

    if (!deal) {
        return <Typography>Deal not found</Typography>
    }

    return (
        <div className="p-4">
          <PageBreadcrumb />
             <Typography variant="h4" component="h1" className="mb-4 font-bold">
                Edit Deal
            </Typography>
            <DealForm deal={deal} />
        </div>
    );
}

export default EditDealPageClient; 