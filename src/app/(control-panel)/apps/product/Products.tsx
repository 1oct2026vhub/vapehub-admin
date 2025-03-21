"use client";

import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import ProductHeader from "./ProductHeader";
import ProductListTable from "@fuse/core/ProductListTable";

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

/**
 * The products page.
 */

function Products() {
  return (
    <div className="p-4">
      <ProductHeader />
      <ProductListTable />
    </div>
  );
}

export default Products;
