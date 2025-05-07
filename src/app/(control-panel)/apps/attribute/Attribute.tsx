// "use client";

// import FusePageSimple from "@fuse/core/FusePageSimple";
// import { styled } from "@mui/material/styles";
// import ProductBrandTable from "@fuse/core/ProductBrandTable";
// import AttributeHeader from "./AttributeHeader";
// import AttributeTable from "@fuse/core/AttributeTable";

// const Root = styled(FusePageSimple)(({ theme }) => ({
//   "& .FusePageSimple-header": {
//     backgroundColor: "white",
//     borderBottomWidth: 1,
//     borderStyle: "solid",
//     borderColor: theme.palette.divider,
//   },
//   "& .FusePageSimple-content": {},
//   "& .FusePageSimple-sidebarHeader": {},
//   "& .FusePageSimple-sidebarContent": {},
// }));

// function Attribute() {
//   return (
//     <div className="p-4">
//       <br />
//       <AttributeHeader />
//       <AttributeTable />
//     </div>
//   );
// }

// export default Attribute;

"use client";

import { useCallback, useRef } from "react";
import AttributeHeader from "./AttributeHeader";
import AttributeTable from "@fuse/core/AttributeTable/AttributeTable";

// This is the client component that contains the original page logic
export default function Attribute() {
  const refreshDataRef = useRef<(() => Promise<void>) | null>(null);

  const handleRefreshData = useCallback(() => {
    if (refreshDataRef.current) {
      return refreshDataRef.current();
    }
    return Promise.resolve();
  }, []);

  const setRefreshFunction = useCallback((refreshFn: () => Promise<void>) => {
    refreshDataRef.current = refreshFn;
  }, []);

  return (
    <div className="w-full p-8">
      <AttributeHeader refreshData={handleRefreshData} />
      <AttributeTable refreshData={setRefreshFunction} />
    </div>
  );
} 