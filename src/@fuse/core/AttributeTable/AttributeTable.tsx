"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
  MenuItem,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Pagination,
  PaginationItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listAttributes,
  deleteAttribute,
  restoreAttribute,
  type Attribute,
  type AttributeListParams,
} from "@/services/apiAttribute";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";

const SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "name", label: "Name" },
  { value: "slug", label: "Slug" },
  { value: "type", label: "Type" },
  { value: "sort_order", label: "Sort Order" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
] as const;

interface AttributeTableProps {
  refreshData?: (fn: () => Promise<void>) => void;
}

const AttributeTable = ({
  refreshData: setExternalRefreshFn,
}: AttributeTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] =
    useState<AttributeListParams["sort_by"]>("created_at");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null
  );
  const [localAttributes, setLocalAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [manuallyRefreshing, setManuallyRefreshing] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo<AttributeListParams>(
    () => ({
      sort_by: sortBy,
      order,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      keyword: debouncedSearch,
      show_deleted: showDeleted,
    }),
    [sortBy, order, pageSize, page, debouncedSearch, showDeleted]
  );

  const {
    data,
    error,
    isLoading: fetchLoading,
  } = useFetch(
    ["attributeList", queryParams],
    () => listAttributes(queryParams),
    { keepPreviousData: true }
  );

  // Update localAttributes when data changes
  useEffect(() => {
    if (data?.data?.attributes) {
      setLocalAttributes(data.data.attributes);
    }
    setIsLoading(
      (fetchLoading && localAttributes.length === 0) || manuallyRefreshing
    );
  }, [
    data?.data?.attributes,
    fetchLoading,
    localAttributes.length,
    manuallyRefreshing,
  ]);

  // Function to manually refresh data by making a direct API call
  const refreshData = useCallback(async () => {
    try {
      setManuallyRefreshing(true);
      setIsLoading(true);
      // Clear current data to show loading state
      setLocalAttributes([]);

      // Call the API directly
      const freshData = await listAttributes(queryParams);

      // Update the local state with fresh data
      if (freshData?.data?.attributes) {
        setLocalAttributes(freshData.data.attributes);
      }

      // Also update the SWR cache
      await mutate(["attributeList", queryParams]);
    } catch (error) {
      console.error("Failed to refresh attribute data:", error);
      showSnackbar("Failed to refresh attribute data", "error");
    } finally {
      setIsLoading(false);
      setManuallyRefreshing(false);
    }
  }, [queryParams, showSnackbar]);

  // Provide the refresh function to the parent component
  useEffect(() => {
    if (setExternalRefreshFn) {
      setExternalRefreshFn(refreshData);
    }
  }, [setExternalRefreshFn, refreshData]);

  const handleDeleteClick = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAttribute) return;
    setOpenDialog(false);

    try {
      // Immediately update local state
      const updatedAttributes = localAttributes.filter(
        (attr) => attr.id !== selectedAttribute.id
      );
      setLocalAttributes(updatedAttributes);

      // Update pagination if needed
      const newTotal = (data?.data?.pagination?.total || 0) - 1;
      if (newTotal <= (page - 1) * pageSize && page > 1) {
        setPage(page - 1);
      }

      // Perform the actual API call
      if (selectedAttribute.deleted_at) {
        await restoreAttribute(selectedAttribute.id);
        showSnackbar("Attribute restored successfully!", "success");
      } else {
        await deleteAttribute(selectedAttribute.id);
        showSnackbar("Attribute deleted successfully!", "success");
      }

      // Update the server data
      await mutate(["attributeList", queryParams]);
    } catch (error: any) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      // Rollback the optimistic update on error
      refreshData();

      return false;
    }
  };

  const handleEdit = (attribute: Attribute) => {
    router.push(
      `/apps/attribute/attribute-update/${
        attribute.id
      }?attributeData=${encodeURIComponent(JSON.stringify(attribute))}`
    );
  };

  const columns = useMemo<MRT_ColumnDef<Attribute>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "sort_order", header: "Sort Order" },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "updated_at",
        header: "Last Updated",
        Cell: ({ row }) => formatDate(row.original.updated_at),
      },
      ...(showDeleted
        ? [
            {
              accessorKey: "deleted_at",
              header: "Deleted At",
              Cell: ({ row }) => formatDate(row.original.deleted_at || ""),
            },
          ]
        : []),
    ],
    [showDeleted]
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load attributes</p>;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3">
        <div className="flex flex-1 items-center gap-4 w-full md:w-auto">
          <TextField
            label="Search"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            className="min-w-[200px]"
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
          <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#2E9970", // Thumb color when checked
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#2E9970", // Track color when checked
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
              onChange={(e) =>
                setSortBy(e.target.value as AttributeListParams["sort_by"])
              }
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
        </div>
      </div>

      <DataTable
        data={localAttributes}
        columns={columns}
        enablePagination
        manualPagination
        state={{ pagination: { pageIndex: page - 1, pageSize } }}
        onPaginationChange={(updater: any) => {
          const newPagination = updater({ pageIndex: page - 1, pageSize });
          setPage(newPagination.pageIndex + 1);
          setPageSize(newPagination.pageSize);
        }}
        rowCount={data?.data?.pagination?.total || 0}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          !row.original.deleted_at && (
            <MenuItem
              key="view-details"
              onClick={() => {
                router.push(
                  `/apps/attribute/attribute-detail/${row.original.id}`
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
            </MenuItem>
          ),

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

          <MenuItem
            key="delete"
            onClick={() => {
              handleDeleteClick(row.original);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <FuseSvgIcon>
                {row.original.deleted_at
                  ? "heroicons-outline:arrow-path"
                  : "heroicons-outline:trash"}
              </FuseSvgIcon>
            </ListItemIcon>
            {row.original.deleted_at ? "Restore" : "Delete"}
          </MenuItem>,
        ]}
      />

      <div className="flex justify-center p-4">
        <Pagination
          count={Math.ceil(data?.data?.pagination?.total / pageSize)}
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
          {selectedAttribute?.deleted_at ? "Confirm Restore" : "Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedAttribute?.deleted_at ? "restore" : "delete"}{" "}
            <strong>{selectedAttribute?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton
            label={selectedAttribute?.deleted_at ? "Restore" : "Delete"}
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AttributeTable;
