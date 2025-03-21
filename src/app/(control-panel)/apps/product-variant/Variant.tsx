"use client";

import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import VariantHeader from "./VariantHeader";
import ProductVariantTable from "@fuse/core/ProductVariantTable";

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

function Variant() {
  return (
    <div className="p-4">
      <br />
      <VariantHeader />
      <ProductVariantTable />
    </div>
  );
}

export default Variant;
