"use client";

import { useCallback, useRef } from "react";
import ShippingMethodsHeader from "./ShippingMethodsHeader";
import ShippingMethodsCard from "@fuse/core/ShippingMethodsCard/ShippingMethodsCard";

export default function ShippingMethods() {
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
      <ShippingMethodsHeader refreshData={handleRefreshData} />
      <ShippingMethodsCard refreshData={setRefreshFunction} />
    </div>
  );
}
