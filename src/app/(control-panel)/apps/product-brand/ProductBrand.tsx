"use client";
import FusePageSimple from "@fuse/core/FusePageSimple";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";
import ProductBrandTable from "@fuse/core/ProductBrandTable";
// import './i18n';

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
  const { t } = useTranslation("examplePage");

  return (
    <Root
      content={
        <div className="mt-4">
          {/* <h4>Content</h4> */}
          <br />
          <ProductBrandTable />
          {/* <DemoContent /> */}
          {/* <DataTable/> */}
        </div>
      }
    />
  );
}

export default Example;
