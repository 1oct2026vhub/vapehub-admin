"use client";

import { useCallback, useRef } from "react";
import AttributeHeader from "./AttributeHeader";
import AttributeTable from "@fuse/core/AttributeTable/AttributeTable";

// This is the client component that contains the original page logic
export default function AttributePageClient() {
  const refreshDataRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefreshData = useCallback(() => {
    if (refreshDataRef.current) {
      return refreshDataRef.current();
    }
    return Promise.resolve();
  }, []);

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