// import DataTable from './DataTable';
import { useMemo, useState, useEffect, useCallback } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import useColumnOrder from "@/hooks/useColumnOrder";
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
import { useDebounce } from "@/hooks/useDebounce";
import {
  listProductVariants,
  ProductVariant as BaseProductVariant,
  deleteVariant,
  restoreVariant,
} from "@/services/apiProductVariant";
import { formatDate, formatPounds } from "@/utils/actions";

// Extend the base ProductVariant type
interface ProductVariant extends BaseProductVariant {
  product?: {
    name: string;
  };
  status?: string; // Add this line to fix the TypeScript error
}

export type ProductType = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  // stock_quantity: number;
  category_id: number;
  brand_id: number;
  category_name: string;
  brand_name: string;
  is_new: boolean;
  deletedAt: string | null;
  createdAt: string;
  status: string | null;
};

interface ProductVariantTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

const ProductVariantTable = ({
  refreshData: setExternalRefreshFn,
}: ProductVariantTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  // State management
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [sortBy, setSortBy] = useState<string>("id");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [isNew, setIsNew] = useState<boolean | null>(null);
  const [priceRange, setPriceRange] = useState<string>("");
  const [stockStatus, setStockStatus] = useState<string>("in_stock");
  const [productId, setProductId] = useState<string>("");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [totalRows, setTotalRows] = useState(0);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced values
  const debouncedSearch = useDebounce(search, 500);
  const debouncedPriceRange = useDebounce(priceRange, 500);

  // Query parameters
  const queryParams = useMemo(
    () => ({
      sort_by: sortBy,
      order,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      keyword: debouncedSearch,
      price_range: debouncedPriceRange,
      stock_status: stockStatus as any,
      product_id: productId ? parseInt(productId) : undefined,
    }),
    [
      sortBy,
      order,
      rowsPerPage,
      page,
      deleted,
      debouncedSearch,
      debouncedPriceRange,
      stockStatus,
      productId,
    ]
  );

  // Function to manually refresh data by making a direct API call
  const refreshData = useCallback(async () => {
    try {
      // Show loading state
      setVariants([]); // Clear current data to show loading state
      setLoading(true);

      // Call the API directly
      const response = await listProductVariants(queryParams);

      // Update the local state with fresh data
      setVariants(response.data?.variants || []);
      setTotalRows(response.data?.pagination?.total_count || 0);
    } catch (error) {
      console.error("Failed to refresh variant data:", error);
      showSnackbar("Failed to refresh variants", "error");
    } finally {
      setLoading(false);
    }
  }, [queryParams, showSnackbar]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(refreshData);
    }
  }, [setExternalRefreshFn, refreshData]);

  // Fetch variants
  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await listProductVariants(queryParams);
      setVariants(response.data?.variants);
      setTotalRows(response.data?.pagination?.total_count);
    } catch (error) {
      console.error("Error fetching variants:", error);
      showSnackbar("Failed to fetch variants", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [queryParams]);

  // Table columns
  const columns = useMemo<MRT_ColumnDef<ProductVariant>[]>(
    () => [
      { accessorKey: "id", header: "ID" },

      {
        accessorKey: "name",
        header: "Name",
        Cell: ({ row }) => row.original.product?.name || "N/A",
      },
      { accessorKey: "slug", header: "Slug" },
      {
        accessorKey: "price",
        header: "Price",
        Cell: ({ row }) => {
          const price =
            typeof row.original.price === "string"
              ? parseFloat(row.original.price)
              : row.original.price;
          return formatPounds(price);
        },
      },
      // { accessorKey: "stock_quantity", header: "Stock" },
      // {
      //   accessorKey: "deleted_at",
      //   header: "Status",
      //   Cell: ({ row }) => (
      //     <Chip
      //       label={row.original.deleted_at ? "Deleted" : "Active"}
      //       color={row.original.deleted_at ? "error" : "success"}
      //     />
      //   ),
      // },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => (
          <Chip
            label={row.original.status === "active" ? "Active" : "InActive"}
            color={row.original.status === "active" ? "success" : "warning"}
          />
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
    ],
    []
  );

  // Use the column order hook
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('product-variant-table', columns);

  // Handlers
  const handleDeleteClick = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedVariant) return;
    setOpenDialog(false);

    try {
      if (selectedVariant.deleted_at) {
        await restoreVariant(selectedVariant.id);
        showSnackbar("Variant restored successfully", "success");
      } else {
        await deleteVariant(selectedVariant.id);
        showSnackbar("Variant deleted successfully", "success");
      }

      // Update local state
      setVariants((prevVariants) =>
        prevVariants.filter((variant) => variant.id !== selectedVariant.id)
      );
      setTotalRows((prev) => prev - 1);
    } catch (error) {
      console.error("Action error:", error);
      showSnackbar("Failed to perform action", "error");
    }
  };

  if (loading) return <FuseLoading />;

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
                  borderColor: "#2E9970",
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#2E9970",
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
              <MenuItem value="product_name">Sort by Name</MenuItem>
              <MenuItem value="price">Sort by Price</MenuItem>
              <MenuItem value="stock">Sort by Stock</MenuItem>
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
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              size="small"
            >
              <MenuItem value="in_stock">In Stock</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            </Select>
          </div>
        </div>

        <DataTable
          data={variants}
          columns={orderedColumns}
          enableColumnOrdering
          onColumnOrderChange={onColumnOrderChange}
          state={{ columnOrder }}
          renderRowActionMenuItems={({ closeMenu, row }) => [
            <MenuItem
              key="view"
              onClick={() => {
                router.push(
                  `/apps/product-variant/variant-detail/${row.original.id}`
                );
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
              </ListItemIcon>
              View Details
            </MenuItem>,
            // <MenuItem
            //   key="delete"
            //   onClick={() => {
            //     handleDeleteClick(row.original);
            //     closeMenu();
            //   }}
            // >
            //   <ListItemIcon>
            //     <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
            //   </ListItemIcon>
            //   {row.original.deleted_at ? "Restore" : "Delete"}
            // </MenuItem>,
          ]}
        />

        <div className="flex justify-center p-4">
          <Pagination
            count={Math.ceil(totalRows / rowsPerPage)}
            page={page + 1}
            onChange={(_, newPage) => setPage(newPage - 1)}
            shape="rounded"
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                className="text-gray-600 hover:text-[#2E9970]"
                sx={{
                  backgroundColor:
                    item.page === 1 && page === 0 ? "#2E9970" : "transparent",
                  color: item.page === 1 && page === 0 ? "#fff" : "inherit",
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
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="in_stock">In Stock</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            </Select>
          </ListItem>
          {/* <ListItem>
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
          </ListItem> */}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Confirm {selectedVariant?.deleted_at ? "Restore" : "Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedVariant?.deleted_at ? "Restore" : "Delete"} variant{" "}
            <strong>{selectedVariant?.sku}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton
            label={selectedVariant?.deleted_at ? "Restore" : "Delete"}
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductVariantTable;
