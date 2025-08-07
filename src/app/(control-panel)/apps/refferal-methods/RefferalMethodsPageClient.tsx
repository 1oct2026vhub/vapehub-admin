'use client';

import RefferalMethodTable from 'src/@fuse/core/RefferalMethodTable/RefferalMethodTable';
import RefferalHeader from './RefferalHeader';

function RefferalMethodsPageClient() {
	return (
		<div className="p-4">
			<RefferalHeader />
			<RefferalMethodTable />
		</div>
	);
}

export default RefferalMethodsPageClient; 