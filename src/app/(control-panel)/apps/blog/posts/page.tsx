import BlogPostsApp from './BlogPostsApp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Posts',
};

export default function BlogPostsPage() {
  return <BlogPostsApp />;
} 