"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  Pagination,
  PaginationItem,
} from "@mui/material";
import { motion } from "motion/react";
import { MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import SearchIcon from "@mui/icons-material/Search";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import { useRouter } from "next/navigation";
import {
  BlogCategory,
  BlogCategoryResponse,
  getBlogCategories,
  deleteBlogCategory,
  restoreBlogCategory,
} from "@/services/apiBlog";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";

// Add pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
}

export default function BlogCategoriesApp() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
  });

  // Add deleted filter state
  const [showDeleted, setShowDeleted] = useState(false);

  // Add delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        deleted: showDeleted,
      };

      const response: BlogCategoryResponse = await getBlogCategories(params);
      if (response?.data) {
        setCategories(response.data.categories);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      showSnackbar("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect for pagination and filtering
  useEffect(() => {
    fetchCategories();
  }, [pagination.page, pagination.limit, showDeleted]);

  // Add useEffect for search debouncing
  useEffect(() => {
    if (pagination.page === 1) {
      fetchCategories();
    } else {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch]);

  // Update handlers to use navigation
  const handleAddCategory = () => {
    router.push("/apps/blog/categories/new");
  };

  const handleEditCategory = (category: BlogCategory) => {
    router.push(`/apps/blog/categories/${category.id}/edit`);
  };

  // Handle category deletion
  const handleDeleteCategory = async (category: BlogCategory) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      await deleteBlogCategory(categoryToDelete.id);
      showSnackbar("Category deleted successfully", "success");
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      showSnackbar(error?.message || "Failed to delete category", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Handle category restoration
  const handleRestoreCategory = async (category: BlogCategory) => {
    try {
      await restoreBlogCategory(category.id);
      showSnackbar("Category restored successfully", "success");
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to restore category:", error);
      showSnackbar(error?.message || "Failed to restore category", "error");
    }
  };

  // Table columns
  const columns = useMemo<MRT_ColumnDef<BlogCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 200,
      },
      {
        accessorKey: "slug",
        header: "Slug",
        size: 150,
      },
      // {
      //   accessorKey: "description",
      //   header: "Description",
      //   size: 300,
      // },
      {
        accessorKey: "parent",
        header: "Parent Category",
        size: 150,
        Cell: ({ row }) => {
          const parent = row.original.parent;
          // Check if parent is an object or string and handle accordingly
          if (parent === null || parent === undefined) {
            return "N/A";
          }
          if (typeof parent === 'object' && parent !== null) {
            // Use type assertion to tell TypeScript this is a valid object with a name property
            return (parent as {name: string}).name || "N/A";
          }
          return String(parent) || "N/A";
        },
      },
      {
  accessorKey: "status",
  header: "Status",
  size: 100,
  Cell: ({ row }) => {
    const status = row.original.status;
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <div className={status === "active" ? "text-green-600" : "text-red-600"}>
        {capitalizedStatus}
      </div>
    );
  },
},

      {
        accessorKey: "createdAt",
        header: "Created At",
        size: 150,
        Cell: ({ row }) => formatDate(row.original.createdAt || "N/A"),
      },
    ],
    []
  );

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading && categories.length === 0) {
    return <FuseLoading />;
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
              <Typography variant="h4" fontWeight="bold">
                Blog Categories
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <AppButton label="Add Category" onClick={handleAddCategory} />
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

              <DataTable
                columns={columns}
                data={categories}
                enableRowActions
                renderRowActionMenuItems={({ closeMenu, row }) => {
                  const isDeleted = !!row.original.deletedAt;

                  if (isDeleted) {
                    return [
                      <MenuItem
                        key="restore"
                        onClick={() => {
                          handleRestoreCategory(row.original);
                          closeMenu();
                        }}
                      >
                        <ListItemIcon>
                          <FuseSvgIcon>
                            heroicons-outline:arrow-path
                          </FuseSvgIcon>
                        </ListItemIcon>
                        Restore
                      </MenuItem>,
                    ];
                  }

                  return [
                    <MenuItem
                      key="view"
                      onClick={() => {
                        router.push(`/apps/blog/categories/${row.original.id}`);
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
                        handleEditCategory(row.original);
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
                        handleDeleteCategory(row.original);
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
                  ];
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Pagination
                  count={totalPages}
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
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        itemName={categoryToDelete?.name || ""}
        loading={deleteLoading}
      />
    </Container>
  );
}
