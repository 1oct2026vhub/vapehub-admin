import { Metadata } from 'next';
import CreateEmailPageClient from './CreateEmailPageClient';

export const metadata: Metadata = {
  title: 'Create Email | VapeHub',
};

export default function CreateEmailPage() {
  return <CreateEmailPageClient />;
}

