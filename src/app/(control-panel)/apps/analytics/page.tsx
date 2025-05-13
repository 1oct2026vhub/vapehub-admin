'use client';

import React, { useEffect } from 'react';
import AnalyticsOverview from './AnalyticsOverview';

function AnalyticsPage() {
  useEffect(() => {
    document.title = "Analytics | VapeHub";
  }, []);
	return <AnalyticsOverview />;
}

export default AnalyticsPage; 