"use client";

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
  return (
    <div className="p-4">
      <br />
      <CategoryHeader />
      <ProductCategoryTable />
    </div>
  );
}

export default Category;
