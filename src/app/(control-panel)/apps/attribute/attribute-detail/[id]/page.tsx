import { Metadata, ResolvingMetadata } from 'next';
import { getAttributeDetails } from '@/services/apiAttribute';
import AttributeDetailDisplay from "../AttributeDetail";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const defaultTitle = "Attribute Details | VapeHub";

  if (id && !isNaN(Number(id))) {
    try {
      const response = await getAttributeDetails(id as string);
      if (response?.data?.attribute?.name) {
        const attributeName = response.data.attribute.name;
        return {
          title: `${attributeName} Details | VapeHub`,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch attribute name for metadata (ID: ${id}):`, error);
    }
  }
  return {
    title: defaultTitle,
  };
}

export default function AttributeDetailPage({ params }: Props) {
  return (
    <div className="p-4">
      <AttributeDetailDisplay />
    </div>
  );
}
