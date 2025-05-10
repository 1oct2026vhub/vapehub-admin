"use client";
import { useParams } from "next/navigation";
import { Paper, Typography } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { customerDetails } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number | null;
  gender: string | null;
  dob: string | null;
  blocked?: boolean;
  createdAt?: string | null;
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [customerDetail, setCustomerDetail] = useState<UserType | null>(null);

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid customer ID</p>;
  }

  const { data, error, isLoading } = useFetch(["customerDetail", id], () =>
    customerDetails(id),
  );

  useEffect(() => {
    if (data?.data) {
      setCustomerDetail(data.data);
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !customerDetail) {
    return (
      <p className="text-center text-red-500 mt-28">Customer not found!</p>
    );
  }

  const columns: MRT_ColumnDef<UserType>[] = [
    {
      accessorKey: "first_name",
      header: "First Name",
      Cell: ({ row }) => row.original.first_name || "N/A",
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
      Cell: ({ row }) => row.original.last_name || "N/A",
    },
    {
      accessorKey: "email",
      header: "Email",
      Cell: ({ row }) => row.original.email || "N/A",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      Cell: ({ row }) => 
        row.original.createdAt 
          ? new Date(row.original.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") 
          : "N/A",
    },
    {
      accessorKey: "phone",
      header: "Contact",
      Cell: ({ row }) => (row.original.phone != null ? String(row.original.phone) : "N/A"),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      Cell: ({ row }) => row.original.gender || "N/A",
    },
    {
      accessorKey: "dob",
      header: "Date of Birth",
      Cell: ({ row }) => 
        row.original.dob 
          ? new Date(row.original.dob).toISOString().split("T")[0] 
          : "N/A",
    },
  ];

  return (
    <div className="mt-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Customer Details
        </Typography>
      </div>

      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable 
          data={[customerDetail]} 
          columns={columns} 
          // enableRowSelection={false}
          enableRowActions={false}
        />
      </Paper>
    </div>
  );
}
