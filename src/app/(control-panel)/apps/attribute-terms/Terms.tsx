"use client";

import { useEffect } from "react";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import TermsHeader from "./TermsHeader";
import AttributeTermTable from "@fuse/core/AttributeTermTable/AttributeTermTable";

function Terms() {
  const isMobile = useThemeMediaQuery((theme: any) =>
    theme.breakpoints.down("lg"),
  );

  return (
    <div className="p-4">
      <TermsHeader />
      <AttributeTermTable />
    </div>
  );
}

export default Terms;
