'use client';

import { useEffect, useState } from 'react';
import { getReferralMethodById, ReferralMethod } from '@/services/apiRefferalMethods';
import RefferalMethodEditForm from './RefferalMethodEditForm';
import RefferalEditHeader from './RefferalEditHeader';

function EditRefferalMethodPage({ params }: { params: { id: string } }) {
	const [referralMethod, setReferralMethod] = useState<ReferralMethod | null>(null);

	useEffect(() => {
		const fetchReferralMethod = async () => {
			try {
				const res = await getReferralMethodById(Number(params.id));
				setReferralMethod(res.data);
			} catch (error) {
				console.error('Failed to fetch referral method', error);
			}
		};

		fetchReferralMethod();
	}, [params.id]);

	if (!referralMethod) {
		return <div>Loading...</div>;
	}

	return (
		<div className="p-4">
			<RefferalEditHeader />
			<RefferalMethodEditForm referralMethod={referralMethod} />
		</div>
	);
}

export default EditRefferalMethodPage; 