'use client';

import MailSubscriptionSettingsTable from './_components/MailSubscriptionSettingsTable';
import { Typography } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function MailSubscriptionSettingsPage() {
	const router = useRouter();
	return (
		<div className="w-full flex flex-col min-h-full p-6">
      <PageBreadcrumb />
			<div className="flex items-center justify-between">
				<Typography variant="h4" className="font-semibold mb-4">
					Mail Subscription Settings
				</Typography>
				<AppButton
					label="Add Setting"
					startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
					onClick={() => router.push('/apps/newsletter/settings/new')}
				/>
			</div>
			<div>
				<MailSubscriptionSettingsTable />
			</div>
		</div>
	);
}

export default MailSubscriptionSettingsPage; 