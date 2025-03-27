"use client";

import { useCallback, useRef } from "react";
import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import ProductCategoryTable from "@fuse/core/ProductCategoryTable";
import CategoryHeader from "./CategoryHeader";

const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.divider,
  },
  "& .FusePageSimple-content": {},
  "& .FusePageSimple-sidebarHeader": {},
  "& .FusePageSimple-sidebarContent": {},
}));

function Category() {
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
      <br />
      <CategoryHeader refreshData={refreshData} />
      <ProductCategoryTable refreshData={setRefreshFunction} />
    </div>
  );
}

export default Category;
