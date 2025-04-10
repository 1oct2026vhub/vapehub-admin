"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  Button,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { motion } from "motion/react";
import FuseLoading from "@fuse/core/FuseLoading";
import { getBlogPost, type BlogPost } from "@/services/apiBlog";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

export default function BlogPostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postId = Number(id);
        
        if (isNaN(postId)) {
          showSnackbar("Invalid blog post ID", "error");
          return;
        }
        
        const response = await getBlogPost(postId);
        console.log("response", response);

        if (response.success) {
          setPost(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch blog post:", error);
        // showSnackbar("Failed to load blog post details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id, showSnackbar]);

  if (loading) {
    return <FuseLoading />;
  }

  if (!post) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="error">
          Blog post not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
            <FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Blog Post Details
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              router.push(`/apps/blog/posts/${post.id}/edit`)
            }
            startIcon={<FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>}
          >
            Edit Post
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 200,
                        backgroundColor: "#f5f5f5",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography color="text.secondary">
                        No image available
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h5" gutterBottom>
                  {post.title}
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Typography
                    variant="body1"
                    component="div"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" className="mb-2">Categories</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  {post.categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
                <Typography variant="subtitle2" color="text.secondary" className="mb-2">Tags</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {post.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Post Information
                </Typography>

                <Box sx={{ mb: 2 }}>
  <Typography variant="subtitle2" color="text.secondary">
    Status
  </Typography>
  <Chip
    label={
      post.status
        ? post.status.charAt(0).toUpperCase() + post.status.slice(1)
        : "N/A"
    }
     color="success"
    variant="outlined"
    size="small"
    sx={{ fontWeight: 'bold' }}
  />
</Box>


                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Slug
                  </Typography>
                  <Typography variant="body2">{post.slug}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Published Date & Time
                  </Typography>
                  <Typography variant="body2">
                    {post.published_at
                      ? formatDate(post.published_at, 'MMMM D, YYYY h:mm A')
                      : "Not published"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(post.created_at)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(post.updated_at)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Author Information
                </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {post.author?.first_name
                          ? post.author.first_name[0]
                          : post.author?.last_name
                          ? post.author.last_name[0]
                          : post.author?.email
                          ? post.author.email[0]
                          : "N/A"}
                      </Avatar>

                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {post.author?.first_name || post.author?.last_name
                            ? `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim()
                            : post.author?.email || "N/A"}
                        </Typography>
                      </Box>
                    </Box>

              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}
