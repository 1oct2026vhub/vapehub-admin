import BlogTagsApp from './BlogTagsApp';
import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Container } from '@mui/material';

export const metadata: Metadata = {
  title: 'Blog Tags | VapeHub',
};

export default function BlogTagsPage() {
  return (
    <div>
      <Container maxWidth={false} sx={{ mt: 3 }}>
      <PageBreadcrumb />
      </Container>
      <BlogTagsApp />
    </div>
  );
}