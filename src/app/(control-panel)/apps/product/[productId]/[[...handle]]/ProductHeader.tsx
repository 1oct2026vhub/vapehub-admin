"use client";

import { useParams } from "next/navigation";
import Typography from "@mui/material/Typography";

function ProductHeader() {
  const params = useParams();
  const productId = params?.productId as string;
  const isEditMode = productId && productId !== "new";

  return (
    <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-8">
      <Typography
        component="h1"
        className="text-3xl md:text-4xl font-semibold tracking-tight leading-7 md:leading-snug"
      >
        {isEditMode ? "Edit Product" : "Add New Product"}
      </Typography>
    </div>
  );
}

export default ProductHeader;
