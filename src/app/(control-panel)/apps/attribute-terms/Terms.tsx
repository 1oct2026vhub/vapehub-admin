"use client";

import { useEffect, useRef, useCallback } from "react";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import TermsHeader from "./TermsHeader";
import AttributeTermTable from "@fuse/core/AttributeTermTable/AttributeTermTable";

function Terms() {
  const isMobile = useThemeMediaQuery((theme: any) =>
    theme.breakpoints.down("lg")
  );

  // Reference to the actual refresh function from the table
  const refreshFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Function to be called from the header to refresh the table
  const refreshData = useCallback((): Promise<void> => {
    if (refreshFunctionRef.current) {
      return refreshFunctionRef.current();
    }
    return Promise.resolve();
  }, []);

  // Function to store the table's refresh function
  const setRefreshFunction = useCallback((fn: () => Promise<void>) => {
    refreshFunctionRef.current = fn;
  }, []);

  return (
    <div className="p-4">
      <TermsHeader refreshData={refreshData} />
      <AttributeTermTable refreshData={setRefreshFunction} />
    </div>
  );
}

export default Terms;
