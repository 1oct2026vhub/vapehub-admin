'use client';

import { Typography } from '@mui/material';
import MailSubscriptionSettingForm from '../_components/MailSubscriptionSettingForm';

function NewMailSubscriptionSettingPage() {
	return (
		<div className="w-full flex flex-col min-h-full p-8">
			<Typography variant="h4" className="font-semibold mb-4">
				New Mail Subscription Setting
			</Typography>
            <MailSubscriptionSettingForm />
		</div>
	);
}

export default NewMailSubscriptionSettingPage; 