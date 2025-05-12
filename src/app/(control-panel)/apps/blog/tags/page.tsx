import BlogTagsApp from './BlogTagsApp';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Tags | VapeHub',
};

export default function BlogTagsPage() {
  return <BlogTagsApp />;
}