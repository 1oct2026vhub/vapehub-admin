import { Metadata, ResolvingMetadata } from 'next';
import { getAttributeDetails } from '@/services/apiAttribute'; // Service to fetch attribute details
import AttributeUpdateClientPage from "../AttributeUpdateClientPage"; // Import the new client component

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const defaultTitle = "Update Attribute | VapeHub";

  if (id && !isNaN(Number(id))) {
    try {
      const response = await getAttributeDetails(id as string);
      if (response?.data?.attribute?.name) {
        const attributeName = response.data.attribute.name;
        return {
          title: `Update ${attributeName} | VapeHub`,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch attribute name for metadata (Update Page ID: ${id}):`, error);
    }
  }
  return {
    title: defaultTitle,
  };
}

// This page.tsx is now a Server Component
export default function EditAttributeServerPage({ params, searchParams }: Props & { searchParams: { [key: string]: string | string[] | undefined }}) {
  return <AttributeUpdateClientPage />;
}
