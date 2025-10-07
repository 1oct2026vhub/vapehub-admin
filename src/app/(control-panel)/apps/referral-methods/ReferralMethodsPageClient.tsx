'use client';

import ReferralMethodTable from 'src/@fuse/core/ReferralMethodTable/ReferralMethodTable';
import ReferralHeader from './ReferralHeader';

function ReferralMethodsPageClient() {
	return (
		<div className="p-4">
			<ReferralHeader />
			<ReferralMethodTable />
		</div>
	);
}

export default ReferralMethodsPageClient; 