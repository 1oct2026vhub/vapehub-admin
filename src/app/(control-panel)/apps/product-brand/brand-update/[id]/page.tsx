// "use client";
// import { useSearchParams } from "next/navigation";
// import EditForm from "../EditForm";

// const EditUserPage = () => {
//   const searchParams = useSearchParams();
//   const brandData = searchParams.get("brandData");

//   const brand = brandData ? JSON.parse(decodeURIComponent(brandData)) : null;

//   //   if (!user) return <p>No user data found.</p>;

//   return <EditForm brand={brand} />;
// };

// export default EditUserPage;

// // 'use client'
// // import { useSearchParams } from 'next/navigation';
// // import EditForm from '../EditForm';

// // const EditUserPage = () => {
// //   const searchParams = useSearchParams();
// //   const brandId = searchParams.get('brandId');

// // //   const brand = brandData ? JSON.parse(decodeURIComponent(brandData)) : null;

// // //   if (!user) return <p>No user data found.</p>;

// //   return <EditForm brandId={brandId} />;
// // };

// // export default EditUserPage;


import { Metadata, ResolvingMetadata } from 'next';
import { getAttributeDetails } from '@/services/apiAttribute'; // Service to fetch attribute details
import BrandUpdateClientPage from "../BrandUpdateClientPage"; // Import the new client component

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const defaultTitle = "Update Brand | VapeHub";

  return {
    title: defaultTitle,
  };
}

// This page.tsx is now a Server Component
export default function EditAttributeServerPage({ params, searchParams }: Props & { searchParams: { [key: string]: string | string[] | undefined }}) {
  return <BrandUpdateClientPage />;
}
