import BlogPostsApp from './BlogPostsApp';
import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Container } from '@mui/material';

export const metadata: Metadata = {
  title: 'Blog Posts',
};

export default function BlogPostsPage() {
  return (
    <div>
      <Container maxWidth={false} sx={{ mt: 3 }}>
      <PageBreadcrumb />
      </Container>
      <BlogPostsApp />
    </div>
  );
} 