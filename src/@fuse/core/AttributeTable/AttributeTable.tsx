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

const SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "name", label: "Name" },
  { value: "slug", label: "Slug" },
  { value: "type", label: "Type" },
  { value: "sort_order", label: "Sort Order" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
] as const;

const AttributeTable = () => {
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
    null,
  );

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
    [sortBy, order, pageSize, page, debouncedSearch, showDeleted],
  );

  const { data, error, isLoading } = useFetch(
    ["attributeList", queryParams],
    () => listAttributes(queryParams),
    { keepPreviousData: true },
  );

  const attributes: Attribute[] = data?.data?.attributes || [];
  const totalRecords = data?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const handleDeleteClick = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAttribute) return;
    setOpenDialog(false);

    try {
      await (selectedAttribute.deleted_at
        ? restoreAttribute(selectedAttribute.id)
        : deleteAttribute(selectedAttribute.id));
      showSnackbar(
        `Attribute ${selectedAttribute.deleted_at ? "restored" : "deleted"} successfully`,
        "success",
      );
      mutate(["attributeList", queryParams]);
    } catch (error: any) {
      console.error("Action error:", error);
      showSnackbar(
        error?.response?.data?.message ||
        `Failed to ${selectedAttribute.deleted_at ? "restore" : "delete"} attribute`,
        "error",
      );
    }
  };

  const handleEdit = (attribute: Attribute) => {
    router.push(
      `/apps/attribute/attribute-update/${attribute.id}?attributeData=${encodeURIComponent(
        JSON.stringify(attribute),
      )}`,
    );
  };

  const columns = useMemo<MRT_ColumnDef<Attribute>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "sort_order", header: "Sort Order" },
      { accessorKey: "description", header: "Description" },
      {
        accessorKey: "created_at",
        header: "Created At",
        Cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleDateString(),
      },
    ],
    [],
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
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2E9970', // Thumb color when checked
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#2E9970', // Track color when checked
                  }
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
        data={attributes}
        columns={columns}
        // renderRowActionMenuItems={({ closeMenu, row }) => [
        //   <>
        //         <MenuItem
        //           key="view-details"
        //           onClick={() => {
        //         router.push(`/apps/attribute/attribute-detail/${row.original.id}`);
        //             closeMenu();
        //           }}
        //         >
        //           <ListItemIcon>
        //             <FuseSvgIcon>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>
        //           </ListItemIcon>
        //           View Details
        //         </MenuItem>
        //     {!row.original.deleted_at && (
        //       <MenuItem
        //         key="edit"
        //         onClick={() => { handleEdit(row.original); closeMenu(); }}
        //       >
        //         <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
        //         Edit
        //       </MenuItem>
        //     )}
        //         <MenuItem
        //       key="delete"
        //       onClick={() => { handleDeleteClick(row.original); closeMenu(); }}
        //         >
        //           <ListItemIcon>
        //             <FuseSvgIcon>
        //           {row.original.deleted_at ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}
        //             </FuseSvgIcon>
        //           </ListItemIcon>
        //       {row.original.deleted_at ? 'Restore' : 'Delete'}
        //         </MenuItem>
        //   </>
        // ]}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          <MenuItem
            key="view-details"
            onClick={() => {
              router.push(
                `/apps/attribute/attribute-detail/${row.original.id}`,
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
          </MenuItem>,

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
        <DialogTitle>
          {selectedAttribute?.deleted_at ? "Confirm Restore" : "Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedAttribute?.deleted_at ? "restore" : "delete"}{" "}
            <strong>{selectedAttribute?.name}</strong>?
            {!selectedAttribute?.deleted_at && (
              <Typography color="warning.main" sx={{ mt: 1 }}>
                Note: This action will only succeed if the attribute is not
                being used in any product variants and has no terms.
              </Typography>
            )}
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
