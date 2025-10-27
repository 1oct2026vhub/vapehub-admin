"use client";

import { useState, useEffect } from "react";
import SettingsHeader from "./SettingsHeader";
import SettingsTable from "./SettingsTable";
import { getLegalContentKeys } from "@/services/apiSetting";

const SettingsPageClient = () => {
  const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null);
  const [availableContentKeysCount, setAvailableContentKeysCount] = useState(0);
  const [existingSettingsCount, setExistingSettingsCount] = useState(0);

  const handleRefresh = (fn: () => Promise<void>) => {
    setRefreshFn(() => fn);
  };

  const handleSettingsCountUpdate = (count: number) => {
    setExistingSettingsCount(count);
  };

  // Fetch available content keys count
  useEffect(() => {
    const fetchContentKeys = async () => {
      try {
        const response = await getLegalContentKeys();
        if (response.data?.count) {
          setAvailableContentKeysCount(response.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch content keys:", error);
      }
    };

    fetchContentKeys();
  }, []);

  return (
    <div className="w-full h-full p-6">
      <SettingsHeader 
        availableContentKeysCount={availableContentKeysCount}
        existingSettingsCount={existingSettingsCount}
      />
      <div className="flex flex-col flex-1 w-full pb-24">
        <SettingsTable 
          refreshData={handleRefresh} 
          onSettingsCountUpdate={handleSettingsCountUpdate}
        />
      </div>
    </div>
  );
};

export default SettingsPageClient;

