// import DataTable from './DataTable';
import { useMemo, useState, useEffect, useCallback } from "react";
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
  FormControl,
  InputLabel,
  Autocomplete,
  CircularProgress,
  Box,
} from "@mui/material";
import { listProducts, deleteProduct, restoreProduct, updateProductStatus } from "@/services/apiProduct";
import { listProductCategory } from "@/services/apiProductCategory";
import { listProductBrand } from "@/services/apiProductBrand";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import useColumnOrder from "@/hooks/useColumnOrder";
import debounce from 'lodash/debounce';
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";

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
  updatedAt: string;
  status: "draft" | "published" | "archived";
  // Add Brand and Category properties
  Brand?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
    description?: string;
  };

  Category?: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string | null;
  };
};

interface ProductListTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

// Define interfaces for category and brand data
interface CategoryType {
  id: number;
  name: string;
}

interface BrandType {
  id: number;
  name: string;
}

// Helper function to determine chip color based on status
const getStatusChipColor = (status: string | undefined | null): "success" | "warning" | "error" | "default" => {
  const lowerStatus = status?.toLowerCase();
  switch (lowerStatus) {
    case 'published':
      return 'success';
    case 'archived':
      return 'warning';
    case 'draft':
      return 'default'; // Or 'info' or another color
    default:
      return 'default';
  }
};

const ProductListTable = ({
  refreshData: setExternalRefreshFn,
}: ProductListTableProps) => {
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null
  );
  const [selectedBrand, setSelectedBrand] = useState<BrandType | null>(null);

  // State for searchable categories and brands
  const [categoryOptions, setCategoryOptions] = useState<{id: number, name: string}[]>([]);
  const [brandOptions, setBrandOptions] = useState<{id: number, name: string}[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  
  const [openDrawer, setOpenDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { showSnackbar } = useSnackbar();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null
  );
  const [products, setProducts] = useState<ProductType[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    return (
      search !== "" ||
      sortBy !== "id" ||
      order !== "DESC" ||
      deleted !== null ||
      isNew !== null ||
      priceRange !== "" ||
      categories !== "" ||
      brands !== ""
    );
  }, [search, sortBy, order, deleted, isNew, priceRange, categories, brands]);
  // --- END ADD ---

  // Add debounce effect for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // Function to fetch categories based on search query
  const fetchCategories = async (query: string) => {
    setIsCategoryLoading(true);
    try {
      const response = await listProductCategory({
        search: query,
        search_only_name: true, // Ensure we're only searching by name
        limit: 1000 // Get more results when searching
      });
      
      if (response?.data?.categories) {
        // Deduplicate categories based on ID first
        const uniqueCategories = deduplicateById(response.data.categories);
        
        // Apply intelligent sorting based on search query
        let sortedCategories = [...uniqueCategories];
        if (query) {
          sortedCategories = sortSearchResults(sortedCategories, query, 'name');
        }
        setCategoryOptions(sortedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  // Function to fetch brands based on search query
  const fetchBrands = async (query: string) => {
    setIsBrandLoading(true);
    try {
      const response = await listProductBrand({
        search: query,
        search_only_name: true, // Ensure we're only searching by name
        limit: 1000// Get more results when searching
      });
      
      if (response?.data?.brands) {
        // Deduplicate brands based on ID first
        const uniqueBrands = deduplicateById(response.data.brands);
        
        // Apply intelligent sorting based on search query
        let sortedBrands = [...uniqueBrands];
        if (query) {
          sortedBrands = sortSearchResults(sortedBrands, query, 'name');
        }
        setBrandOptions(sortedBrands);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsBrandLoading(false);
    }
  };
  
  // Helper function to deduplicate items by ID
  const deduplicateById = (items) => {
    const uniqueMap = new Map();
    items.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values());
  };
   
  // Helper function to sort search results intelligently
  const sortSearchResults = (items, query, field) => {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase();
    
    // First, filter out results that don't match at all if we have a meaningful query
    let filteredItems = items;
    if (lowerQuery.length >= 2) {
      const matchingItems = items.filter(item => 
        item[field].toLowerCase().includes(lowerQuery)
      );
      
      // Only use filtered items if we have results, otherwise fall back to all items
      if (matchingItems.length > 0) {
        filteredItems = matchingItems;
      }
    }
    
    return filteredItems.sort((a, b) => {
      const aName = a[field].toLowerCase();
      const bName = b[field].toLowerCase();
      
      // 1. Exact matches first
      if (aName === lowerQuery && bName !== lowerQuery) return -1;
      if (bName === lowerQuery && aName !== lowerQuery) return 1;
      
      // 2. Starts with matches second
      if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
      if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;
      
      // 3. Contains matches third
      const aContainsIndex = aName.indexOf(lowerQuery);
      const bContainsIndex = bName.indexOf(lowerQuery);
      
      if (aContainsIndex >= 0 && bContainsIndex < 0) return -1;
      if (bContainsIndex >= 0 && aContainsIndex < 0) return 1;
      
      // 4. If both contain, sort by position of match (earlier matches first)
      if (aContainsIndex >= 0 && bContainsIndex >= 0) {
        if (aContainsIndex !== bContainsIndex) {
          return aContainsIndex - bContainsIndex;
        }
      }
      
      // 5. Alphabetical order for equal match quality
      return aName.localeCompare(bName);
    });
  };

  // Debounced search handlers
  const debouncedCategorySearch = useCallback(
    debounce((query: string) => {
      // Only search if query is empty or at least 2 chars
      if (query.length === 0 || query.length >= 2) {
        fetchCategories(query);
      }
    }, 400), // Reduced from 1000ms to 400ms for better responsiveness
    []
  );

  const debouncedBrandSearch = useCallback(
    debounce((query: string) => {
      // Only search if query is empty or at least 2 chars
      if (query.length === 0 || query.length >= 2) {
        fetchBrands(query);
      }
    }, 400), // Reduced from 1000ms to 400ms for better responsiveness
    []
  );

  // Category search input handler
  const handleCategorySearch = (query: string) => {
    setCategorySearchQuery(query);
    debouncedCategorySearch(query);
  };

  // Brand search input handler
  const handleBrandSearch = (query: string) => {
    setBrandSearchQuery(query);
    debouncedBrandSearch(query);
  };

  // Load initial options on component mount
  useEffect(() => {
    fetchCategories("");
    fetchBrands("");
  }, []);

  // Fetch data from API using SWR
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
    ]
  );

  const {
    data,
    error,
    isLoading: apiLoading,
  } = useFetch(["productList", queryParams], listProducts, queryParams);

  // Function to manually refresh data by making a direct API call
  const refreshData = useCallback(async () => {
    try {
      // Show loading state
      setProducts([]); // Clear current data to show loading state
      setIsLoading(true); // Set loading state to true
      setManuallyRefreshing(true); // Set manual refresh indicator

      // Call the API directly
      const freshData = await listProducts(queryParams);

      // Update the local state with fresh data
      if (freshData?.data) {
        setProducts(freshData.data.products || []);
        setTotalRecords(freshData.data.pagination?.total_count || 0);
        setTotalPages(
          Math.ceil((freshData.data.pagination?.total_count || 0) / limit)
        );
      }

      // Also update the SWR cache
      await mutate(["productList", queryParams]);
    } catch (error) {
      console.error("Failed to refresh product data:", error);
      showSnackbar("Failed to refresh products", "error");
    } finally {
      setIsLoading(false); // Reset loading state
      setManuallyRefreshing(false); // Reset manual refresh indicator
    }
  }, [queryParams, showSnackbar, limit]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(refreshData);
    }
  }, [setExternalRefreshFn, refreshData]);

  useEffect(() => {
    if (data?.data) {
      setProducts(data.data.products || []);
      setTotalRecords(data.data.pagination?.total_count || 0);
      setTotalPages(
        Math.ceil((data.data.pagination?.total_count || 0) / limit)
      );
    }
  }, [data, limit]);

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

      // Update local state without reloading
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== selectedProduct.id)
      );
      setTotalRecords((prev) => prev - 1);
      setTotalPages(Math.ceil((totalRecords - 1) / limit));
    } catch (error) {
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
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const confirmRestore = async () => {
    if (!selectedProduct) return;
    try {
      await restoreProduct(selectedProduct.id);
      showSnackbar("Product restored successfully", "success");

      // Update local state without reloading
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== selectedProduct.id)
      );
      setTotalRecords((prev) => prev - 1);
      setTotalPages(Math.ceil((totalRecords - 1) / limit));
    } catch (error) {
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
    setRestoreDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleStatusChange = async (productId: number, newStatus: "draft" | "published" | "archived", closeMenu: () => void) => {
    try {
      await updateProductStatus(productId, newStatus);
      showSnackbar(`Product status updated to ${newStatus}`, "success");
      if (refreshData) {
        await refreshData();
      }
      closeMenu();
    } catch (error) {
      console.error("Error updating product status:", error);
      showSnackbar("Failed to update product status", "error");
    }
  };

  const columns = useMemo<MRT_ColumnDef<ProductType>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Product Name" },
      { accessorKey: "slug", header: "Slug" },
      // {
      //   accessorKey: "price",
      //   header: "Price",
      //   Cell: ({ row }) => {
      //     const price =
      //       typeof row.original.price === "string"
      //         ? parseFloat(row.original.price)
      //         : row.original.price;
      //     return `$${Number(price).toFixed(2)}`;
      //   },
      // },
      // { accessorKey: "stock_quantity", header: "Stock" },
      {
        accessorKey: "category_name",
        header: "Category",
        Cell: ({ row }) => row.original.Category?.name || "N/A",
      },
      {
        accessorKey: "brand_name",
        header: "Brand",
        Cell: ({ row }) => row.original.Brand?.name || "N/A",
      },
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
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ row }) => {
          const status = row.original.status;
          const capitalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';
          const color = getStatusChipColor(status);
          
          // Display a Chip instead of the dropdown
          return (
            <Chip 
              label={capitalizedStatus} 
              color={color} 
              size="small" 
              variant="outlined" // Or "filled"
              icon={
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: `${color}.main`, mr: 0.5 }} />
              }
              sx={{ 
                paddingLeft: '10px', // Add some padding for the icon
                '& .MuiChip-icon': {
                    marginLeft: '4px' // Adjust icon margin if needed
                }
              }} 
            />
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        Cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      // Only add the deletedAt column when viewing deleted products
      ...(deleted === true
        ? [
            {
              accessorKey: "deletedAt",
              header: "Deleted At",
              Cell: ({ row }) => formatDate(row.original.deletedAt || ""),
              enableColumnFilter: false,
              enableSorting: true,
              size: 150,
            },
          ]
        : []),
    ],
    [router, deleted]
  );

  // Use the column order hook
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('product-list-table', columns);

  // Add this function to highlight matching text in search results
  const highlightMatch = (text, query) => {
    if (!query || query.length < 2) return text;
    
    try {
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return (
        <>
          {parts.map((part, index) => 
            part.toLowerCase() === query.toLowerCase() ? 
              <span key={index} style={{ fontWeight: 'bold', backgroundColor: 'rgba(46, 153, 112, 0.1)' }}>
                {part}
              </span> : part
          )}
        </>
      );
    } catch (e) {
      return text;
    }
  };

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch(""); // Also clear debounced search
    setOrder("DESC");
    setSortBy("id");
    setDeleted(null);
    setIsNew(null);
    setPriceRange("");
    setCategories("");
    setBrands("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setCategorySearchQuery("");
    setBrandSearchQuery("");
    setPage(1); // Reset page to 1

    // Reset dropdown options
    fetchCategories("");
    fetchBrands("");
    
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  if (isLoading || manuallyRefreshing || (apiLoading && products.length === 0))
    return <FuseLoading />;
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
            placeholder="Search products"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {search && (
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <FuseSvgIcon>heroicons-outline:x</FuseSvgIcon>
                    </IconButton>
                  )}
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

          <div className="hidden md:flex gap-3">
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
                  e.target.value === "all" ? null : e.target.value === "new"
                )
              }
              size="small"
            >
              <MenuItem value="all">All Products</MenuItem>
              <MenuItem value="new">New Products</MenuItem>
              <MenuItem value="regular">Regular Products</MenuItem>
            </Select>

            <Select
              value={
                deleted === null ? "active" : deleted ? "deleted" : "active"
              }
              onChange={(e) =>
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted"
                )
              }
              size="small"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>

            <FormControl sx={{ minWidth: 120 }} size="small">
              <Autocomplete
                options={categoryOptions}
                getOptionLabel={(option) => option.name}
                value={selectedCategory}
                onChange={(event, newValue) => {
                  setSelectedCategory(newValue);
                  setCategories(newValue ? newValue.id.toString() : "");
                }}
                onInputChange={(event, newInputValue) => {
                  handleCategorySearch(newInputValue);
                }}
                filterOptions={(options, state) => options}
                loading={isCategoryLoading}
                loadingText="Searching categories..."
                noOptionsText={
                  categorySearchQuery.length < 2 && categorySearchQuery.length > 0
                    ? "Please enter at least 2 characters"
                    : "No categories found"
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, state) => (
                  <li {...props} key={`drawer-category-${option.id}`}>
                    {highlightMatch(option.name, categorySearchQuery)}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="Search category..."
                    variant="outlined"
                    fullWidth
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isCategoryLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                fullWidth
                sx={{
                  width: "100%",
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
            </FormControl>

            <FormControl sx={{ minWidth: 120 }} size="small">
              <Autocomplete
                options={brandOptions}
                getOptionLabel={(option) => option.name}
                value={selectedBrand}
                onChange={(event, newValue) => {
                  setSelectedBrand(newValue);
                  setBrands(newValue ? newValue.id.toString() : "");
                }}
                onInputChange={(event, newInputValue) => {
                  handleBrandSearch(newInputValue);
                }}
                filterOptions={(options, state) => options}
                loading={isBrandLoading}
                loadingText="Searching brands..."
                noOptionsText={
                  brandSearchQuery.length < 2 && brandSearchQuery.length > 0
                    ? "Please enter at least 2 characters"
                    : "No brands found"
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, state) => (
                  <li {...props} key={`drawer-brand-${option.id}`}>
                    {highlightMatch(option.name, brandSearchQuery)}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Brand"
                    placeholder="Search brand..."
                    variant="outlined"
                    fullWidth
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isBrandLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                fullWidth
                sx={{
                  width: "100%",
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
            </FormControl>

            {/* --- EDIT: Conditionally render and remove isVisible prop (Desktop) --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={clearFilters}
              />
            )}
            {/* --- END EDIT --- */}
          </div>
        </div>

        <DataTable
          data={products}
          columns={orderedColumns}
          enableColumnOrdering
          onColumnOrderChange={onColumnOrderChange}
          state={{ columnOrder }}
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
              !row.original.deletedAt &&
            <MenuItem
              key="edit"
              onClick={() => {
                router.push(`/apps/product/edit?productId=${row.original.id}`);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
              </ListItemIcon>
              Edit
            </MenuItem>,
              !row.original.deletedAt &&
            <MenuItem
              key="status"
              sx={{ 
                '& .MuiSelect-select': { 
                  padding: '0 !important',
                }
              }}
            >
              
              <FormControl fullWidth size="small">
                <Select
                  value={row.original.status || "draft"}
                  onChange={(e) => handleStatusChange(row.original.id, e.target.value as "draft" | "published" | "archived", closeMenu)}
                  variant="standard"
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      pl: 0
                    }
                  }}
                >
                  <MenuItem value="draft">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.500', mr: 1 }} />
                      Draft
                    </Box>
                  </MenuItem>
                  <MenuItem value="published">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                      Published
                    </Box>
                  </MenuItem>
                  <MenuItem value="archived">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                      Archived
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
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
              placeholder="Search products by name"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => search !== "" && setDebouncedSearch(search)}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                  e.target.value === "all" ? null : e.target.value === "new"
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
                  e.target.value === "all" ? null : e.target.value === "deleted"
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
            <Autocomplete
              options={categoryOptions}
              getOptionLabel={(option) => option.name}
              value={selectedCategory}
              onChange={(event, newValue) => {
                setSelectedCategory(newValue);
                setCategories(newValue ? newValue.id.toString() : "");
              }}
              onInputChange={(event, newInputValue) => {
                handleCategorySearch(newInputValue);
              }}
              filterOptions={(options, state) => options}
              loading={isCategoryLoading}
              loadingText="Searching categories..."
              noOptionsText={
                categorySearchQuery.length < 2 && categorySearchQuery.length > 0
                  ? "Please enter at least 2 characters"
                  : "No categories found"
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option, state) => (
                <li {...props} key={`drawer-category-${option.id}`}>
                  {highlightMatch(option.name, categorySearchQuery)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  placeholder="Search category..."
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isCategoryLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              fullWidth
              sx={{
                width: "100%",
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
          </ListItem>
          <ListItem>
            <Autocomplete
              options={brandOptions}
              getOptionLabel={(option) => option.name}
              value={selectedBrand}
              onChange={(event, newValue) => {
                setSelectedBrand(newValue);
                setBrands(newValue ? newValue.id.toString() : "");
              }}
              onInputChange={(event, newInputValue) => {
                handleBrandSearch(newInputValue);
              }}
              filterOptions={(options, state) => options}
              loading={isBrandLoading}
              loadingText="Searching brands..."
              noOptionsText={
                brandSearchQuery.length < 2 && brandSearchQuery.length > 0
                  ? "Please enter at least 2 characters"
                  : "No brands found"
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option, state) => (
                <li {...props} key={`drawer-brand-${option.id}`}>
                  {highlightMatch(option.name, brandSearchQuery)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Brand"
                  placeholder="Search brand..."
                  variant="outlined"
                  fullWidth
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isBrandLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              fullWidth
              sx={{
                width: "100%",
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
          </ListItem>
          <ListItem>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDrawer(false)}
              sx={{ mb: 1 }} // Add margin below
            >
              Apply Filters
            </Button>
            {/* --- EDIT: Conditionally render and remove isVisible prop (Mobile) --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={() => {
                  clearFilters();
                  setOpenDrawer(false); // Close drawer after clearing
                }}
                fullWidth // Keep fullWidth for drawer
              />
            )}
            {/* --- END EDIT --- */}
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