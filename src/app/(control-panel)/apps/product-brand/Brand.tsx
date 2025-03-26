"use client";

import { styled } from "@mui/material/styles";
import ProductBrandTable from "@fuse/core/ProductBrandTable";
import { useCallback, useRef } from "react";
import BrandHeader from "./BrandHeader";

function Brand() {
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
      <BrandHeader refreshData={refreshData} />
      <ProductBrandTable refreshData={setRefreshFunction} />
    </div>
  );
}

export default Brand;
