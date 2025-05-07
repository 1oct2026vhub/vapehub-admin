import { Metadata } from 'next';
import CreateTermsClient from "./CreateTerms"; // Assuming CreateTerms.tsx exports the client logic

export const metadata: Metadata = {
  title: 'Create Attribute Term | VapeHub',
};

// This page.tsx is now a Server Component
export default function CreateTermServerPage() {
  return <CreateTermsClient />;
}
