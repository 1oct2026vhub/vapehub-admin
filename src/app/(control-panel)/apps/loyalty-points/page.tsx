'use client';
import RefferalMethodTable from 'src/@fuse/core/RefferalMethodTable/RefferalMethodTable';
import LoyaltyHeader from './LoyalityHeader';
import LoyaltyPointsTable from '@fuse/core/LoyaltyPointsTable/LoyaltyPointsTable';

function RefferalMethodsPage() {

	return (
		<div className="p-4">
			<LoyaltyHeader />
      <LoyaltyPointsTable />
		</div>
	);
}

export default RefferalMethodsPage; 