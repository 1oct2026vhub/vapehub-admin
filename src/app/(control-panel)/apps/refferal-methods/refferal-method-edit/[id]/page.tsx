'use client';

import { useEffect, useState } from 'react';
import { getReferralMethodById, ReferralMethod } from '@/services/apiRefferalMethods';
import RefferalMethodEditForm from './RefferalMethodEditForm';
import { useParams } from 'next/navigation';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function EditRefferalMethodPage() {
	const params = useParams();
	const id = params.id as string;
	const [referralMethod, setReferralMethod] = useState<ReferralMethod | null>(null);

	useEffect(() => {
		if (!id) return;
		const fetchReferralMethod = async () => {
			try {
				const res = await getReferralMethodById(Number(id));
				setReferralMethod(res.data?.data);
			} catch (error) {
				console.error('Failed to fetch referral method', error);
			}
		};

		fetchReferralMethod();
	}, [id]);

	if (!referralMethod) {
		return <div>Loading...</div>;
	}

	return (
		<div className="p-4">
      <PageBreadcrumb />
			<RefferalMethodEditForm referralMethod={referralMethod} />
		</div>
	);
}

export default EditRefferalMethodPage; 