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
  listAttributeTerms,
  type AttributeTerm,
  type AttributeTermListParams,
  deleteAttributeTerm,
  restoreAttributeTerm,
} from "@/services/apiAttributeTerm";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import axiosInstance from "@/utils/axiosApi";
import { useSnackbar } from "@/contexts/SnackbarContext";

// // Add delete and restore functions
// const deleteAttributeTerm = async (id: number) => {
//   const response = await axiosInstance.delete(`/api/admin/attribute-terms/${id}`);
//   return response.data;
// };

// const restoreAttributeTerm = async (id: number) => {
//   const response = await axiosInstance.patch(`/api/admin/attribute-terms/${id}/restore`);
//   return response.data;
// };

const SORT_FIELDS = [
  { value: "id", label: "ID" },
  { value: "name", label: "Name" },
  { value: "slug", label: "Slug" },
  { value: "created_at", label: "Created At" },
  { value: "updated_at", label: "Updated At" },
] as const;

interface AttributeTermTableProps {
  attributeId?: number;
}

const AttributeTermTable = ({ attributeId }: AttributeTermTableProps) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] =
    useState<AttributeTermListParams["sort_by"]>("created_at");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<AttributeTerm | null>(null);
  const [localTerms, setLocalTerms] = useState<AttributeTerm[]>([]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo<AttributeTermListParams>(
    () => ({
      attribute_id: attributeId,
      sort_by: sortBy,
      order,
      limit: pageSize,
      offset: page * pageSize,
      keyword: debouncedSearch,
      show_deleted: showDeleted,
    }),
    [attributeId, sortBy, order, pageSize, page, debouncedSearch, showDeleted],
  );

  const { data, error, isLoading } = useFetch(
    ["attributeTerms", queryParams],
    () => listAttributeTerms(queryParams),
    { keepPreviousData: true },
  );

  // Update localTerms when data changes
  useEffect(() => {
    if (data?.data?.terms) {
      setLocalTerms(data.data.terms);
    }
  }, [data?.data?.terms]);

  const terms: AttributeTerm[] = data?.data?.terms || [];
  const totalRecords = data?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const deletedTerm = terms?.find((term) => term.deleted_at !== null);

  const handleDeleteClick = (term: AttributeTerm) => {
    setSelectedTerm(term);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTerm) return;
    setOpenDialog(false);

    try {
      // Immediately update local state
      const updatedTerms = localTerms.filter(term => term.id !== selectedTerm.id);
      setLocalTerms(updatedTerms);

      // Perform the actual API call
      if (selectedTerm.deleted_at) {
        await restoreAttributeTerm(selectedTerm.id);
        showSnackbar("Term restored successfully!", "success");
      } else {
        await deleteAttributeTerm(selectedTerm.id);
        showSnackbar("Term deleted successfully!", "success");
      }

      // Update the server data
      await mutate(["attributeTerms", queryParams]);
    } catch (error: any) {
      // Revert local state on error
      if (data?.data?.terms) {
        setLocalTerms(data.data.terms);
      }
      if( error?.error){
      showSnackbar(
        error?.error?.message || "An error occurred while processing your request",
        "error"
      );
    }
    else{
      showSnackbar(
        error?.message || "An error occurred while processing your request",
        "error"
      );
    }
    }
  };

  const handleEdit = (term: AttributeTerm) => {
    router.push(
      `/apps/attribute-terms/term-update/${term.id}?termData=${encodeURIComponent(
        JSON.stringify(term),
      )}`,
    );
  };

  const columns = useMemo<MRT_ColumnDef<AttributeTerm>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "slug", header: "Slug" },
      // { accessorKey: "description", header: "Description" },
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
  if (error) return <p>Failed to load attribute terms</p>;

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
          {/* <FormControlLabel
            control={
              <Switch
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
              />
            }
            label="Show Deleted"
          /> */}

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
                setSortBy(e.target.value as AttributeTermListParams["sort_by"])
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
        data={localTerms}
        columns={columns}
        enablePagination
        manualPagination
        state={{ pagination: { pageIndex: page, pageSize } }}
        onPaginationChange={(updater: any) => {
          const newPagination = updater({ pageIndex: page, pageSize });
          setPage(newPagination.pageIndex);
          setPageSize(newPagination.pageSize);
        }}
        rowCount={totalRecords}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          <MenuItem
            key="view-details"
            onClick={() => {
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedTerm?.deleted_at ? "Confirm Restore" : "Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedTerm?.deleted_at ? "restore" : "delete"}{" "}
            <strong>{selectedTerm?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton
            label={selectedTerm?.deleted_at ? "Restore" : "Delete"}
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AttributeTermTable;
