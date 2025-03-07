import { useMemo, useState, useEffect } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import {
  Chip,
  ListItemIcon,
  MenuItem,
  Paper,
  Button,
  Select,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  InputAdornment,
  IconButton,
  Drawer,
  List,
  ListItem,
  Pagination,
  PaginationItem,
} from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { listCustomer, deleteCustomer, blockCustomer, unBlockCustomer, restoreCustomer } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import { useSnackbar } from "@/contexts/SnackbarContext";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
  blocked: boolean;
  deletedAt: string | null;
};

const CustomerTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of records per page

  // State for confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"delete" | "restore" | "block" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false); // Mobile filter drawer state
  const { showSnackbar } = useSnackbar();
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => ({ search: debouncedSearch, order, page, limit, ...(deleted !== null && { deleted }) }), [debouncedSearch, order, deleted, page, limit]);

  const { data, error, isLoading } = useFetch(["customerList", queryParams], listCustomer, queryParams);

  useEffect(() => {
    if (data?.data?.users) {
      setCustomers(data.data.users);
    }
  }, [data]);



  //  Open confirmation dialog
  const openDialog = (type: "delete" | "block", user: UserType) => {
    setDialogType(type);
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const totalRecords = data?.data?.total || 0;  // Get total users from API
  const totalPages = Math.ceil(totalRecords / limit);  // Total pages
  const deletedCustomer = customers?.find(user => user.deletedAt !== null);

  // const handleConfirmAction = async () => {
  //   if (!selectedUser) return;
  //   setDialogOpen(false);
  //   try {
  //     if (dialogType === "delete") {
  //       setCustomers((prev) => prev.filter((user) => user.id !== selectedUser.id));
  //       // await deleteCustomer(selectedUser.id);
  //       await (deletedCustomer ? restoreCustomer(selectedUser.id) : deleteCustomer(selectedUser.id));

  //     } else if (dialogType === "block") {
  //       setCustomers((prev) =>
  //         prev.map((user) =>
  //           user.id === selectedUser.id ? { ...user, blocked: !user.blocked } : user
  //         )
  //       );
  //       await (selectedUser.blocked ? unBlockCustomer(selectedUser.id) : blockCustomer(selectedUser.id));
  //     }
  //     await mutate(["customerList", queryParams], true);
  //   } catch (error) {
  //     console.error("Action error:", error);
  //   }
  // };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    setDialogOpen(false);
  
    try {
      if (dialogType === "delete") {
        setCustomers((prev) => prev.filter((user) => user.id !== selectedUser.id));
  
        await (deletedCustomer ? restoreCustomer(selectedUser.id) : deleteCustomer(selectedUser.id));
  
        // Show Snackbar for Delete/Restore
        showSnackbar(
          deletedCustomer ? "Customer restored successfully!" : "Customer deleted successfully!",
          "success"
        );
  
      } else if (dialogType === "block") {
        setCustomers((prev) =>
          prev.map((user) =>
            user.id === selectedUser.id ? { ...user, blocked: !user.blocked } : user
          )
        );
  
        await (selectedUser.blocked ? unBlockCustomer(selectedUser.id) : blockCustomer(selectedUser.id));
  
        // Show Snackbar for Block/Unblock
        showSnackbar(
          selectedUser.blocked ? "Customer unblocked successfully!" : "Customer blocked successfully!",
          "success"
        );
      }
  
      await mutate(["customerList", queryParams], true);
  
    } catch (error) {
      console.error("Action error:", error);
  
      // Show Snackbar for Error
      showSnackbar("An error occurred while processing the request.", "error");
    }
  };
  
  const columns = useMemo<MRT_ColumnDef<UserType>[]>(() => [
    { accessorKey: "id", header: "Id" },
    { accessorKey: "first_name", header: "First Name" },
    { accessorKey: "last_name", header: "Last Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Contact" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "dob", header: "Date of Birth" },
    {
      accessorKey: "blocked",
      header: "Status",
      Cell: ({ row }) => (
        <Chip label={row.original.blocked ? "Blocked" : "Active"} color={row.original.blocked ? "error" : "success"} />
      ),
    },
  ], []);

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load customers</p>;

  const customerData: UserType[] = customers?.map((user: any) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "N/A",
    dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
    blocked: user.blocked,
    deletedAt: user.deletedAt
  }));

  console.log("customers", customers);

  return (
    <>
      {/* Table */}
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        {/* Search & Filters */}
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
          />

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2">
            <Select value={deleted === null ? "all" : deleted ? "deleted" : "active"} onChange={(e) => setDeleted(e.target.value === "all" ? null : e.target.value === "deleted")} size="small">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">In Active</MenuItem>
            </Select>
            <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </div>
        </div>
        <DataTable
          data={customerData}
          columns={columns}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const isDeleted = row.original.deletedAt !== null; // Avoid using `deletedCustomer` which depends on state

            return [
              !isDeleted && (
                <MenuItem
                  key="view-details"
                  onClick={() => {
                    router.push(`/apps/customer/customer-detail/${row.original.id}`);
                    closeMenu();
                  }}
                >
                  <ListItemIcon>
                    <FuseSvgIcon>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>
                  </ListItemIcon>
                  View Details
                </MenuItem>
              ),
              <MenuItem
                key="delete"
                onClick={() => {
                  openDialog("delete", row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>
                    {isDeleted ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}
                  </FuseSvgIcon>
                </ListItemIcon>
                {isDeleted ? "Restore" : "Delete"}
              </MenuItem>,
              !isDeleted && (
                <MenuItem
                  key="block-unblock"
                  onClick={() => {
                    openDialog("block", row.original);
                    closeMenu();
                  }}
                >
                  <ListItemIcon>
                    <FuseSvgIcon>
                      {row.original.blocked ? "heroicons-outline:lock-open" : "heroicons-outline:lock-closed"}
                    </FuseSvgIcon>
                  </ListItemIcon>
                  {row.original.blocked ? "Unblock" : "Block"}
                </MenuItem>
              ),
            ].filter(Boolean); // Removes `null` values
          }}
        />

        {/* Pagination Component */}
        <div className="flex justify-center mb-6">
          <Pagination
            count={totalPages} // Placeholder value, replace with actual page count
            page={page} // Placeholder value, replace with actual current page
            onChange={(event, value) => setPage(value)} // Update page state on click
            shape="rounded"
            color="primary"
            renderItem={(item) => (
              <PaginationItem
                {...item}
                className="text-gray-600 hover:text-[#2E9970]"
              />
            )}
          />
        </div>

      </Paper >

      {/* Mobile Filter Drawer */}
      < Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <List>
          <ListItem>
            {/* <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select> */}
            <Select value={deleted === null ? "all" : deleted ? "deleted" : "active"} onChange={(e) => setDeleted(e.target.value === "all" ? null : e.target.value === "deleted")} size="small">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </ListItem>
        </List>
      </Drawer >

      {/* Confirmation Dialog */}
      < Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogType === "delete"
              ? `Are you sure you want to ${deletedCustomer ? 'Restore' : 'Delete'} ${selectedUser?.first_name} ${selectedUser?.last_name}?`
              : `Are you sure you want to ${selectedUser?.blocked ? "unblock" : "block"} this customer?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <AppButton label={
            dialogType === "delete"
              ? selectedUser?.deletedAt ? "Restore" : "Delete"
              : selectedUser?.blocked
                ? "Unblock"
                : "Block"
          }
            onClick={handleConfirmAction} />
        </DialogActions>
      </Dialog >
    </>
  );
};

export default CustomerTable;