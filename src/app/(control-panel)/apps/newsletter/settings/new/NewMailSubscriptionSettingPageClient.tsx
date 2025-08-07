'use client';

import { Typography } from '@mui/material';
import MailSubscriptionSettingForm from '../_components/MailSubscriptionSettingForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function NewMailSubscriptionSettingPageClient() {
	return (
		<div className="w-full flex flex-col min-h-full p-8">
      <PageBreadcrumb />
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-4">
        New Mail Subscription Setting
      </Typography>
            <MailSubscriptionSettingForm />
		</div>
	);
}

export default NewMailSubscriptionSettingPageClient; 