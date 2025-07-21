"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
} from "@mui/material";
import { motion } from "motion/react";
import FuseLoading from "@fuse/core/FuseLoading";
import { getBlogCategory, type BlogCategory } from "@/services/apiBlog";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import PageBreadcrumb from "@/components/PageBreadcrumb";

// Define the category structure for both children and parent
interface CategoryReference {
  id: number;
  name: string;
  slug: string;
}

// Extend BlogCategory interface to match actual API response
interface ExtendedBlogCategory extends Omit<BlogCategory, 'children' | 'parent'> {
  children?: CategoryReference[];
  parent?: CategoryReference | null;
}

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [category, setCategory] = useState<ExtendedBlogCategory | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    document.title = "Blog Category Details | VapeHub";
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await getBlogCategory(Number(id));
        console.log("Category response:", response);

        if (response) {
          // Ensure parent is properly typed if it exists
          const formattedCategory: ExtendedBlogCategory = {
            ...response,
            parent: response.parent ? {
              id: response.parent_id!,
              name: response.parent,
              slug: '' // We don't have this in the response
            } : null
          };
          setCategory(formattedCategory);
        }
      } catch (error) {
        console.error("Failed to fetch category:", error);
        showSnackbar("Failed to load category details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id, showSnackbar]);

  if (loading) {
    return <FuseLoading />;
  }

  if (!category) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="error">
          Category not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageBreadcrumb />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
              <FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Category Details
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/apps/blog/categories/${category.id}/edit`)}
            startIcon={<FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>}
          >
            Edit Category
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  {category.image_url ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: '300px',
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.default',
                        border: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <img
                        src={category.image_url}
                        alt={category.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: '16px'
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '300px',
                        backgroundColor: 'background.default',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 1,
                        borderColor: 'divider'
                      }}
                    >
                      <Typography color="text.secondary">
                        No image available
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h5" gutterBottom>
                  {category.name}
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Typography variant="body1">
                    {category.description || "No description available"}
                  </Typography>
                </Box>

                {category?.children && Array.isArray(category.children) && category.children.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      Subcategories
                    </Typography>
                    
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {category.children.map((child) => (
                        <Chip
                          key={child.id}
                          label={child.name}
                          color="primary"
                          variant="outlined"
                          onClick={() => router.push(`/apps/blog/categories/${child.id}`)}
                          sx={{ cursor: "pointer" }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Information
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={category.status}
                    color={category.status === "active" ? "success" : "default"}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Slug
                  </Typography>
                  <Typography variant="body2">{category.slug}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Parent Category
                  </Typography>
                  {category.parent_id ? (
                    <Typography 
                      variant="body2" 
                      sx={{ cursor: "pointer", color: "primary.main" }}
                      onClick={() => router.push(`/apps/blog/categories/${category.parent_id}`)}
                    >
                      {typeof category.parent === 'string' ? category.parent : 'N/A'}
                    </Typography>
                  ) : (
                    <Typography variant="body2">None</Typography>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(category.createdAt)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(category.updatedAt)}
                  </Typography>
                </Box>

                {category.deletedAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Deleted At
                    </Typography>
                    <Typography variant="body2" color="error">
                      {formatDate(category.deletedAt)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
} 