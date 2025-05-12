import BlogCategoriesApp from './BlogCategoriesApp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Categories',
};

export default function BlogCategoriesPage() {
  return <BlogCategoriesApp />;
}