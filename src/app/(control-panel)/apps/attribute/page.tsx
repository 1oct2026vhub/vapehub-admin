import { Metadata } from 'next';
import Attribute from './Attribute'; // Import the new client component

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Attributes | VapeHub',
};

// This page.tsx is now a Server Component
export default function AttributePage() {
  return <Attribute />;
}
