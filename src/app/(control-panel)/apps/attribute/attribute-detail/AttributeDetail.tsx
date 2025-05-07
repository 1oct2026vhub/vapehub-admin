"use client";
import { useParams } from "next/navigation";
import { Paper, Typography } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { getAttributeDetails } from "@/services/apiAttribute";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/actions";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export type AttributeType = {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  slug: string | null;
  created_at?: string | null;
};

export default function AttributeDetail() {
  const params = useParams();
  const id = params?.id;

  const [attributeDetail, setAttributeDetail] = useState<AttributeType | null>(
    null,
  );

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid brand ID</p>;
  }

  const { data, error, isLoading } = useFetch(["attributeDetail", id], () =>
    getAttributeDetails(id as string),
  );


  useEffect(() => {
    if (data?.data) {
      setAttributeDetail(data.data);
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !attributeDetail) {
    return <p className="text-center text-red-500 mt-28">Attribute not found!</p>;
  }

  const columns: MRT_ColumnDef<AttributeType>[] = [
    { accessorKey: "name", header: "Attribute Name" },
    // { accessorKey: "description", header: "Description" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "created_at", header: "Created At" },
  ];

  const attributeDetailData: AttributeType = {
    id: attributeDetail.id,
    name: attributeDetail.name,
    description: attributeDetail.description,
    logoUrl: attributeDetail.logoUrl,
    slug: attributeDetail.slug,
    created_at: attributeDetail.created_at
      ? formatDate(attributeDetail.created_at)

      : "",
  };

  return (
    <div className="mt-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Attribute Details
        </Typography>
      </div>
      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={[attributeDetailData]} columns={columns} />
      </Paper>
    </div>
  );
}

