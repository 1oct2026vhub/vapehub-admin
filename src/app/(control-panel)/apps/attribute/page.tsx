"use client";

import { useCallback, useRef } from "react";
import AttributeHeader from "./AttributeHeader";
import AttributeTable from "@fuse/core/AttributeTable/AttributeTable";

function AttributePage() {
  // Create a ref to store the refreshData function from AttributeTable
  const refreshDataRef = useRef<(() => Promise<void>) | null>(null);

  // Pass this function to AttributeHeader
  const handleRefreshData = useCallback(() => {
    if (refreshDataRef.current) {
      return refreshDataRef.current();
    }
    return Promise.resolve();
  }, []);

  // Store the refreshData function from AttributeTable
  const setRefreshFunction = useCallback((refreshFn: () => Promise<void>) => {
    refreshDataRef.current = refreshFn;
  }, []);

  return (
    <div className="w-full p-8">
      <AttributeHeader refreshData={handleRefreshData} />
      <AttributeTable refreshData={setRefreshFunction} />
    </div>
  );
}

export default AttributePage;
