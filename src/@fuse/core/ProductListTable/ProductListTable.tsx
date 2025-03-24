// import DataTable from './DataTable';
import { useMemo, useState, useEffect } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import {
  ListItemIcon,
  MenuItem,
  Paper,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  InputAdornment,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Pagination,
  PaginationItem,
  Chip,
} from "@mui/material";
import { listProducts } from "@/services/apiProduct";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { deleteProduct, restoreProduct } from "@/services/apiProduct";

export type ProductType = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  stock_quantity: number;
  category_id: number;
  brand_id: number;
  category_name: string;
  brand_name: string;
  is_new: boolean;
  deletedAt: string | null;
  createdAt: string;
};

const ProductListTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [sortBy, setSortBy] = useState<string>("id");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [isNew, setIsNew] = useState<boolean | null>(null);
  const [priceRange, setPriceRange] = useState<string>("");
  const [categories, setCategories] = useState<string>("");
  const [brands, setBrands] = useState<string>("");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { showSnackbar } = useSnackbar();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      keyword: debouncedSearch,
      sort_by: sortBy,
      order,
      limit,
      offset: (page - 1) * limit,
      ...(priceRange && { price_range: priceRange }),
      ...(categories && { categories }),
      ...(brands && { brands }),
      ...(deleted !== null && { deleted }),
      ...(isNew !== null && { is_new: isNew }),
    }),
    [
      debouncedSearch,
      sortBy,
      order,
      deleted,
      isNew,
      priceRange,
      categories,
      brands,
      page,
      limit,
    ],
  );

  const { data, error, isLoading } = useFetch(
    ["productList", queryParams],
    listProducts,
    queryParams,
  );
  const products = data?.data?.products || [];
  const totalRecords = data?.data?.pagination?.total_count || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  const handleEdit = (product: ProductType) => {
    router.push(`/apps/product/${product.id}`);
  };

  const handleDelete = async (product: ProductType) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleRestore = async (product: ProductType) => {
    setSelectedProduct(product);
    setRestoreDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      showSnackbar("Product deleted successfully", "success");
      mutate(["productList", queryParams]);
    } catch (error) {
      showSnackbar("Failed to delete product", "error");
    }
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const confirmRestore = async () => {
    if (!selectedProduct) return;
    try {
      await restoreProduct(selectedProduct.id);
      showSnackbar("Product restored successfully", "success");
      mutate(["productList", queryParams]);
    } catch (error) {
      showSnackbar("Failed to restore product", "error");
    }
    setRestoreDialogOpen(false);
    setSelectedProduct(null);
  };

  const columns = useMemo<MRT_ColumnDef<ProductType>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      {
        accessorKey: "price",
        header: "Price",
        Cell: ({ row }) => {
          const price =
            typeof row.original.price === "string"
              ? parseFloat(row.original.price)
              : row.original.price;
          return `$${Number(price).toFixed(2)}`;
        },
      },
      { accessorKey: "stock_quantity", header: "Stock" },
      { accessorKey: "category_name", header: "Category" },
      { accessorKey: "brand_name", header: "Brand" },
      {
        accessorKey: "is_new",
        header: "Status",
    Cell: ({ row }) => (
          <Chip
            label={row.original.is_new ? "New" : "Regular"}
            color={row.original.is_new ? "success" : "default"}
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        Cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString("en-GB"),
      },
    ],
    [router],
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load products</p>;

  return (
    <>
      <Paper
        className="flex flex-col flex-auto shadow-1 overflow-hidden"
        elevation={0}
      >
        <div className="flex items-center justify-between p-3">
          <IconButton className="md:hidden" onClick={() => setOpenDrawer(true)}>
            <MenuIcon />
          </IconButton>

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
            className="hidden md:block"
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

          <div className="hidden md:flex gap-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
            >
              <MenuItem value="id">Sort by ID</MenuItem>
              <MenuItem value="name">Sort by Name</MenuItem>
              <MenuItem value="price">Sort by Price</MenuItem>
              <MenuItem value="stock_quantity">Sort by Stock</MenuItem>
            </Select>

            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>

            <Select
              value={isNew === null ? "all" : isNew ? "new" : "regular"}
              onChange={(e) =>
                setIsNew(
                  e.target.value === "all" ? null : e.target.value === "new",
                )
              }
              size="small"
            >
              <MenuItem value="all">All Products</MenuItem>
              <MenuItem value="new">New Products</MenuItem>
              <MenuItem value="regular">Regular Products</MenuItem>
            </Select>

            <Select
              value={deleted === null ? "all" : deleted ? "deleted" : "active"}
              onChange={(e) =>
                setDeleted(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "deleted",
                )
              }
              size="small"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </div>
        </div>

        <DataTable
          data={products}
          columns={columns}
          renderRowActionMenuItems={({ closeMenu, row }) => [
            <MenuItem
              key="view"
              onClick={() => {
                router.push(`/apps/product/product-detail/${row.original.id}`);
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
                router.push(`/apps/product/edit?productId=${row.original.id}`);
                // router.push(`/apps/product/${row.original.id}`);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
              </ListItemIcon>
              Edit
            </MenuItem>,
            row.original.deletedAt ? (
              <MenuItem
                key="restore"
                onClick={() => {
                  handleRestore(row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>
                </ListItemIcon>
                Restore
              </MenuItem>
            ) : (
              <MenuItem
                key="delete"
                onClick={() => {
                  handleDelete(row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                </ListItemIcon>
                Delete
              </MenuItem>
            ),
          ]}
        />
        <div className="flex justify-center mb-6">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
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
      </Paper>

      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <List className="p-4 w-64">
          <ListItem>
            <ListItemText primary="Filters" />
          </ListItem>
          <ListItem>
            <TextField
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
            />
          </ListItem>
          <ListItem>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="id">Sort by ID</MenuItem>
              <MenuItem value="name">Sort by Name</MenuItem>
              <MenuItem value="price">Sort by Price</MenuItem>
              <MenuItem value="stock_quantity">Sort by Stock</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              fullWidth
              size="small"
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={isNew === null ? "all" : isNew ? "new" : "regular"}
              onChange={(e) =>
                setIsNew(
                  e.target.value === "all" ? null : e.target.value === "new",
                )
              }
              fullWidth
              size="small"
            >
              <MenuItem value="all">All Products</MenuItem>
              <MenuItem value="new">New Products</MenuItem>
              <MenuItem value="regular">Regular Products</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={deleted === null ? "all" : deleted ? "deleted" : "active"}
              onChange={(e) =>
                setDeleted(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "deleted",
                )
              }
              fullWidth
              size="small"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDrawer(false)}
            >
              Apply Filters
            </Button>
          </ListItem>
        </List>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this product? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Restore Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore this product?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRestore} color="success" variant="contained">
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductListTable;
