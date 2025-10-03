// "use client";

// import { useMemo, useState, useEffect, useCallback } from "react";
// import {
//   type MRT_ColumnDef,
// } from "material-react-table";
// import DataTable from "@/components/data-table/DataTable";
// import FuseLoading from "@fuse/core/FuseLoading";
// import {
//   Paper,
//   TextField,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Typography,
//   Button,
//   InputAdornment,
//   MenuItem,
//   ListItemIcon,
//   Select,
//   FormControl,
//   InputLabel,
//   FormControlLabel,
//   Switch,
//   Pagination,
//   PaginationItem,
//   Chip,
//   Box,
// } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";
// import {
//   listShippingMethods,
//   deleteShippingMethod,
//   restoreShippingMethod,
//   type ShippingMethod,
//   type ShippingMethodListParams,
// } from "@/services/apiShippingMethod";
// import { useFetch } from "@/hooks/useFetch";
// import { mutate } from "swr";
// import { useRouter } from "next/navigation";
// import AppButton from "@/components/Shared/AppButton";
// import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
// import { useSnackbar } from "@/contexts/SnackbarContext";
// import { formatDate } from "@/utils/actions";
// import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
// import { useDebounce } from "@/hooks/useDebounce";

// const SORT_FIELDS = [
//   { value: "id", label: "ID" },
//   { value: "shipping_method", label: "Shipping Method" },
//   { value: "shipping_cost", label: "Shipping Cost" },
//   { value: "method_order", label: "Method Order" },
//   { value: "is_enabled", label: "Status" },
//   { value: "createdAt", label: "Created At" },
//   { value: "updatedAt", label: "Updated At" },
// ] as const;

// interface ShippingMethodsTableProps {
//   refreshData?: (fn: () => Promise<void>) => void;
// }

// const ShippingMethodsTable = ({
//   refreshData: setExternalRefreshFn,
// }: ShippingMethodsTableProps) => {
//   const router = useRouter();
//   const { showSnackbar } = useSnackbar();
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [showDeleted, setShowDeleted] = useState(false);
//   const [sortBy, setSortBy] =
//     useState<ShippingMethodListParams["sort_by"]>("createdAt");
//   const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
//   const [openDialog, setOpenDialog] = useState(false);
//   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//   const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(
//     null,
//   );
//   const [localShippingMethods, setLocalShippingMethods] = useState<ShippingMethod[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [manuallyRefreshing, setManuallyRefreshing] = useState(false);

//   // Debounce search
//   const debouncedSearchValue = useDebounce(search, 500);

//   useEffect(() => {
//     setDebouncedSearch(debouncedSearchValue);
//   }, [debouncedSearchValue]);


//   const fetchShippingMethods = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       const params: ShippingMethodListParams = {
//         sort_by: sortBy,
//         order,
//         limit: pageSize,
//         offset: (page - 1) * pageSize,
//         keyword: debouncedSearch,
//         show_deleted: showDeleted,
//       };

//       const response = await listShippingMethods(params);
//       if (response.success && response.data) {
//         setLocalShippingMethods(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching shipping methods:", error);
//       showSnackbar("Failed to fetch shipping methods", "error");
//     } finally {
//       setIsLoading(false);
//       setManuallyRefreshing(false);
//     }
//   }, [page, pageSize, sortBy, order, debouncedSearch, showDeleted, showSnackbar]);

//   useEffect(() => {
//     fetchShippingMethods();
//   }, [fetchShippingMethods]);

//   // Set external refresh function
//   useEffect(() => {
//     if (setExternalRefreshFn) {
//       setExternalRefreshFn(fetchShippingMethods);
//     }
//   }, [setExternalRefreshFn, fetchShippingMethods]);

//   const handleDeleteClick = (shippingMethod: ShippingMethod) => {
//     setSelectedShippingMethod(shippingMethod);
//     setOpenDeleteDialog(true);
//   };

//   const handleConfirmDelete = async () => {
//     setOpenDeleteDialog(false);
//     if (!selectedShippingMethod) return;
    
//     try {
//       await deleteShippingMethod(selectedShippingMethod.id);
//       showSnackbar("Shipping method deleted successfully", "success");
//       fetchShippingMethods();
//     } catch (error) {
//       console.error("Error deleting shipping method:", error);
//       showSnackbar("Failed to delete shipping method", "error");
//     }
//   };

//   const handleRestore = async (shippingMethod: ShippingMethod) => {
//     try {
//       await restoreShippingMethod(shippingMethod.id);
//       showSnackbar("Shipping method restored successfully", "success");
//       fetchShippingMethods();
//     } catch (error) {
//       console.error("Error restoring shipping method:", error);
//       showSnackbar("Failed to restore shipping method", "error");
//     }
//   };

//   const handleEdit = (shippingMethod: ShippingMethod) => {
//     router.push(`/apps/shipping-methods/edit/${shippingMethod.id}`);
//   };

//   const handleView = (shippingMethod: ShippingMethod) => {
//     setSelectedShippingMethod(shippingMethod);
//     setOpenDialog(true);
//   };

//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     setSelectedShippingMethod(null);
//   };

//   const columns = useMemo<MRT_ColumnDef<ShippingMethod>[]>(
//     () => [
//       {
//         accessorKey: "id",
//         header: "ID",
//         size: 80,
//         enableColumnFilter: false,
//         enableSorting: true,
//       },
//       {
//         accessorKey: "shipping_method",
//         header: "Shipping Method",
//         size: 200,
//         enableColumnFilter: false,
//         enableSorting: true,
//         Cell: ({ cell }) => (
//           <Typography variant="body2" fontWeight="medium">
//             {cell.getValue<string>()}
//           </Typography>
//         ),
//       },
//       {
//         accessorKey: "display_text",
//         header: "Display Text",
//         size: 250,
//         enableColumnFilter: false,
//         enableSorting: false,
//         Cell: ({ cell }) => (
//           <Typography variant="body2">
//             {cell.getValue<string>()}
//           </Typography>
//         ),
//       },
//       {
//         accessorKey: "shipping_cost",
//         header: "Cost",
//         size: 100,
//         enableColumnFilter: false,
//         enableSorting: true,
//         Cell: ({ cell }) => (
//           <Typography variant="body2" fontWeight="medium">
//             £{cell.getValue<string>()}
//           </Typography>
//         ),
//       },
//       {
//         accessorKey: "method_order",
//         header: "Order",
//         size: 80,
//         enableColumnFilter: false,
//         enableSorting: true,
//       },
//       {
//         accessorKey: "is_enabled",
//         header: "Status",
//         size: 100,
//         enableColumnFilter: false,
//         enableSorting: true,
//         Cell: ({ cell }) => {
//           const isEnabled = cell.getValue<boolean>();
//           return (
//             <Chip
//               label={isEnabled ? "Enabled" : "Disabled"}
//               color={isEnabled ? "success" : "default"}
//               size="small"
//             />
//           );
//         },
//       },
//       {
//         accessorKey: "carrier_code",
//         header: "Carrier",
//         size: 120,
//         enableColumnFilter: false,
//         enableSorting: false,
//         Cell: ({ cell }) => (
//           <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
//             {cell.getValue<string>()}
//           </Typography>
//         ),
//       },
//       {
//         accessorKey: "createdAt",
//         header: "Created At",
//         size: 150,
//         enableColumnFilter: false,
//         enableSorting: true,
//         Cell: ({ cell }) => (
//           <Typography variant="body2">
//             {formatDate(cell.getValue<string>())}
//           </Typography>
//         ),
//       },
//     ],
//     [],
//   );


//   if (isLoading && !manuallyRefreshing) {
//     return <FuseLoading />;
//   }

//   return (
//     <div className="w-full">
//       {/* Filters */}
//       <Paper className="mb-4 p-4">
//         <div className="flex flex-wrap gap-4 items-center">
//           <TextField
//             size="small"
//             placeholder="Search shipping methods..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon />
//                 </InputAdornment>
//               ),
//             }}
//             sx={{ minWidth: 250 }}
//           />

//           <FormControl size="small" sx={{ minWidth: 150 }}>
//             <InputLabel>Sort By</InputLabel>
//             <Select
//               value={sortBy}
//               label="Sort By"
//               onChange={(e) => setSortBy(e.target.value as ShippingMethodListParams["sort_by"])}
//             >
//               {SORT_FIELDS.map((field) => (
//                 <MenuItem key={field.value} value={field.value}>
//                   {field.label}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <FormControl size="small" sx={{ minWidth: 120 }}>
//             <InputLabel>Order</InputLabel>
//             <Select
//               value={order}
//               label="Order"
//               onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
//             >
//               <MenuItem value="ASC">Ascending</MenuItem>
//               <MenuItem value="DESC">Descending</MenuItem>
//             </Select>
//           </FormControl>

//           <FormControlLabel
//             control={
//               <Switch
//                 checked={showDeleted}
//                 onChange={(e) => setShowDeleted(e.target.checked)}
//                 size="small"
//               />
//             }
//             label="Show Deleted"
//           />

//           <ClearFiltersButton
//             onClick={() => {
//               setSearch("");
//               setSortBy("createdAt");
//               setOrder("DESC");
//               setShowDeleted(false);
//               setPage(1);
//             }}
//           />
//         </div>
//       </Paper>

//       {/* Data Table */}
//       <DataTable
//         data={localShippingMethods}
//         columns={columns}
//         enableRowActions
//         enableColumnOrdering
//         renderRowActionMenuItems={({ closeMenu, row }) => [
//           <MenuItem key="view" onClick={() => { handleView(row.original); closeMenu(); }}>
//             <ListItemIcon>
//               <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
//             </ListItemIcon>
//             View
//           </MenuItem>,
//           <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
//             <ListItemIcon>
//               <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
//             </ListItemIcon>
//             Edit
//           </MenuItem>,
//           showDeleted ? (
//             <MenuItem key="restore" onClick={() => { handleRestore(row.original); closeMenu(); }}>
//               <ListItemIcon>
//                 <FuseSvgIcon>heroicons-outline:arrow-uturn-left</FuseSvgIcon>
//               </ListItemIcon>
//               Restore
//             </MenuItem>
//           ) : (
//             <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
//               <ListItemIcon>
//                 <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
//               </ListItemIcon>
//               Delete
//             </MenuItem>
//           )
//         ]}
//       />

//       {/* View Dialog */}
//       <Dialog
//         open={openDialog}
//         onClose={handleCloseDialog}
//         maxWidth="md"
//         fullWidth
//       >
//         <DialogTitle>Shipping Method Details</DialogTitle>
//         <DialogContent>
//           {selectedShippingMethod && (
//             <Box sx={{ mt: 2 }}>
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Shipping Method
//                 </Typography>
//                 <Typography variant="body1">
//                   {selectedShippingMethod.shipping_method}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Display Text
//                 </Typography>
//                 <Typography variant="body1">
//                   {selectedShippingMethod.display_text}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Description
//                 </Typography>
//                 <Typography variant="body1">
//                   {selectedShippingMethod.description}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Shipping Cost
//                 </Typography>
//                 <Typography variant="body1">
//                   £{selectedShippingMethod.shipping_cost}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Method Order
//                 </Typography>
//                 <Typography variant="body1">
//                   {selectedShippingMethod.method_order}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Status
//                 </Typography>
//                 <Chip
//                   label={selectedShippingMethod.is_enabled ? "Enabled" : "Disabled"}
//                   color={selectedShippingMethod.is_enabled ? "success" : "default"}
//                   size="small"
//                 />
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Service Code
//                 </Typography>
//                 <Typography variant="body1">
//                   {selectedShippingMethod.service_code}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Carrier Code
//                 </Typography>
//                 <Typography variant="body1" sx={{ textTransform: "capitalize" }}>
//                   {selectedShippingMethod.carrier_code}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Created At
//                 </Typography>
//                 <Typography variant="body1">
//                   {formatDate(selectedShippingMethod.createdAt)}
//                 </Typography>
//               </Box>
              
//               <Box sx={{ mb: 2 }}>
//                 <Typography variant="subtitle2" color="text.secondary">
//                   Updated At
//                 </Typography>
//                 <Typography variant="body1">
//                   {formatDate(selectedShippingMethod.updatedAt)}
//                 </Typography>
//               </Box>
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDialog}>Close</Button>
//         </DialogActions>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
//         <DialogTitle>Confirm Delete</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to delete this shipping method?
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
//           <Button color="error" onClick={handleConfirmDelete}>
//             Delete
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default ShippingMethodsTable;
