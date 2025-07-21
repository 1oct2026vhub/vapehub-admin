'use client';

import SubscribersTable from './_components/SubscribersTable';
import Typography from '@mui/material/Typography';
import SubscriberStats from './_components/SubscriberStats';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function SubscribersPage() {
	return (
		<div className="w-full flex flex-col min-h-full p-12">
      <PageBreadcrumb />
			<div className='pb-12'>
				<Typography
					variant="h4"
					className="mb-4 font-semibold leading-tight"
				>
					Subscriber Analytics
				</Typography>
				<SubscriberStats />
			</div>

			<div>
				<Typography
					variant="h4"
					className="mb-4 font-semibold leading-tight"
				>
					Subscribers
				</Typography>
				{/* <Typography
					variant="subtitle1"
					className="mb-12 text-gray-600"
				>
					A list of all the users subscribed to your newsletter.
				</Typography> */}
				<SubscribersTable />
			</div>
		</div>
	);
}

export default SubscribersPage; 