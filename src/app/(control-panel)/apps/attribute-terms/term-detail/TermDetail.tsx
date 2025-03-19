"use client";

import { useMemo } from "react";
import { Paper, Typography, Grid, Chip } from "@mui/material";
import { useFetch } from "@/hooks/useFetch";
import { getAttributeTermDetails } from "@/services/apiAttributeTerm";
import FuseLoading from "@fuse/core/FuseLoading";
import DataTable from "@/components/data-table/DataTable";
import type { MRT_ColumnDef } from "material-react-table";

interface TermDetailProps {
  id: string;
}

const TermDetail = ({ id }: TermDetailProps) => {
  const { data, error, isLoading } = useFetch(
    ["termDetail", id],
    () => getAttributeTermDetails(id),
    { revalidateOnFocus: false },
  );

  const term = data?.data;

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      { accessorKey: "id", header: "Attribute ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      { accessorKey: "description", header: "Description" },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleDateString(),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => (
          <Chip
            label={row.original.deleted_at ? "Deleted" : "Active"}
            color={row.original.deleted_at ? "error" : "success"}
            size="small"
          />
        ),
      },
    ],
    [],
  );

  if (isLoading) return <FuseLoading />;
  if (error)
    return <Typography color="error">Error loading term details</Typography>;
  if (!term) return <Typography>Term not found</Typography>;

  const termData = [
    {
      ...term,
      description: term.description || "No description",
    },
  ];

  return (
    <div className="mt-10">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
        Term Details
      </Typography>

      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={termData} columns={columns} />
      </Paper>
    </div>
  );
};

export default TermDetail;
