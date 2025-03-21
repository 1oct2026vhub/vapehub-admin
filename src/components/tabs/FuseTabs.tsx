// import { styled } from "@mui/material/styles";
// import Tabs from "@mui/material/Tabs";
// import { TabsProps } from "@mui/material/Tabs/Tabs";
// import Box from "@mui/material/Box";
// import clsx from "clsx";

// type StyledTabsProps = TabsProps;

// const FuseTabs = styled((props: StyledTabsProps) => (
//   <Tabs
//     indicatorColor="secondary"
//     textColor="inherit"
//     variant="scrollable"
//     scrollButtons={false}
//     className={clsx("w-full min-h-0", props.className)}
//     classes={{
//       indicator: "flex justify-center bg-transparent w-full h-full",
//     }}
//     TabIndicatorProps={{
//       children: (
//         <Box
//           sx={{ bgcolor: "text.disabled" }}
//           className="w-full h-full rounded-lg opacity-20"
//         />
//       ),
//     }}
//     {...props}
//   />
// ))(() => ({
//   minHeight: 36,
//   "& .MuiTabs-flexContainer": {
//     height: 36,
//   },
//   "& .MuiTab-root:not(:last-of-type)": {
//     marginRight: 4,
//   },
// }));

// export default FuseTabs;

import { styled } from "@mui/material/styles";
import Tabs, { TabsProps } from "@mui/material/Tabs";
import Box from "@mui/material/Box";
import clsx from "clsx";
import { FC } from "react";  // ✅ Import FC for explicit typing

// ✅ Explicitly define the component type
const FuseTabs: FC<TabsProps> = styled((props: TabsProps) => (
  <Tabs
    indicatorColor="secondary"
    textColor="inherit"
    variant="scrollable"
    scrollButtons={false}
    className={clsx("w-full min-h-0", props.className)}
    classes={{
      indicator: "flex justify-center bg-transparent w-full h-full",
    }}
    TabIndicatorProps={{
      children: (
        <Box
          sx={{ bgcolor: "text.disabled" }}
          className="w-full h-full rounded-lg opacity-20"
        />
      ),
    }}
    {...props}
  />
))(() => ({
  minHeight: 36,
  "& .MuiTabs-flexContainer": {
    height: 36,
  },
  "& .MuiTab-root:not(:last-of-type)": {
    marginRight: 4,
  },
}));

export default FuseTabs;
