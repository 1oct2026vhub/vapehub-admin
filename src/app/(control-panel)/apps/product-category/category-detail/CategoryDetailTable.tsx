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
import { Paper, Typography, Avatar } from "@mui/material";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import { categoryDetails } from "@/services/apiProductCategory";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";

export type CategoryType = {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  slug: string;
  parent_id: number | null;
  createdAt: string;
  updatedAt: string;
  updated_by: number;
};

export default function CategoryDetailTable() {
  const params = useParams();
  const id = params?.id;

  const [categoryDetail, setCategoryDetail] = useState<CategoryType | null>(
    null,
  );

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid category ID</p>;
  }

  const { data, error, isLoading } = useFetch(["categoryDetail", id], () =>
    categoryDetails(id),
  );

  useEffect(() => {
    if (data?.data) {
      setCategoryDetail(data.data);
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !categoryDetail) {
    return (
      <p className="text-center text-red-500 mt-28">Category not found!</p>
    );
  }

  const columns: MRT_ColumnDef<CategoryType>[] = [
    { accessorKey: "name", header: "Category Name" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "parent_id", header: "Parent ID" },
    { accessorKey: "updated_by", header: "Updated By" },
    { accessorKey: "updatedAt", header: "Last Updated" },
    { accessorKey: "createdAt", header: "Created At" },
    {
      accessorKey: "logo_url",
      header: "Logo",
      Cell: ({ cell }) =>
        cell.getValue() ? (
          <Avatar
            src={cell.getValue() as string}
            alt="Category Logo"
            variant="rounded"
          />
        ) : (
          "No Logo"
        ),
    },
  ];

  const categoryDetailData: CategoryType = {
    id: categoryDetail.id,
    name: categoryDetail.name,
    description: categoryDetail.description || "N/A",
    slug: categoryDetail.slug,
    parent_id: categoryDetail.parent_id || null,
    updated_by: categoryDetail.updated_by,
    updatedAt: new Date(categoryDetail.updatedAt)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-"),
    createdAt: new Date(categoryDetail.createdAt)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-"),
    logo_url: categoryDetail.logo_url,
  };

  return (
    <div className="mt-10">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
        Category Details
      </Typography>
      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={[categoryDetailData]} columns={columns} />
      </Paper>
    </div>
  );
}
