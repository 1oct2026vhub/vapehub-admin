"use client";

import { useState } from "react";
import SettingsHeader from "./SettingsHeader";
import SettingsTable from "./SettingsTable";

const SettingsPageClient = () => {
  const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null);

  const handleRefresh = (fn: () => Promise<void>) => {
    setRefreshFn(() => fn);
  };

  return (
    <div className="w-full h-full p-6">
      <SettingsHeader />
      <div className="flex flex-col flex-1 w-full pb-24">
        <SettingsTable refreshData={handleRefresh} />
      </div>
    </div>
  );
};

export default SettingsPageClient;

