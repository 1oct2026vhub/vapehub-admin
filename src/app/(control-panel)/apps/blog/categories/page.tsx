import BlogCategoriesApp from './BlogCategoriesApp';
import type { Metadata } from 'next';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Container } from '@mui/material';

export const metadata: Metadata = {
  title: 'Blog Categories',
};

export default function BlogCategoriesPage() {
  return (
    <div>
      <Container maxWidth={false} sx={{ mt: 3 }}>
        <PageBreadcrumb />
      </Container>
      <BlogCategoriesApp />
    </div>
  );
}