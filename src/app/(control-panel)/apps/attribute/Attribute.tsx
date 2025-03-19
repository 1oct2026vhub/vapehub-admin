"use client";

import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import ProductBrandTable from "@fuse/core/ProductBrandTable";
import AttributeHeader from "./AttributeHeader";
import AttributeTable from "@fuse/core/AttributeTable";

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

function Attribute() {
  return (
    <div className="p-4">
      <br />
      <AttributeHeader />
      <AttributeTable />
    </div>
  );
}

export default Attribute;
