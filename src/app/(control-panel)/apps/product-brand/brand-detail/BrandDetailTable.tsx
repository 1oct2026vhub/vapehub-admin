"use client";
import { useParams } from "next/navigation";
import { Paper, Typography } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { brandDetails } from "@/services/apiProductBrand";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export type BrandType = {
  id: number;
  name: string;
  // description: string | null;
  logoUrl: string | null;
  slug: string | null;
  createdAt?: string | null;
};

export default function BrandDetailTable() {
  const params = useParams();
  const id = params?.id;

  const [brandDetail, setBrandDetail] = useState<BrandType | null>(null);

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid brand ID</p>;
  }

  const { data, error, isLoading } = useFetch(["brandDetail", id], () =>
    brandDetails(id),
  );

  console.log("brand", data);

  useEffect(() => {
    if (data?.data) {
      setBrandDetail(data.data);
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !brandDetail) {
    return <p className="text-center text-red-500 mt-28">Brand not found!</p>;
  }

  const columns: MRT_ColumnDef<BrandType>[] = [
    { accessorKey: "name", header: "Brand Name" },
    // { accessorKey: "description", header: "Description" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "createdAt", header: "Created At" },
  ];

  const brandDetailData: BrandType = {
    id: brandDetail.id,
    name: brandDetail.name,
    // description: brandDetail.description,
    logoUrl: brandDetail.logoUrl,
    slug: brandDetail.slug,
    createdAt: brandDetail.createdAt
      ? new Date(brandDetail.createdAt)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")
      : "",
  };

  return (
    <div className="mt-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Brand Details
        </Typography>
      </div>
      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={[brandDetailData]} columns={columns} />
      </Paper>
    </div>
  );
}
