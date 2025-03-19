"use client";

import FusePageSimple from "@fuse/core/FusePageSimple";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import ProductBrandTable from "@fuse/core/ProductBrandTable";
import ProductCategoryTable from "@fuse/core/ProductCategoryTable";

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

function Example() {
  return (
    // <Root
    //   content={
        <div className="mt-4">
          <ProductCategoryTable />
        </div>
    //   }
    // />
  );
}

export default Example;
