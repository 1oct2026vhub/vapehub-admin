'use client';

import MailSubscriptionSettingsTable from './_components/MailSubscriptionSettingsTable';
import { Typography } from '@mui/material';
import Button from '@mui/material/Button';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';

function MailSubscriptionSettingsPage() {
	const router = useRouter();
	return (
		<div className="w-full flex flex-col min-h-full">
			<div className="flex items-center justify-between p-8">
				<Typography variant="h4" className="font-semibold mb-4">
					Mail Subscription Settings
				</Typography>
				{/* <Button
					variant="contained"
					color="primary"
					startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
					onClick={() => router.push('/apps/newsletter/settings/new')}
				>
					Add Setting
				</Button> */}
			</div>
			<div className="p-8">
				<MailSubscriptionSettingsTable />
			</div>
		</div>
	);
}

export default MailSubscriptionSettingsPage; 