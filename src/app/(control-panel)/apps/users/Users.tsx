"use client";

import FusePageSimple from "@fuse/core/FusePageSimple";
import { styled } from "@mui/material/styles";
import UserTable from "@fuse/core/UserTable";
import UserHeader from "./UserHeader";

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
    <div className="p-4">
      <br />
      <UserHeader />
      <UserTable />
    </div>
  );
}

export default Example;
