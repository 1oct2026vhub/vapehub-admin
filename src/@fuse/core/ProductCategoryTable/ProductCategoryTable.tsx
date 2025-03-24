"use client";

import { useMemo, useState, useEffect } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import {
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  InputAdornment,
  IconButton,
  MenuItem,
  ListItemIcon,
  Select,
  Pagination,
  PaginationItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listProductCategory,
  deleteCategory,
  restoreCategory,
} from "@/services/apiProductCategory";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "../FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";

export type CategoryType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  updatedAt: string;
  deletedAt: string | null;
};

const ProductCategoryTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { showSnackbar } = useSnackbar();
  const [localCategories, setLocalCategories] = useState<CategoryType[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      page,
      limit,
      ...(deleted !== null && { deleted }),
    }),
    [debouncedSearch, deleted, page, limit],
  );

  const { data, error, isLoading } = useFetch(
    ["productCategoryList", queryParams],
    listProductCategory,
    queryParams,
  );

  useEffect(() => {
    if (data?.data?.categories) {
      setLocalCategories(data.data.categories);
    }
  }, [data?.data?.categories]);

  const handleDeleteClick = (category: CategoryType) => {
    setSelectedCategory(category);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    setOpenDialog(false);

    try {
      const updatedCategories = localCategories.filter(
        cat => cat.id !== selectedCategory.id
      );
      setLocalCategories(updatedCategories);

      const newTotal = (data?.data?.total || 0) - 1;
      if (newTotal <= (page - 1) * limit && page > 1) {
        setPage(page - 1);
      }

      if (selectedCategory.deletedAt) {
        await restoreCategory(selectedCategory.id);
        showSnackbar("Category restored successfully!", "success");
      } else {
        await deleteCategory(selectedCategory.id);
        showSnackbar("Category deleted successfully!", "success");
      }

      await mutate(["productCategoryList", queryParams]);
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      const errorData = error || error; // Handle both API and unexpected errors
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            // setError(field, { type: 'manual', message });
            showSnackbar(` ${message}`, "error");
          }
        });
      } else {
        // setError('root', { type: 'manual', message: errorMessage });
      }
      return false;
    } 
  };

  const handleEdit = (category: CategoryType) => {
    router.push(
      `/apps/product-category/category-update/${category.id}?categoryData=${encodeURIComponent(
        JSON.stringify(category),
      )}`,
    );
  };

  const columns = useMemo<MRT_ColumnDef<CategoryType>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Category Name" },
      { accessorKey: "slug", header: "Slug" },
      // { accessorKey: "description", header: "Description" },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        accessorKey: "logo_url",
        header: "Logo",
        Cell: ({ row }) => (
          <img
            src={row.original.logo_url}
            alt={row.original.name}
            width={50}
            height={50}
          />
        ),
      },
    ],
    [],
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load categories</p>;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex items-center justify-between p-3">
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused fieldset": {
                borderColor: "#2E9970", // Border color on focus (click)
                borderWidth: "2px", // Optional: increase border thickness on focus
              },
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#2E9970", // Label color on focus
            },
          }}
        />

        <div className="flex gap-2">
        <Select
              value={deleted === null ? "active" : deleted ? "deleted" : "active"}
              onChange={(e) =>
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted",
                )
              }
              size="small"
            >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>
        </div>
      </div>

      <DataTable
        data={localCategories}
        columns={columns}
        enablePagination
        manualPagination
        state={{ pagination: { pageIndex: page - 1, pageSize: limit } }}
        onPaginationChange={(updater: any) => {
          const newPagination = updater({ pageIndex: page - 1, pageSize: limit });
          setPage(newPagination.pageIndex + 1);
          setLimit(newPagination.pageSize);
        }}
        rowCount={data?.data?.total || 0}
        renderRowActionMenuItems={({ closeMenu, row }) => {
          return [
            !row.original.deletedAt && (
            <MenuItem
              key="view-details"
              onClick={() => {
                router.push(
                  `/apps/product-category/category-detail/${row.original.id}`,
                );
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>
                  heroicons-outline:arrow-top-right-on-square
                </FuseSvgIcon>
              </ListItemIcon>
              View Details
            </MenuItem>),

            !row.original.deletedAt && (
              <MenuItem
                key="edit"
                onClick={() => {
                  handleEdit(row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                </ListItemIcon>
              Edit
            </MenuItem>
            ),

            <MenuItem
              key="delete"
              onClick={() => {
                handleDeleteClick(row.original);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>
                  {row.original.deletedAt
                    ? "heroicons-outline:arrow-path"
                    : "heroicons-outline:trash"}
                </FuseSvgIcon>
              </ListItemIcon>
              {row.original.deletedAt ? "Restore" : "Delete"}
            </MenuItem>,
          ].filter(Boolean);
        }}
      />

      <div className="flex justify-center p-4">
        <Pagination
          count={Math.ceil((data?.data?.total || 0) / limit)}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          shape="rounded"
          color="primary"
          renderItem={(item) => (
            <PaginationItem
              {...item}
              className="text-gray-600 hover:text-[#2E9970]"
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
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Confirm {selectedCategory?.deletedAt ? "Restore" : "Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedCategory?.deletedAt ? "restore" : "delete"}{" "}
            <strong>{selectedCategory?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton
            label={selectedCategory?.deletedAt ? "Restore" : "Delete"}
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProductCategoryTable;
