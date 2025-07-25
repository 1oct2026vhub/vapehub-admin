'use client';
import { useState, useCallback } from 'react';
import RefferalMethodTable from 'src/@fuse/core/RefferalMethodTable/RefferalMethodTable';
import LoyaltyHeader from './LoyalityHeader';
import LoyaltyPointsTable from '@fuse/core/LoyaltyPointsTable/LoyaltyPointsTable';

function RefferalMethodsPage() {
	const [hasSettings, setHasSettings] = useState(false);

	const handleSettingsUpdate = useCallback((settingsCount: number) => {
		setHasSettings(settingsCount > 0);
	}, []);

	return (
		<div className="p-4">
			<LoyaltyHeader showCreateButton={!hasSettings} />
      <LoyaltyPointsTable onSettingsUpdate={handleSettingsUpdate} />
		</div>
	);
}

export default RefferalMethodsPage; 