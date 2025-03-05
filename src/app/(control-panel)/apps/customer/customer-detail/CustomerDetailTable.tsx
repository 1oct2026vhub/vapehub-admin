"use client";
import { useParams } from "next/navigation";
import { Paper, Typography } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { customerDetails } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
};

export default function CustomerDetailsPage() {
  const params = useParams()
  const id = params?.id

  console.log("Customer ID:", id)

  // Prevent API call if id is missing or invalid
  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid customer ID</p>
  }

  // Fetch customer data using SWR (useFetch)
  const { data, error, isLoading } = useFetch(["customerDetail", id], () => customerDetails(id))

  if (isLoading) return <FuseLoading />
  if (error || !data?.data) return <p className="text-center text-red-500 mt-28">Customer not found !</p>

  //  Table Columns
  const columns: MRT_ColumnDef<UserType>[] = [
    { accessorKey: "first_name", header: "First Name" },
    { accessorKey: "last_name", header: "Last Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Contact" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "dob", header: "Date of Birth" },
  ];

  return (
    <div className="mt-10">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">Customer</Typography>
      <Paper className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4" elevation={1}>
        <DataTable data={[data.data]} columns={columns} />
      </Paper>
    </div>
  );
}
