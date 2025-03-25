// "use client";
// import { useParams } from "next/navigation";
// import { Paper, Typography } from "@mui/material";
// import { type MRT_ColumnDef } from "material-react-table";
// import DataTable from "@/components/data-table/DataTable";
// import { brandDetails } from "@/services/apiProductBrand";
// import { useFetch } from "@/hooks/useFetch";
// import FuseLoading from "@fuse/core/FuseLoading";
// import { useEffect, useState } from "react";

// export type UserType = {
//   id: number;
//   first_name: string | null;
//   last_name: string | null;
//   email: string;
//   phone: number;
//   gender: string | null;
//   dob: string | null;
//   blocked?: boolean; // Added 'blocked' field if needed
//   createdAt?: string | null;
// };

// export default function BrandDetailTable() {
//   const params = useParams();
//   const id = params?.id;

//   // State should be an object (UserType | null) instead of an array
//   const [customerDetail, setCustomerDetail] = useState<UserType | null>(null);

//   // Prevent API call if ID is missing or invalid
//   if (!id || isNaN(Number(id))) {
//     return <p className="text-center text-red-500">Invalid customer ID</p>;
//   }

//   // Fetch customer data using SWR (useFetch)
//   const { data, error, isLoading } = useFetch(["customerDetail", id], () =>
//     brandDetails(id)
//   );

//   console.log("brand",data);

//   useEffect(() => {
//     if (data?.data) {
//       setCustomerDetail(data.data);
//     }
//   }, [data]);

//   if (isLoading) return <FuseLoading />;
//   if (error || !customerDetail) {
//     return <p className="text-center text-red-500 mt-28">Customer not found!</p>;
//   }

//   // Table Columns
//   const columns: MRT_ColumnDef<UserType>[] = [
//     { accessorKey: "first_name", header: "First Name" },
//     { accessorKey: "last_name", header: "Last Name" },
//     { accessorKey: "email", header: "Email" },
//     { accessorKey: "createdAt", header: "Created At" },
//     { accessorKey: "phone", header: "Contact" },
//     { accessorKey: "gender", header: "Gender" },
//     { accessorKey: "dob", header: "Date of Birth" },
//   ];

//   // Ensure customerDetail is not null before accessing properties
//   const customerDetailData: UserType = {
//     id: customerDetail.id,
//     first_name: customerDetail.first_name,
//     last_name: customerDetail.last_name,
//     email: customerDetail.email,
//     createdAt: customerDetail.createdAt
//     ? new Date(customerDetail.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-") 
//     : "",
//     phone: customerDetail.phone,
//     gender: customerDetail.gender,
//     dob: customerDetail.dob ? new Date(customerDetail.dob).toISOString().split("T")[0] : "",
//     blocked: customerDetail.blocked,
//   };

//   return (
//     <div className="mt-10">
//       <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
//         Customer Details
//       </Typography>
//       <Paper
//         className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
//         elevation={1}
//       >
//         <DataTable data={[customerDetailData]} columns={columns} />
//       </Paper>
//     </div>
//   );
// }

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
    return <p className="text-center text-red-500 mt-28">Brand not found!</p>;
  }

  const columns: MRT_ColumnDef<AttributeType>[] = [
    { accessorKey: "name", header: "Brand Name" },
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

// "use client";
// import { useParams } from "next/navigation";
// import { Paper, Typography, Grid, Divider, Chip } from "@mui/material";
// import { type MRT_ColumnDef } from "material-react-table";
// import DataTable from "@/components/data-table/DataTable";
// import { getAttributeDetails } from "@/services/apiAttribute";
// import { useFetch } from "@/hooks/useFetch";
// import FuseLoading from "@fuse/core/FuseLoading";
// import { useEffect, useState, useMemo } from "react";

// export type AttributeType = {
//   id: number;
//   name: string;
//   description: string | null;
//   logoUrl: string | null;
//   website: string | null;
//   createdAt?: string | null;
// };

// interface AttributeDetailProps {
//   id: string;
// }

// const AttributeDetail = ({ id }: AttributeDetailProps) => {
//   const { data, error, isLoading } = useFetch(
//     ['attributeDetail', id],
//     () => getAttributeDetails(id),
//     { revalidateOnFocus: false }
//   );

//   const attribute = data?.data?.attribute;

//   const termColumns = useMemo<MRT_ColumnDef<any>[]>(() => [
//     { accessorKey: 'id', header: 'ID' },
//     { accessorKey: 'name', header: 'Name' },
//     { accessorKey: 'slug', header: 'Slug' },
//     { accessorKey: 'description', header: 'Description' },
//     { accessorKey: 'sort_order', header: 'Sort Order' },
//     {
//       accessorKey: 'created_at',
//       header: 'Created At',
//       Cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
//     },
//   ], []);

//   if (isLoading) return <FuseLoading />;
//   if (error) return <Typography color="error">Error loading attribute details</Typography>;
//   if (!attribute) return <Typography>Attribute not found</Typography>;

//   return (
//     <div className="p-4 md:p-8">
//       <Paper className="p-6 mb-6">
//         <Typography variant="h4" className="mb-6">
//           Attribute Details
//         </Typography>

//         <Grid container spacing={3}>
//           <Grid item xs={12} md={6}>
//             <Typography variant="subtitle1" color="textSecondary">Name</Typography>
//             <Typography variant="body1" className="mb-4">{attribute.name}</Typography>

//             <Typography variant="subtitle1" color="textSecondary">Slug</Typography>
//             <Typography variant="body1" className="mb-4">{attribute.slug}</Typography>

//             <Typography variant="subtitle1" color="textSecondary">Type</Typography>
//             <Chip label={attribute.type} color="primary" size="small" className="mb-4" />
//           </Grid>

//           <Grid item xs={12} md={6}>
//             <Typography variant="subtitle1" color="textSecondary">Sort Order</Typography>
//             <Typography variant="body1" className="mb-4">{attribute.sort_order}</Typography>

//             <Typography variant="subtitle1" color="textSecondary">Description</Typography>
//             <Typography variant="body1" className="mb-4">{attribute.description || 'No description'}</Typography>

//             <Typography variant="subtitle1" color="textSecondary">Status</Typography>
//             <Chip
//               label={attribute.deleted_at ? 'Deleted' : 'Active'}
//               color={attribute.deleted_at ? 'error' : 'success'}
//               size="small"
//             />
//           </Grid>
//         </Grid>
//       </Paper>

//       {attribute.terms && attribute.terms.length > 0 && (
//         <Paper className="p-6">
//           <Typography variant="h5" className="mb-6">
//             Attribute Terms
//           </Typography>
//           <DataTable
//             data={attribute.terms}
//             columns={termColumns}
//           />
//         </Paper>
//       )}
//     </div>
//   );
// };

// export default AttributeDetail;
