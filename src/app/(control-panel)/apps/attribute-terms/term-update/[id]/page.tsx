import { Metadata, ResolvingMetadata } from 'next';
// Assume a service function exists to get term details by ID
import TermUpdateClientPage from "../TermUpdateClientPage"; // Import the new client component

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const defaultTitle = "Update Term | VapeHub";

  
  return {
    title: defaultTitle,
  };
}

// This page.tsx is now a Server Component
export default function EditTermServerPage({ params }: Props) {
  // TermUpdateClientPage will handle its own client-side logic
  return <TermUpdateClientPage />;
}
