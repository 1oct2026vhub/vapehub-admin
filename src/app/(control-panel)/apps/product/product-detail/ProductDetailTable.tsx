"use client";
import { useParams } from "next/navigation";
import { Paper, Typography } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { getProduct } from "@/services/apiProduct";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";

export type ProductType = {
  id: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  brand_name: string;
  category_id: number | null;
  createdAt?: string;
};

export default function ProductDetailTable() {
  const params = useParams();
  const idParam = params?.id;

  // ✅ Ensure ID is properly cast as a number or set to `null` if invalid
  const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam || "");
  const [productDetail, setProductDetail] = useState<ProductType | null>(null);

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid product ID</p>;
  }

  const { data, error, isLoading } = useFetch(["getProduct", id], () =>
    getProduct(id),
  );

  console.log("product", data);

  useEffect(() => {
    if (data?.data) {
      const productData = data.data;
      setProductDetail({
        id: productData.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock_quantity: productData.stock_quantity,
        brand_name: productData.Brand?.name || "N/A",
        category_id: productData.category_id,
        createdAt: productData.createdAt
          ? new Date(productData.createdAt)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "",
      });
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !productDetail) {
    return <p className="text-center text-red-500 mt-28">Product not found!</p>;
  }

  const columns: MRT_ColumnDef<ProductType>[] = [
    { accessorKey: "id", header: "Id" },
    { accessorKey: "name", header: "Product Name" },
    // { accessorKey: "description", header: "Description" },
    { accessorKey: "price", header: "Price ($)" },
    { accessorKey: "stock_quantity", header: "Stock Quantity" },
    { accessorKey: "brand_name", header: "Brand" },
    { accessorKey: "category_id", header: "Category ID" },
    { accessorKey: "createdAt", header: "Created At" },
  ];

  return (
    <div className="mt-10">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
        Product Details
      </Typography>
      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={[productDetail]} columns={columns} />
      </Paper>
    </div>
  );
}
