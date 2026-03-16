import { Metadata } from 'next';
import TemplatesPageClient from './TemplatesPageClient';

export const metadata: Metadata = {
  title: 'My Email Templates | VapeHub',
};

export default function TemplatesPage() {
  return <TemplatesPageClient />;
}

