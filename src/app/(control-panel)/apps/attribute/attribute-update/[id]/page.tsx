// import { Metadata, ResolvingMetadata } from 'next';
// import { getAttributeDetails } from '@/services/apiAttribute'; // Service to fetch attribute details
// import AttributeUpdateClientPage from "../AttributeUpdateClientPage"; // Import the new client component

// type Props = {
//   params: { id: string };
//   // searchParams is available as a prop in Server Components if needed by the page shell
//   // searchParams: { [key: string]: string | string[] | undefined }; 
// };

// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const id = params.id;
//   const defaultTitle = "Update Attribute | VapeHub";

//   if (id && !isNaN(Number(id))) {
//     try {
//       const response = await getAttributeDetails(id as string);
//       if (response?.data?.attribute?.name) {
//         const attributeName = response.data.attribute.name;
//         return {
//           title: `Update ${attributeName} | VapeHub`,
//         };
//       }
//     } catch (error) {
//       console.error(`Failed to fetch attribute name for metadata (Update Page ID: ${id}):`, error);
//     }
//   }
//   return {
//     title: defaultTitle,
//   };
// }

// // This page.tsx is now a Server Component
// export default function EditAttributeServerPage({ params, searchParams }: Props & { searchParams: { [key: string]: string | string[] | undefined }}) {
//   // The AttributeUpdateClientPage will handle its own client-side logic,
//   // including the use of useSearchParams and useParams to get data.
//   // We pass searchParams here because the client component might still rely on it 
//   // for the initial attributeData, though it also uses useParams for the ID.
//   // A more robust approach for AttributeUpdateClientPage might be to fetch by ID if searchParams data is missing.
//   return <AttributeUpdateClientPage />;
// }



"use client";
import { useParams } from "next/navigation";
import EditForm from "../EditForm";
import { useEffect } from "react";

const EditAttributePage = () => {
  const params = useParams();
  
  // Get the ID from the URL params
  const id = params ? params.id : null;

  useEffect(() => {
    document.title = "Edit Attribute | VapeHub";
  }, []);

  // Log for debugging
  console.log("Attribute ID from params:", id);

  if (!id) {
    return <p>Attribute ID not found in URL. Please check the link and try again.</p>;
  }

  // Pass undefined as attribute - EditForm will fetch data by ID
  return <EditForm />;
};

export default EditAttributePage;

