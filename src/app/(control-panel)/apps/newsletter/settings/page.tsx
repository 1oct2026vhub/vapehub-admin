'use client';

import { useState, useCallback } from 'react';
import MailSubscriptionSettingsTable from './_components/MailSubscriptionSettingsTable';
import { Typography } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function MailSubscriptionSettingsPage() {
	const router = useRouter();
	const [hasSettings, setHasSettings] = useState(false);

	const handleSettingsUpdate = useCallback((settingsCount: number) => {
		setHasSettings(settingsCount > 0);
	}, []);

	return (
		<div className="w-full flex flex-col min-h-full p-6">
      <PageBreadcrumb />
			<div className="flex items-center justify-between">
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-4">
					Mail Subscription Settings
          </Typography>
				{!hasSettings && (
					<AppButton
						label="Add Setting"
						startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
						onClick={() => router.push('/apps/newsletter/settings/new')}
					/>
				)}
			</div>
			<div>
				<MailSubscriptionSettingsTable onSettingsUpdate={handleSettingsUpdate} />
			</div>
		</div>
	);
}

export default MailSubscriptionSettingsPage; 