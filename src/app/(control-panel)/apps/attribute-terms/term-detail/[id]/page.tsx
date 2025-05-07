import { Metadata, ResolvingMetadata } from 'next';
// Assume a service function exists to get term details by ID
// You might need to create this or adjust the path and function name.

// The actual component that renders the details is a client component
import TermDetailClient from "../TermDetail"; // Assuming TermDetail.tsx exports default

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const defaultTitle = "Term Details | VapeHub";


  return {
    title: defaultTitle,
  };
}

// This Page component is now a Server Component
export default function TermDetailPageServer({ params }: Props) {
  // TermDetailClient will use useParams internally to get the ID and fetch data
  return (
    <div className="p-4">
      <TermDetailClient />
    </div>
  );
}