import { Metadata } from 'next';
import EmailBuilderPageClient from './EmailBuilderPageClient';

export const metadata: Metadata = {
  title: 'Email builder | Newsletter',
};

export default function EmailBuilderPage() {
  return <EmailBuilderPageClient />;
}
