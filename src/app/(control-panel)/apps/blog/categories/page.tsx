import BlogCategoriesApp from './BlogCategoriesApp';
import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export const metadata: Metadata = {
  title: 'Blog Categories',
};

export default function BlogCategoriesPage() {
  return (
    <div>
      <PageBreadcrumb />
      <BlogCategoriesApp />
    </div>
  );
}