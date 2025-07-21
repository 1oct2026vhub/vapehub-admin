import BlogPostsApp from './BlogPostsApp';
import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export const metadata: Metadata = {
  title: 'Blog Posts',
};

export default function BlogPostsPage() {
  return (
    <div>
      <PageBreadcrumb />
      <BlogPostsApp />
    </div>
  );
} 