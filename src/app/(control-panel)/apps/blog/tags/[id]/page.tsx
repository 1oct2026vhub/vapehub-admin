"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { motion } from "motion/react";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { BlogTag, getBlogTagById } from "@/services/apiBlog";
import { formatDate } from "@/utils/actions";

export default function BlogTagDetail() {
  const params = useParams();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [tag, setTag] = useState<BlogTag | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blog Tag Details | VapeHub";
  }, []);

  // Fetch tag details
  const fetchTagDetails = async () => {
    try {
      setLoading(true);
      const response = await getBlogTagById(Number(params.id));
      if (response?.data) {
        setTag(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch tag details:", error);
      showSnackbar("Failed to load tag details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagDetails();
  }, [params.id]);

  if (loading) {
    return <FuseLoading />;
  }

  if (!tag) {
    return (
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Typography variant="h6" color="error">
          Tag not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <div>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                  <Link
                    color="inherit"
                    href="/apps/blog/tags"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/apps/blog/tags");
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    Tags
                  </Link>
                  <Typography color="text.primary">Tag Details</Typography>
                </Breadcrumbs>
                <Typography variant="h4" fontWeight="bold">
                  Tag Details
                </Typography>
              </div>
              <AppButton
                label="Edit Tag"
                onClick={() => router.push(`/apps/blog/tags/${tag.id}/edit`)}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper className="overflow-hidden">
              <List>
                <ListItem>
                  <ListItemText
                    primary="Name"
                    secondary={tag.name}
                    primaryTypographyProps={{
                      variant: "subtitle2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{
                      variant: "body1",
                      color: "text.primary",
                    }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Slug"
                    secondary={tag.slug}
                    primaryTypographyProps={{
                      variant: "subtitle2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{
                      variant: "body1",
                      color: "text.primary",
                    }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Created At"
                    secondary={formatDate(tag.created_at || "")}
                    primaryTypographyProps={{
                      variant: "subtitle2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{
                      variant: "body1",
                      color: "text.primary",
                    }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Updated At"
                    secondary={formatDate(tag.updated_at || "")}
                    primaryTypographyProps={{
                      variant: "subtitle2",
                      color: "text.secondary",
                    }}
                    secondaryTypographyProps={{
                      variant: "body1",
                      color: "text.primary",
                    }}
                  />
                </ListItem>
                {tag.updated_by && (
                  <>
                    <Divider component="li" />
                    <ListItem>
                      <ListItemText
                        primary="Updated By"
                        secondary={tag.updated_by}
                        primaryTypographyProps={{
                          variant: "subtitle2",
                          color: "text.secondary",
                        }}
                        secondaryTypographyProps={{
                          variant: "body1",
                          color: "text.primary",
                        }}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
} 