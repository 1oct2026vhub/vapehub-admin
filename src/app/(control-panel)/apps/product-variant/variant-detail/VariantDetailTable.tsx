"use client";
import { useParams } from "next/navigation";
import { Paper, Typography } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { getVariantDetails } from "@/services/apiProductVariant";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";
import { ProductVariant } from "@/services/apiProductVariant";

export type VariantDetailType = {
  id: number;
  product_id: number;
  sku: string;
  barcode: string;
  price: number;
  stock_quantity: number;
  stock_status: string;
  created_at: string;
  updated_at: string;
};

export default function VariantDetailTable() {
  const params = useParams();
  const id = params?.id;

  const [variantDetail, setVariantDetail] = useState<VariantDetailType | null>(
    null,
  );

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid variant ID</p>;
  }

  const { data, error, isLoading } = useFetch(["variantDetail", id], () =>
    getVariantDetails(Number(id)),
  );

  useEffect(() => {
    if (data?.data) {
      setVariantDetail(data.data);
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !variantDetail) {
    return <p className="text-center text-red-500 mt-28">Variant not found!</p>;
  }

  const columns: MRT_ColumnDef<VariantDetailType>[] = [
    { accessorKey: "id", header: "Variant ID" },
    { accessorKey: "product_id", header: "Product ID" },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "barcode", header: "Barcode" },
    {
      accessorKey: "price",
      header: "Price",
      Cell: ({ row }) => {
        const price = Number(row.original.price);
        return `$${price.toFixed(2)}`;
      },
    },
    { accessorKey: "stock_quantity", header: "Stock Quantity" },
    {
      accessorKey: "stock_status",
      header: "Stock Status",
      Cell: ({ row }) => {
        const statusMap = {
          in_stock: "In Stock",
          out_of_stock: "Out of Stock",
          low_stock: "Low Stock",
        };
        return (
          statusMap[row.original.stock_status] || row.original.stock_status
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      Cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString("en-GB"),
    },
    {
      accessorKey: "updated_at",
      header: "Updated At",
      Cell: ({ row }) =>
        new Date(row.original.updated_at).toLocaleDateString("en-GB"),
    },
  ];

  const variantDetailData: VariantDetailType = {
    id: variantDetail.id,
    product_id: variantDetail.product_id,
    sku: variantDetail.sku,
    barcode: variantDetail.barcode,
    price: variantDetail.price,
    stock_quantity: variantDetail.stock_quantity,
    stock_status: variantDetail.stock_status,
    created_at: variantDetail.created_at,
    updated_at: variantDetail.updated_at,
  };

  return (
    <div className="mt-10">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
        Variant Details
      </Typography>
      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={[variantDetailData]} columns={columns} />
      </Paper>
    </div>
  );
}
