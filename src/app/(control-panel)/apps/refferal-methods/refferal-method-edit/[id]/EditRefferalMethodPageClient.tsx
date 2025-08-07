'use client';

import { useEffect, useState } from 'react';
import { getReferralMethodById, ReferralMethod } from '@/services/apiRefferalMethods';
import RefferalMethodEditForm from './RefferalMethodEditForm';
import { useParams } from 'next/navigation';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Box, Typography, CircularProgress } from '@mui/material';

function EditRefferalMethodPageClient() {
	const params = useParams();
	const id = params.id as string;
	const [referralMethod, setReferralMethod] = useState<ReferralMethod | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!id) return;
		const fetchReferralMethod = async () => {
			try {
				const res = await getReferralMethodById(Number(id));
				setReferralMethod(res.data?.data);
			} catch (error) {
				console.error('Failed to fetch referral method', error);
			} finally {
				setLoading(false);
			}
		};

		fetchReferralMethod();
	}, [id]);

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
				<CircularProgress />
			</Box>
		);
	}

	if (!referralMethod) {
		return (
			<Box sx={{ p: 3 }}>
				<PageBreadcrumb />
				<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
					Edit Referral Method
				</Typography>
				<Typography color="error">Referral method not found.</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
      <PageBreadcrumb />
			<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
				Edit Referral Method
			</Typography>
			<RefferalMethodEditForm referralMethod={referralMethod} />
		</Box>
	);
}

export default EditRefferalMethodPageClient; 