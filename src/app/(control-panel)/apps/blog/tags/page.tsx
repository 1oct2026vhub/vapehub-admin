import BlogTagsApp from './BlogTagsApp';
import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export const metadata: Metadata = {
  title: 'Blog Tags | VapeHub',
};

export default function BlogTagsPage() {
  return (
    <div>
      <PageBreadcrumb />
      <BlogTagsApp />
    </div>
  );
}