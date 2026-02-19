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
  Autocomplete,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { motion } from "motion/react";
import {
  MRT_ColumnDef,
  MRT_SortingState,
  MRT_Updater,
} from "material-react-table";
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
  getBlogCategories,
  getBlogTags,
  restoreBlogPost,
  bulkDeleteBlogPosts,
  bulkRestoreBlogPosts,
} from "@/services/apiBlog";
import { formatDate } from "@/utils/actions";
import { useRouter } from "next/navigation";
import Link from "@mui/material/Link";
import useColumnOrder from "@/hooks/useColumnOrder";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import { usePageState } from "@/hooks/usePageState";
import { z } from "zod";

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

// Extend BlogPostParams to include the additional filters
interface ExtendedBlogPostParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: SortField;
  order?: SortOrder;
  deleted?: boolean;
  is_active?: boolean;
  category_id?: string;
  tag_id?: string;
  status?: string;
}

export default function BlogPostsApp() {
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Persist table filters in session storage
  const [pageState, setPageState, clearPageState] = usePageState("blogPostsTable", {
    search: "",
    sortField: "created_at" as SortField,
    sortOrder: "DESC" as SortOrder,
    showDeleted: false,
    status: "",
    selectedCategoryId: null as number | null,
    selectedTagId: null as number | null,
    page: 1,
  });

  const {
    search,
    sortField,
    sortOrder,
    showDeleted,
    status,
    selectedCategoryId,
    selectedTagId,
    page,
  } = pageState;

  const setSearch = (value: string) =>
    setPageState((prev) => ({ ...prev, search: value }));
  const setSortField = (value: SortField) =>
    setPageState((prev) => ({ ...prev, sortField: value }));
  const setSortOrder = (value: SortOrder) =>
    setPageState((prev) => ({ ...prev, sortOrder: value }));
  const setShowDeleted = (value: boolean) =>
    setPageState((prev) => ({ ...prev, showDeleted: value }));
  const setStatus = (value: string) =>
    setPageState((prev) => ({ ...prev, status: value }));
  const setSelectedCategoryId = (value: number | null) =>
    setPageState((prev) => ({ ...prev, selectedCategoryId: value }));
  const setSelectedTagId = (value: number | null) =>
    setPageState((prev) => ({ ...prev, selectedTagId: value }));
  const setPage = (value: number) =>
    setPageState((prev) => ({ ...prev, page: value }));

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
  });
  
  // New filter states
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(
    selectedCategoryId ? ({ id: selectedCategoryId, name: "" } as BlogCategory) : null,
  );
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<BlogTag | null>(
    selectedTagId ? ({ id: selectedTagId, name: "" } as BlogTag) : null,
  );
  const [tagLoading, setTagLoading] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);

  // Single post delete confirmation with optional redirect URL (same as ProductListTable)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [deleteRedirectUrl, setDeleteRedirectUrl] = useState("");
  const [deleteRedirectUrlError, setDeleteRedirectUrlError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const redirectUrlSchema = z.string().url("Invalid URL format").optional().or(z.literal(""));

  // State for tracking active search vs selection mode
  const [isActivelySearchingCategory, setIsActivelySearchingCategory] = useState(false);
  const [isActivelySearchingTag, setIsActivelySearchingTag] = useState(false);

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortField, desc: sortOrder === "DESC" }],
    [sortField, sortOrder],
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortField(id as SortField);
      setSortOrder(desc ? "DESC" : "ASC");
    } else {
      setSortField("created_at");
      setSortOrder("DESC");
    }
  };

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    // Define default states for this table
    const defaultSortField: SortField = "created_at";
    const defaultSortOrder: SortOrder = "DESC";
    const defaultShowDeleted = false;
    const defaultStatus = "";

    return (
      search !== "" ||
      selectedCategory !== null ||
      selectedTag !== null ||
      status !== defaultStatus ||
      sortField !== defaultSortField ||
      sortOrder !== defaultSortOrder ||
      showDeleted !== defaultShowDeleted
    );
  }, [search, selectedCategory, selectedTag, status, sortField, sortOrder, showDeleted]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory(null);
    setSelectedCategoryId(null);
    setSelectedTag(null);
    setSelectedTagId(null);
    setStatus("");
    setSortField("created_at");
    setSortOrder("DESC");
    setShowDeleted(false);
    setPage(1); // Reset page
    setCategorySearch(""); // Clear Autocomplete search
    setTagSearch(""); // Clear Autocomplete search
    setRowSelection({}); // Clear row selection when filters are cleared
    clearPageState(); // Clear session storage
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Clear row selection when switching between active/deleted views
  useEffect(() => {
    setRowSelection({});
  }, [showDeleted]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);
  
  // Load categories with search
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const response = await getBlogCategories({
          // Only include search when actively searching, not after selection
          ...(isActivelySearchingCategory && categorySearch ? { search: categorySearch } : {}),
          limit: 50,
        });
        if (response?.data?.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoryLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchCategories();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [categorySearch, isActivelySearchingCategory]);
  
  // Load tags with search
  useEffect(() => {
    const fetchTags = async () => {
      setTagLoading(true);
      try {
        const response = await getBlogTags({
          // Only include search when actively searching, not after selection
          ...(isActivelySearchingTag && tagSearch ? { search: tagSearch } : {}),
          limit: 50,
        });
        if (response?.data?.tags) {
          setTags(response.data.tags);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      } finally {
        setTagLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchTags();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [tagSearch, isActivelySearchingTag]);
  
  // Load initial categories and tags
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          getBlogCategories({ limit: 100 }), // Load more items initially without search param
          getBlogTags({ limit: 100 }), // Load more items initially without search param
        ]);
        
        if (categoriesResponse?.data?.categories) {
          setCategories(categoriesResponse.data.categories);
        }
        
        if (tagsResponse?.data?.tags) {
          setTags(tagsResponse.data.tags);
        }
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      }
    };
    
    fetchFilters();
  }, []);

  // Restore selected category/tag objects once options are loaded
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const found = categories.find((c) => c.id === selectedCategoryId) || null;
      setSelectedCategory(found);
    }
    if (!selectedCategoryId) {
      setSelectedCategory(null);
    }
  }, [selectedCategoryId, categories]);

  useEffect(() => {
    if (selectedTagId && tags.length > 0) {
      const found = tags.find((t) => t.id === selectedTagId) || null;
      setSelectedTag(found);
    }
    if (!selectedTagId) {
      setSelectedTag(null);
    }
  }, [selectedTagId, tags]);

  // Fetch posts when filters change
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getBlogPosts({
          page,
          limit: pagination.limit,
          search: debouncedSearch,
          sort: sortField,
          order: sortOrder,
          deleted: showDeleted,
          category_id: selectedCategory?.id?.toString() || undefined,
          tag_id: selectedTag?.id?.toString() || undefined,
          status: status || undefined,
        } as ExtendedBlogPostParams) as BlogPostResponse;

        if (response?.data) {
          setPosts(response.data.blogs);
          setPagination(prev => ({
            ...prev,
            total: response.data?.pagination?.total || 0
          }));
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [debouncedSearch, page, pagination.limit, sortField, sortOrder, showDeleted, selectedCategory, selectedTag, status]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortField, sortOrder, showDeleted, selectedCategory, selectedTag, status]);

  const handleDeletePost = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteRedirectUrl("");
    setDeleteRedirectUrlError("");
  };

  const handleConfirmDeletePost = async () => {
    if (!postToDelete) return;

    const redirectUrl = deleteRedirectUrl.trim();
    if (redirectUrl) {
      const parsed = redirectUrlSchema.safeParse(redirectUrl);
      if (!parsed.success) {
        setDeleteRedirectUrlError(parsed.error.errors[0]?.message ?? "Invalid URL format");
        return;
      }
    }

    try {
      setDeleteLoading(true);
      const normalizedRedirectUrl = redirectUrl || undefined;
      await deleteBlogPost(postToDelete.id, normalizedRedirectUrl);

      setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postToDelete.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      showSnackbar("Post deleted successfully" + (normalizedRedirectUrl ? " (redirect created)" : ""), "success");
    } catch (error) {
      console.error("Failed to delete post:", error);
      showSnackbar("Failed to delete post", "error");
    } finally {
      setDeleteLoading(false);
      setPostToDelete(null);
      setDeleteRedirectUrl("");
      setDeleteRedirectUrlError("");
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

  const handleRestorePost = async (post: BlogPost) => {
    try {
      await restoreBlogPost(post.id);
      
      // If we're viewing deleted posts, remove the restored post from view
      if (showDeleted) {
        setPosts(currentPosts => currentPosts.filter(p => p.id !== post.id));
        
        // Update total count in pagination
        setPagination(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
      } 
      // If not viewing deleted posts, we could add it to the current view,
      // but that might disrupt sorting/filtering, so we'll just show a message
      
      showSnackbar("Post restored successfully", "success");
    } catch (error) {
      console.error("Failed to restore post:", error);
      showSnackbar(error.message, "error");
    }
  };

  // Bulk delete handlers
  const handleOpenBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const handleCloseBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(false);
  };

  const handleConfirmBulkDelete = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedPostsToDelete = posts.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted posts for bulk delete
    const activePostsToDelete = selectedPostsToDelete.filter(
      (post) => !post.deleted_at
    );

    if (activePostsToDelete.length === 0) {
      showSnackbar(
        "No active posts selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activePostsToDelete.map((post) => post.id);

    try {
      setLoading(true);
      // Use bulk delete API
      await bulkDeleteBlogPosts(idsToDelete);

      showSnackbar(
        `${idsToDelete.length} post(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server by triggering a refetch
      const response = await getBlogPosts({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        sort: sortField,
        order: sortOrder,
        deleted: showDeleted,
        category_id: selectedCategory?.id?.toString() || undefined,
        tag_id: selectedTag?.id?.toString() || undefined,
        status: status || undefined,
      } as ExtendedBlogPostParams) as BlogPostResponse;

      if (response?.data) {
        setPosts(response.data.blogs);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0
        }));
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      handleCloseBulkDeleteDialog();
    }
  };

  // Bulk restore handlers
  const handleOpenBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(true);
  };

  const handleCloseBulkRestoreDialog = () => {
    setIsBulkRestoreDialogOpen(false);
  };

  const handleConfirmBulkRestore = async () => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (key) => rowSelection[key]
    );
    const selectedPostsToRestore = posts.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter only deleted posts for bulk restore
    const deletedPostsToRestore = selectedPostsToRestore.filter(
      (post) => post.deleted_at
    );

    if (deletedPostsToRestore.length === 0) {
      showSnackbar(
        "No deleted posts selected for restoration.",
        "warning"
      );
      handleCloseBulkRestoreDialog();
      return;
    }

    const idsToRestore = deletedPostsToRestore.map((post) => post.id);

    try {
      setLoading(true);
      // Use bulk restore API
      await bulkRestoreBlogPosts(idsToRestore);

      showSnackbar(
        `${idsToRestore.length} post(s) restored successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server by triggering a refetch
      const response = await getBlogPosts({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        sort: sortField,
        order: sortOrder,
        deleted: showDeleted,
        category_id: selectedCategory?.id?.toString() || undefined,
        tag_id: selectedTag?.id?.toString() || undefined,
        status: status || undefined,
      } as ExtendedBlogPostParams) as BlogPostResponse;

      if (response?.data) {
        setPosts(response.data.blogs);
        setPagination(prev => ({
          ...prev,
          total: response.data?.pagination?.total || 0
        }));
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 
        error?.message || 
        error?.response?.data?.errors?.[0]?.msg || 
        "Bulk restore failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      handleCloseBulkRestoreDialog();
    }
  };

  // Rename columns to defaultColumns for clarity
  const defaultColumns = useMemo<MRT_ColumnDef<BlogPost>[]>(() => [
    {
      accessorKey: "title",
      header: "Title",
      size: 200,
      Cell: ({ row }) => row.original.title || "N/A",
    },
    {
      accessorKey: "slug",
      header: "Slug",
      size: 150,
      Cell: ({ row }) => row.original.slug || "N/A",
    },
    {
      accessorKey: "published_at",
      header: "Published Date",
      size: 150,
      Cell: ({ row }) => {
        return row.original.status === "published" && row.original.published_at
          ? formatDate(row.original.published_at)
          : "Not published";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      Cell: ({ row }) => {
        const status = row.original.status;
        const capitalizedStatus =
          status?.charAt(0).toUpperCase() + status?.slice(1) || "N/A";

        return (
          <div className={status ? "text-green-600" : ""}>
            {capitalizedStatus}
          </div>
        );
      },
    },
    {
      accessorKey: "categories",
      header: "Categories",
      size: 200,
      Cell: ({ row }) => {
        const postCategories = row.original.categories || [];
          if (postCategories.length === 0) {
          return "N/A";
        }
        return (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {postCategories.map((category) => (
              <Chip
                key={`category-${category.id}`}
                label={category.name || "N/A"}
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
        
        if (postTags.length === 0) {
          return "N/A";
        }
        
        return (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {postTags.map((tag) => (
              <Chip
                key={`tag-${tag.id}`}
                label={tag.name || "N/A"}
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
      accessorKey: "created_at",
      header: "Created At",
      size: 150,
      Cell: ({ row }) => {
        return row.original.created_at
          ? formatDate(row.original.created_at)
          : "N/A";
      },
    },
  ], [router]);

  // Use the column order hook
  const { columns, columnOrder, onColumnOrderChange } = useColumnOrder('blog-posts', defaultColumns);

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
              <div className="flex items-center gap-3 p-3">
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
                    minWidth: '140px',
                  }}
                />

                <Autocomplete
                  options={categories}
                  getOptionLabel={(option) => option.name}
                  value={selectedCategory}
                  onChange={(_, newValue) => {
                    setSelectedCategory(newValue);
                    setSelectedCategoryId(newValue?.id ?? null);
                    setIsActivelySearchingCategory(false);
                  }}
                  onInputChange={(_, newInputValue, reason) => {
                    setCategorySearch(newInputValue);
                    // Only set active searching when user is typing, not when selection changes
                    setIsActivelySearchingCategory(reason === 'input');
                  }}
                  loading={categoryLoading}
                  filterOptions={(x) => x} // Don't filter options client-side
                  openOnFocus
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Category" 
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: '150px'}}
                    />
                  )}
                />

                <Autocomplete
                  options={tags}
                  getOptionLabel={(option) => option.name}
                  value={selectedTag}
                  onChange={(_, newValue) => {
                    setSelectedTag(newValue);
                    setSelectedTagId(newValue?.id ?? null);
                    setIsActivelySearchingTag(false);
                  }}
                  onInputChange={(_, newInputValue, reason) => {
                    setTagSearch(newInputValue);
                    // Only set active searching when user is typing, not when selection changes
                    setIsActivelySearchingTag(reason === 'input');
                  }}
                  loading={tagLoading}
                  filterOptions={(x) => x} // Don't filter options client-side
                  openOnFocus
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Tag" 
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: '150px'}}
                    />
                  )}
                />

                <FormControl size="small" sx={{ minWidth: '110px' }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '110px' }}>
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

                <FormControl size="small" sx={{ minWidth: '110px' }}>
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

                <FormControl size="small" sx={{ minWidth: '90px'}}>
                  <InputLabel>Show</InputLabel>
                  <Select
                    value={showDeleted ? "deleted" : "active"}
                    onChange={(e) =>
                      setShowDeleted(e.target.value === "deleted")
                    }
                    label="Show"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                  </Select>
                </FormControl>

                {/* Bulk Delete Button */}
                {Object.keys(rowSelection).length > 0 && !showDeleted && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>}
                    onClick={handleOpenBulkDeleteDialog}
                    sx={{
                      backgroundColor: "#d32f2f",
                      "&:hover": {
                        backgroundColor: "#b71c1c",
                      },
                      height: '40px'
                    }}
                  >
                    Bulk Delete ({Object.keys(rowSelection).length})
                  </Button>
                )}

                {/* Bulk Restore Button */}
                {Object.keys(rowSelection).length > 0 && showDeleted && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>}
                    onClick={handleOpenBulkRestoreDialog}
                    sx={{
                      backgroundColor: "#2e7d32",
                      "&:hover": {
                        backgroundColor: "#1b5e20",
                      },
                      height: '40px'
                    }}
                  >
                    Bulk Restore ({Object.keys(rowSelection).length})
                  </Button>
                )}
                
                {areFiltersActive && (
                  <ClearFiltersButton 
                    onClick={clearFilters}
                    sx={{ height: '40px' }}
                  />
                )}
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
                    manualSorting
                    onSortingChange={handleSortingChange}
                    onColumnOrderChange={onColumnOrderChange}
                    enableRowSelection={true}
                    onRowSelectionChange={setRowSelection}
                    state={{ columnOrder, sorting, rowSelection }}
                    renderRowActionMenuItems={({ closeMenu, row }) => [
                      ...(row.original.deleted_at ? [
                        <MenuItem
                          key="restore"
                          onClick={() => {
                            handleRestorePost(row.original);
                            closeMenu();
                          }}
                        >
                          <ListItemIcon>
                            <FuseSvgIcon>
                              heroicons-outline:arrow-path                            
                            </FuseSvgIcon>
                          </ListItemIcon>
                          Restore
                        </MenuItem>
                      ] : [
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
                        </MenuItem>
                      ])
                    ]}
                  />
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <Pagination
                      count={Math.ceil(pagination.total / pagination.limit)}
                      page={page}
                      onChange={(event, value) =>
                        setPage(value)
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

        {/* Delete single post confirmation (with optional redirect URL) */}
        <Dialog
          open={!!postToDelete}
          onClose={() => {
            setPostToDelete(null);
            setDeleteRedirectUrl("");
            setDeleteRedirectUrlError("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to delete <strong>{postToDelete?.title}</strong>? This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Redirect URL (optional)"
              placeholder="https://example.com"
              value={deleteRedirectUrl}
              onChange={(e) => {
                const value = e.target.value;
                setDeleteRedirectUrl(value);
                const trimmed = value.trim();
                if (!trimmed) {
                  setDeleteRedirectUrlError("");
                } else {
                  const parsed = redirectUrlSchema.safeParse(trimmed);
                  setDeleteRedirectUrlError(parsed.success ? "" : (parsed.error.errors[0]?.message ?? "Invalid URL format"));
                }
              }}
              size="small"
              error={!!deleteRedirectUrlError}
              helperText={deleteRedirectUrlError || "Leave empty to skip. Enter a valid URL (e.g. https://example.com)."}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setPostToDelete(null);
                setDeleteRedirectUrl("");
                setDeleteRedirectUrlError("");
              }}
            >
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleConfirmDeletePost}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog
          open={isBulkDeleteDialogOpen}
          onClose={handleCloseBulkDeleteDialog}
        >
          <DialogTitle>Bulk Delete Posts</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              post(s)? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkDelete}
              color="error"
              variant="contained"
              disabled={loading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Restore Dialog */}
        <Dialog
          open={isBulkRestoreDialogOpen}
          onClose={handleCloseBulkRestoreDialog}
        >
          <DialogTitle>Bulk Restore Posts</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to restore{" "}
              <strong>{Object.keys(rowSelection).length}</strong> selected
              post(s)?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkRestoreDialog}>Cancel</Button>
            <Button
              onClick={handleConfirmBulkRestore}
              color="success"
              variant="contained"
              disabled={loading}
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
}
