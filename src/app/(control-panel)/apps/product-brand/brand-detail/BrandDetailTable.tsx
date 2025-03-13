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
import { brandDetails } from "@/services/apiProductBrand";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";

export type BrandType = {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
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
    brandDetails(id)
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
    { accessorKey: "description", header: "Description" },
    { accessorKey: "website", header: "Website" },
    { accessorKey: "createdAt", header: "Created At" },
  ];

  const brandDetailData: BrandType = {
    id: brandDetail.id,
    name: brandDetail.name,
    description: brandDetail.description,
    logoUrl: brandDetail.logoUrl,
    website: brandDetail.website,
    createdAt: brandDetail.createdAt
      ? new Date(brandDetail.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")
      : "",
  };

  return (
    <div className="mt-10">
      <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4">
        Brand Details
      </Typography>
      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-4"
        elevation={1}
      >
        <DataTable data={[brandDetailData]} columns={columns} />
      </Paper>
    </div>
  );
}


