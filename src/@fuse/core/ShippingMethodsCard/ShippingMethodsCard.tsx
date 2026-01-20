"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Grid,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listShippingMethods,
  deleteShippingMethod,
  restoreShippingMethod,
  updateShippingMethodOrder,
  type ShippingMethod,
  type ShippingMethodListParams,
  type UpdateMethodOrderData,
} from "@/services/apiShippingMethod";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";
import { useDebounce } from "@/hooks/useDebounce";
import DraggableShippingMethodCard from "./DraggableShippingMethodCard";
import FuseLoading from "@fuse/core/FuseLoading";
import { usePageState } from "@/hooks/usePageState";

const SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "shipping_method", label: "Shipping Method" },
  { value: "shipping_cost", label: "Shipping Cost" },
  { value: "method_order", label: "Method Order" },
  { value: "is_enabled", label: "Status" },
  { value: "createdAt", label: "Created At" },
  { value: "updatedAt", label: "Updated At" },
] as const;

interface ShippingMethodsCardProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

const ShippingMethodsCard = ({
  refreshData: setExternalRefreshFn,
}: ShippingMethodsCardProps) => {
  const { showSnackbar } = useSnackbar();

  // Persist filters in session storage
  const [pageState, setPageState, clearPageState] = usePageState(
    "shippingMethodsCard",
    {
      search: "",
      showDeleted: false,
      sortBy: "method_order" as ShippingMethodListParams["sort_by"],
      order: "ASC" as "ASC" | "DESC",
    },
  );

  const { search, showDeleted, sortBy, order } = pageState;
  const setSearch = (value: string) =>
    setPageState((prev) => ({ ...prev, search: value }));
  const setShowDeleted = (value: boolean) =>
    setPageState((prev) => ({ ...prev, showDeleted: value }));
  const setSortBy = (value: ShippingMethodListParams["sort_by"]) =>
    setPageState((prev) => ({ ...prev, sortBy: value }));
  const setOrder = (value: "ASC" | "DESC") =>
    setPageState((prev) => ({ ...prev, order: value }));

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(
    null,
  );
  const [localShippingMethods, setLocalShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Debounce search
  const debouncedSearchValue = useDebounce(search, 500);

  useEffect(() => {
    setDebouncedSearch(debouncedSearchValue);
  }, [debouncedSearchValue]);

  const areFiltersActive = useMemo(() => {
    return (
      search !== "" ||
      showDeleted !== false ||
      sortBy !== "method_order" ||
      order !== "ASC"
    );
  }, [search, showDeleted, sortBy, order]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchShippingMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: ShippingMethodListParams = {
        sort_by: sortBy,
        order,
        limit: 100, // Get more items for card view
        offset: 0,
        keyword: debouncedSearch,
        show_deleted: showDeleted,
      };

      const response = await listShippingMethods(params);
      if (response.success && response.data) {
        setLocalShippingMethods(response.data?.shippingMethods || []);
      }
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      showSnackbar("Failed to fetch shipping methods", "error");
    } finally {
      setIsLoading(false);
      setManuallyRefreshing(false);
    }
  }, [sortBy, order, debouncedSearch, showDeleted, showSnackbar]);

  useEffect(() => {
    fetchShippingMethods();
  }, [fetchShippingMethods]);

  // Set external refresh function
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(fetchShippingMethods);
    }
  }, [setExternalRefreshFn, fetchShippingMethods]);

  const handleDeleteClick = (shippingMethod: ShippingMethod) => {
    setSelectedShippingMethod(shippingMethod);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);
    if (!selectedShippingMethod) return;
    
    try {
      await deleteShippingMethod(selectedShippingMethod.id);
      showSnackbar("Shipping method deleted successfully", "success");
      fetchShippingMethods();
    } catch (error) {
      console.error("Error deleting shipping method:", error);
      showSnackbar("Failed to delete shipping method", "error");
    }
  };

  const handleRestore = async (shippingMethod: ShippingMethod) => {
    try {
      await restoreShippingMethod(shippingMethod.id);
      showSnackbar("Shipping method restored successfully", "success");
      fetchShippingMethods();
    } catch (error) {
      console.error("Error restoring shipping method:", error);
      showSnackbar("Failed to restore shipping method", "error");
    }
  };

  const handleView = (shippingMethod: ShippingMethod) => {
    setSelectedShippingMethod(shippingMethod);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedShippingMethod(null);
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalShippingMethods((items) => {
        const oldIndex = items.findIndex((item) => item.id.toString() === active.id);
        const newIndex = items.findIndex((item) => item.id.toString() === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update method_order for each item
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          method_order: index + 1,
        }));

        // Call API to update order (with error handling)
        updateShippingMethodOrderAPI(updatedItems);

        return updatedItems;
      });
    }
  };

  // API call to update shipping method order
  const updateShippingMethodOrderAPI = async (updatedItems: ShippingMethod[]) => {
    // Prevent multiple simultaneous API calls
    if (isUpdatingOrder) {
      console.log("Order update already in progress, skipping...");
      return;
    }

    try {
      setIsUpdatingOrder(true);
      
      const methodOrders = updatedItems.map((item, index) => ({
        id: item.id,
        method_order: index + 1,
      }));

      const data: UpdateMethodOrderData = {
        method_orders: methodOrders,
      };

      console.log("Updating shipping method order:", data);
      await updateShippingMethodOrder(data);
      showSnackbar("Shipping method order updated successfully", "success");
    } catch (error: any) {
      console.error("Error updating shipping method order:", error);
      
      // Check if it's a 503 error specifically
      if (error?.response?.status === 503) {
        showSnackbar("Service temporarily unavailable. Order changes are saved locally.", "warning");
      } else if (error?.response?.status === 404) {
        showSnackbar("Update order endpoint not found. Order changes are saved locally.", "warning");
      } else if (error?.response?.status === 500) {
        showSnackbar("Server error. Order changes are saved locally.", "error");
      } else {
        showSnackbar("Failed to update shipping method order. Changes are saved locally.", "error");
      }
      
      // Don't refresh data for server errors to preserve user's changes
      if (error?.response?.status >= 500) {
        console.log("Server error detected, preserving local changes");
      } else {
        // Refresh data to get the correct order from server for client errors
        setTimeout(() => {
          fetchShippingMethods();
        }, 2000);
      }
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  if (isLoading && !manuallyRefreshing) {
    return <FuseLoading />;
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <Paper className="mb-4 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <TextField
            size="small"
            placeholder="Search shipping methods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as ShippingMethodListParams["sort_by"])}
            >
              {SORT_FIELDS.map((field) => (
                <MenuItem key={field.value} value={field.value}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={order}
              label="Order"
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
            >
              <MenuItem value="ASC">Ascending</MenuItem>
              <MenuItem value="DESC">Descending</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                size="small"
              />
            }
            label="Show Deleted"
          />

          <ClearFiltersButton
            onClick={() => {
              setSearch("");
              setSortBy("method_order");
              setOrder("ASC");
              setShowDeleted(false);
              clearPageState(); // Clear session storage
            }}
          />
        </div>
      </Paper>

      {/* Cards Grid */}
      <Box sx={{ position: 'relative' }}>
        {isUpdatingOrder && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Updating order...
            </Typography>
          </Box>
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localShippingMethods?.map(item => item.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <Grid container spacing={3}>
              {localShippingMethods?.map((shippingMethod) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={shippingMethod.id}>
                  <DraggableShippingMethodCard
                    shippingMethod={shippingMethod}
                    onDelete={handleDeleteClick}
                    onRestore={handleRestore}
                    onView={handleView}
                    showDeleted={showDeleted}
                  />
                </Grid>
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      </Box>

      {localShippingMethods?.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No shipping methods found
          </Typography>
        </Box>
      )}

      {/* View Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Shipping Method Details</DialogTitle>
        <DialogContent>
          {selectedShippingMethod && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Shipping Method
                </Typography>
                <Typography variant="body1">
                  {selectedShippingMethod.shipping_method}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Display Text
                </Typography>
                <Typography variant="body1">
                  {selectedShippingMethod.display_text}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedShippingMethod.description}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Shipping Cost
                </Typography>
                <Typography variant="body1">
                  £{selectedShippingMethod.shipping_cost}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Method Order
                </Typography>
                <Typography variant="body1">
                  {selectedShippingMethod.method_order}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {selectedShippingMethod.is_enabled ? "Enabled" : "Disabled"}
                </Typography>
              </Box>
              
              {selectedShippingMethod.carrier_code && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Carrier Code
                  </Typography>
                  <Typography variant="body1">
                    {selectedShippingMethod.carrier_code}
                  </Typography>
                </Box>
              )}
              
              {selectedShippingMethod.service_code && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Service Code
                  </Typography>
                  <Typography variant="body1">
                    {selectedShippingMethod.service_code}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedShippingMethod.createdAt)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated At
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedShippingMethod.updatedAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this shipping method?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ShippingMethodsCard;
