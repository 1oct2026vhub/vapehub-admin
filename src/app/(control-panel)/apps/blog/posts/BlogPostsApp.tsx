"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  MenuItem,
  ListItemIcon,
  TextField,
  InputAdornment,
  InputLabel,
  Select,
  FormControl,
  Pagination,
  PaginationItem,
  Chip,
} from "@mui/material";
import { motion } from "motion/react";
import { MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import SearchIcon from "@mui/icons-material/Search";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  getBlogPosts,
  deleteBlogPost,
  publishBlogPost,
  unpublishBlogPost,
} from "@/services/apiBlog";
import { formatDate } from "@/utils/actions";
import { useRouter } from "next/navigation";
import Link from "@mui/material/Link";

// Update sorting type to match API requirements
type SortField = "title" | "created_at" | "published_at";
type SortOrder = "ASC" | "DESC";

// Add interface for API response
interface BlogPostResponse {
  data: {
    blogs: BlogPost[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export default function BlogPostsApp() {
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep pagination, search, and filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
  });
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");
  const [showDeleted, setShowDeleted] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch posts when filters change
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getBlogPosts({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          sort: sortField,
          order: sortOrder,
          deleted: showDeleted,
        }) as BlogPostResponse;

        if (response?.data) {
          setPosts(response.data.blogs);
          setPagination(prev => ({
            ...prev,
            total: response.data?.pagination?.total || 0
          }));
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        // Commented as per your change
        // showSnackbar("Failed to load posts", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [debouncedSearch, pagination.page, pagination.limit, sortField, sortOrder, showDeleted]);

  const handleDeletePost = async (post: BlogPost) => {
    try {
      await deleteBlogPost(post.id);
      showSnackbar("Post deleted successfully", "success");
      // Refresh the posts list
      setPagination(prev => ({ ...prev, page: 1 }));
    } catch (error) {
      console.error("Failed to delete post:", error);
      showSnackbar("Failed to delete post", "error");
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      if (post.published_at) {
        await unpublishBlogPost(post.id);
        showSnackbar("Post unpublished successfully", "success");
      } else {
        await publishBlogPost(post.id);
        showSnackbar("Post published successfully", "success");
      }
      // Refresh the posts list
      setPagination(prev => ({ ...prev }));
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      showSnackbar("Failed to update publish status", "error");
    }
  };

  const columns = useMemo<MRT_ColumnDef<BlogPost>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        size: 200,
        Cell: ({ row }) => (
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push(`/apps/blog/posts/${row.original.id}`);
            }}
            sx={{
              textAlign: "left",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        size: 150,
      },
      {
        accessorKey: "published_at",
        header: "Published Date",
        size: 150,
        Cell: ({ row }) => {
          return row.original.published_at
            ? formatDate(row.original.published_at)
            : "Not published";
        },
      },
      {
        accessorKey: "categories",
        header: "Categories",
        size: 200,
        Cell: ({ row }) => {
          const postCategories = row.original.categories || [];
          return (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {postCategories.map((category) => (
                <Chip
                  key={`category-${category.id}`}
                  label={category.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        size: 200,
        Cell: ({ row }) => {
          const postTags = row.original.tags || [];
          return (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {postTags.map((tag) => (
                <Chip
                  key={`tag-${tag.id}`}
                  label={tag.name}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        Cell: ({ row }) => (
          <div
            className={
              row.original.is_active ? "text-green-600" : "text-red-600"
            }
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        size: 150,
        Cell: ({ row }) => {
          return row.original.created_at
            ? formatDate(row.original.created_at)
            : "N/A";
        },
      },
    ],
    [router]
  );

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
              <Typography variant="h4" fontWeight="bold">
                Blog Posts
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <AppButton 
                  label="Add Post" 
                  onClick={() => router.push("/apps/blog/posts/new")} 
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper className="overflow-hidden">
              <div className="flex items-center gap-5 p-3">
                <TextField
                  label="Search"
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-focused fieldset": {
                        borderColor: "#2E9970",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#2E9970",
                    },
                  }}
                />

                <FormControl size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    label="Sort By"
                  >
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="created_at">Created At</MenuItem>
                    <MenuItem value="published_at">Published At</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small">
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    label="Order"
                  >
                    <MenuItem value="ASC">Ascending</MenuItem>
                    <MenuItem value="DESC">Descending</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={showDeleted ? "deleted" : "active"}
                    onChange={(e) =>
                      setShowDeleted(e.target.value === "deleted")
                    }
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                  </Select>
                </FormControl>
              </div>

              {loading ? (
                <Box sx={{ p: 4 }}>
                  <FuseLoading />
                </Box>
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    data={posts}
                    enableRowActions
                    renderRowActionMenuItems={({ closeMenu, row }) => [
                      <MenuItem
                        key="view"
                        onClick={() => {
                          router.push(`/apps/blog/posts/${row.original.id}`);
                          closeMenu();
                        }}
                      >
                        <ListItemIcon>
                          <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                        </ListItemIcon>
                        View Details
                      </MenuItem>,
                      <MenuItem
                        key="edit"
                        onClick={() => {
                          router.push(`/apps/blog/posts/${row.original.id}/edit`);
                          closeMenu();
                        }}
                      >
                        <ListItemIcon>
                          <FuseSvgIcon>heroicons-outline:pencil</FuseSvgIcon>
                        </ListItemIcon>
                        Edit
                      </MenuItem>,
                      <MenuItem
                        key="delete"
                        onClick={() => {
                          handleDeletePost(row.original);
                          closeMenu();
                        }}
                      >
                        <ListItemIcon>
                          <FuseSvgIcon className="text-red-500">
                            heroicons-outline:trash
                          </FuseSvgIcon>
                        </ListItemIcon>
                        <Typography color="error">Delete</Typography>
                      </MenuItem>,
                    ]}
                  />
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <Pagination
                      count={Math.ceil(pagination.total / pagination.limit)}
                      page={pagination.page}
                      onChange={(event, value) =>
                        setPagination((prev) => ({ ...prev, page: value }))
                      }
                      shape="rounded"
                      color="primary"
                      renderItem={(item) => (
                        <PaginationItem
                          {...item}
                          sx={{
                            "&.Mui-selected": {
                              backgroundColor: "#2E9970",
                              color: "#fff",
                              "&:hover": {
                                backgroundColor: "#247C5C",
                              },
                            },
                          }}
                        />
                      )}
                    />
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}
