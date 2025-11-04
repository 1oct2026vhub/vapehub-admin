"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_Updater,
} from "material-react-table";
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
  MenuItem,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Pagination,
  PaginationItem,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listSettings,
  deleteSetting,
  type Setting,
  type SettingListParams,
} from "@/services/apiSetting";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import useColumnOrder from "@/hooks/useColumnOrder";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";

const SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "content_key", label: "Content Key" },
  { value: "is_active", label: "Status" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
] as const;

interface SettingsTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
  onSettingsCountUpdate?: (count: number) => void;
}

const SettingsTable = ({
  refreshData: setExternalRefreshFn,
  onSettingsCountUpdate,
}: SettingsTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortBy, desc: order === "DESC" }],
    [sortBy, order]
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortBy(id);
      setOrder(desc ? "DESC" : "ASC");
    } else {
      setSortBy("created_at");
      setOrder("DESC");
    }
  };

  // Check if filters are active
  const areFiltersActive = useMemo(() => {
    const defaultSortBy = "created_at";
    const defaultOrder = "DESC";
    const defaultShowDeleted = false;

    return (
      search !== "" ||
      sortBy !== defaultSortBy ||
      order !== defaultOrder ||
      showDeleted !== defaultShowDeleted ||
      activeFilter !== undefined
    );
  }, [search, sortBy, order, showDeleted, activeFilter]);

  // Clear filters function
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setShowDeleted(false);
    setActiveFilter(undefined);
    setSortBy("created_at");
    setOrder("DESC");
    setPage(1);
    setRowSelection({});
    showSnackbar("Filters cleared", "info");
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch settings
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: SettingListParams = {
        page,
        limit: pageSize,
        sort_by: sortBy,
        order,
        search: debouncedSearch || undefined,
        deleted: showDeleted,
        ...(activeFilter !== undefined && { is_active: activeFilter }),
      };
      const res = await listSettings(params);
      setSettings(res.data?.results || []);
      setTotal(res.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
      showSnackbar("Failed to fetch settings data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, order, debouncedSearch, showDeleted, activeFilter, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(fetchData);
    }
  }, [setExternalRefreshFn, fetchData]);

  // Notify parent about settings count changes
  useEffect(() => {
    if (onSettingsCountUpdate) {
      onSettingsCountUpdate(total);
    }
  }, [total, onSettingsCountUpdate]);

  const handleDeleteClick = (setting: Setting) => {
    setSelectedSetting(setting);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSetting) return;
    setOpenDialog(false);

    try {
      await deleteSetting(selectedSetting.id);
      showSnackbar("Setting deleted successfully!", "success");
      fetchData();
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
    }
  };

  const handleEdit = (setting: Setting) => {
    router.push(`/apps/settings/edit/${setting.id}`);
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
    const selectedSettingsToDelete = settings.filter((_, index) =>
      selectedIndices.includes(index.toString())
    );

    // Filter out already deleted settings for bulk delete
    const activeSettingsToDelete = selectedSettingsToDelete.filter(
      (setting) => !setting.deleted_at
    );

    if (activeSettingsToDelete.length === 0) {
      showSnackbar(
        "No active settings selected for deletion.",
        "warning"
      );
      handleCloseBulkDeleteDialog();
      return;
    }

    const idsToDelete = activeSettingsToDelete.map((setting) => setting.id);

    try {
      setIsLoading(true);
      // Delete all selected settings in parallel
      await Promise.all(idsToDelete.map((id) => deleteSetting(id)));

      showSnackbar(
        `${idsToDelete.length} setting(s) deleted successfully!`,
        "success"
      );
      setRowSelection({});
      
      // Refresh data from server
      fetchData();
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.errors?.[0]?.msg || "Bulk delete failed";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
      handleCloseBulkDeleteDialog();
    }
  };

  const columns = useMemo<MRT_ColumnDef<Setting>[]>(
    () => [
      { accessorKey: "id", header: "ID", size: 80 },
      { 
        accessorKey: "content_key", 
        header: "Content Key",
        size: 200,
      },
      // {
      //   accessorKey: "content",
      //   header: "Content",
      //   size: 300,
      //   Cell: ({ row }) => {
      //     const content = row.original.content;
      //     return (
      //       <div className="truncate max-w-[300px]" title={content}>
      //         {content}
      //       </div>
      //     );
      //   },
      // },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 120,
        Cell: ({ row }) => (
          <Chip
            label={row.original.is_active ? "Active" : "Inactive"}
            color={row.original.is_active ? "success" : "default"}
            size="small"
          />
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        size: 150,
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "updated_at",
        header: "Last Updated",
        size: 150,
        Cell: ({ row }) => formatDate(row.original.updated_at),
      },
      ...(showDeleted
        ? [
            {
              accessorKey: "deleted_at",
              header: "Deleted At",
              size: 150,
              Cell: ({ row }) => formatDate(row.original.deleted_at || ""),
            },
          ]
        : []),
    ],
    [showDeleted]
  );

  // Use the column order hook
  const { columns: orderedColumns, columnOrder, onColumnOrderChange } = useColumnOrder('settings-table', columns);

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <FuseLoading />;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3">
        <div className="flex flex-1 items-center gap-4 w-full md:w-auto flex-wrap">
          <TextField
            label="Search"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            className="min-w-[200px]"
            placeholder="Search in content key and content"
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
                  borderWidth: "2px",
                },
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#2E9970",
              },
            }}
          />
          
          <FormControl size="small" className="min-w-[150px]">
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={activeFilter === undefined ? "all" : activeFilter ? "active" : "inactive"}
              label="Status Filter"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all") {
                  setActiveFilter(undefined);
                } else {
                  setActiveFilter(value === "active");
                }
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#2E9970",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#2E9970",
                  },
                }}
              />
            }
            label="Show Deleted"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <FormControl size="small" className="min-w-[150px]">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_FIELDS.map((field) => (
                <MenuItem key={field.value} value={field.value}>
                  {field.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" className="min-w-[150px]">
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

          {areFiltersActive && (
            <ClearFiltersButton 
              onClick={clearFilters}
              sx={{ height: '40px' }}
            />
          )}
        </div>
      </div>

      <DataTable
        data={settings}
        columns={orderedColumns}
        manualSorting
        onSortingChange={handleSortingChange}
        onColumnOrderChange={onColumnOrderChange}
        enablePagination
        manualPagination
        enableRowSelection={true}
        onRowSelectionChange={setRowSelection}
        state={{
          columnOrder,
          sorting,
          rowSelection,
          pagination: { pageIndex: page - 1, pageSize },
        }}
        onPaginationChange={(updater: any) => {
          const newPagination = updater({ pageIndex: page - 1, pageSize });
          setPage(newPagination.pageIndex + 1);
          setPageSize(newPagination.pageSize);
        }}
        rowCount={total}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          !row.original.deleted_at && (
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

          !row.original.deleted_at && (
            <MenuItem
              key="delete"
              onClick={() => {
                handleDeleteClick(row.original);
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

      <div className="flex justify-center p-4">
        <Pagination
          count={totalPages}
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
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the setting with key{" "}
            <strong>{selectedSetting?.content_key}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton
            label="Delete"
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onClose={handleCloseBulkDeleteDialog}>
        <DialogTitle>Bulk Delete Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{Object.keys(rowSelection).length}</strong> selected
            setting(s)? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmBulkDelete}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SettingsTable;

