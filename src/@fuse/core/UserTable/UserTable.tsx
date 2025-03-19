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
import { listUser, deleteUser, restoreUser } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import { useRoles } from "@/hooks/roleFetch";
import { useSnackbar } from "@/contexts/SnackbarContext";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
  role: string | null;
  roleId: number | null;
  deletedAt: string | null;
  email_verified_at: string | null;
  createdAt: string | null;
};

const UserTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleId, setRoleId] = useState<number | "all">("all");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false); // Mobile Drawer state
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of records per page
  const { showSnackbar } = useSnackbar();

  // Fetch roles at the top level of the component
  const { roles } = useRoles();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      order,
      page,
      limit,
      ...(verified !== null && { verified }),
      ...(deleted !== null && { deleted }),
      ...(roleId !== "all" && { roleId }),
    }),
    [debouncedSearch, order, deleted, verified, roleId, page, limit],
  );

  const { data, error, isLoading } = useFetch(
    ["userList", queryParams],
    listUser,
    queryParams,
  );
  // const users = data?.data?.users || [];
  const totalRecords = data?.data?.total || 0; // Get total users from API
  const totalPages = Math.ceil(totalRecords / limit); // Total pages
  const [users, setUsers] = useState<UserType[]>(data?.data?.users || []);
  const deletedUser = users?.find((user) => user.deletedAt !== null);

  useEffect(() => {
    if (data?.data?.users) {
      setUsers(data.data.users);
    }
  }, [data]);

  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setOpenDialog(false);
    setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

    try {
      await (deletedUser
        ? restoreUser(selectedUser.id)
        : deleteUser(selectedUser.id));

      // Show Snackbar for success message
      showSnackbar(
        deletedUser
          ? "User restored successfully!"
          : "User deleted successfully!",
        "success",
      );

      mutate(["userList", queryParams]);
    } catch (error) {
      console.error("Delete error:", error);

      // Show Snackbar for error
      showSnackbar("An error occurred while processing the request.", "error");
    }
  };

  // const handleEdit = (user: UserType) => {
  //   const userData = encodeURIComponent(JSON.stringify(user));
  //   router.push(`/apps/users/user-update/${user.id}?userData=${userData}`);
  // };
  const handleEdit = (user: UserType) => {
    router.push(
      `/apps/users/user-update/${user.id}?userData=${encodeURIComponent(
        JSON.stringify({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          roleId: user.roleId,
          phone: user.phone,
          gender: user.gender?.toLowerCase(), // Convert gender to lowercase
          dob: user.dob,
        }),
      )}`,
    );
  };

  const columns = useMemo<MRT_ColumnDef<UserType>[]>(
    () => [
      { accessorKey: "id", header: "Id" },
      { accessorKey: "first_name", header: "First Name" },
      { accessorKey: "last_name", header: "Last Name" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "createdAt",
        header: "Created At",
        Cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString("en-GB"),
      },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "phone", header: "Contact" },
      { accessorKey: "gender", header: "Gender" },
      {
        accessorKey: "dob",
        header: "Date of Birth",
        Cell: ({ row }) =>
          new Date(row.original.dob).toLocaleDateString("en-GB"),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          const { deletedAt } = row.original;
          return (
            <Chip
              label={deletedAt ? "Inactive" : "Active"}
              color={deletedAt ? "warning" : "success"}
            />
          );
        },
      },
      {
        accessorKey: "verification_status",
        header: "Verification Status",
        Cell: ({ row }) => {
          return (
            <Chip
              label={row.original.email_verified_at ? "Verified" : "Pending"}
              color={row.original.email_verified_at ? "success" : "warning"}
            />
          );
        },
      },
    ],
    [],
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load users</p>;

  const userData: UserType[] = users?.map((user: any) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    createdAt: user.createdAt,
    role:
      user.roles?.role === "super_admin"
        ? "Admin"
        : (user.roles?.role === "customer" && "Customer") || "N/A",
    roleId: user.roles?.id || "N/A",
    phone: user.phone,
    // gender: user.gender,
    gender: user.gender
      ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
      : "N/A",
    dob: user.dob,
    deletedAt: user.deletedAt,
    email_verified_at: user.email_verified_at,
  }));

  return (
    <>
      <Paper
        className="flex flex-col flex-auto shadow-1 overflow-hidden"
        elevation={0}
      >
        {/* Top Bar with Search & Filters */}
        <div className="flex items-center justify-between p-3">
          {/* Hamburger Button for Mobile */}
          <IconButton className="md:hidden" onClick={() => setOpenDrawer(true)}>
            <MenuIcon />
          </IconButton>

          {/* Search Bar */}
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

          {/* Filters for larger screens */}
          <div className="hidden md:flex gap-2">
            <Select
              value={roleId}
              onChange={(e) =>
                setRoleId(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              size="small"
            >
              <MenuItem value="all">All Roles</MenuItem>
              {roles?.map((role) =>
                role?.is_admin_panel ? (
                  <MenuItem key={role.id} value={role.id}>
                    {role.role === "super_admin" ? "Admin" : role.role}
                  </MenuItem>
                ) : null,
              )}
            </Select>
            <Select
              value={
                verified === null ? "all" : verified ? "verified" : "pending"
              }
              onChange={(e) =>
                setVerified(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "verified",
                )
              }
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
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
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">InActive</MenuItem>
            </Select>
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </div>
        </div>

        {/* User Data Table */}
        <DataTable
          data={userData}
          columns={columns}
          renderRowActionMenuItems={({ closeMenu, row }) => {
            const menuItems = [];

            // Conditionally add Edit button
            if (!deletedUser) {
              menuItems.push(
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
                </MenuItem>,
              );
            }

            // Always add Delete/Restore button
            menuItems.push(
              <MenuItem
                key="delete"
                onClick={() => {
                  handleDeleteClick(row.original);
                  closeMenu();
                }}
              >
                <ListItemIcon>
                  <FuseSvgIcon>
                    {deletedUser
                      ? "heroicons-outline:arrow-path"
                      : "heroicons-outline:trash"}
                  </FuseSvgIcon>
                </ListItemIcon>
                {deletedUser ? "Restore" : "Delete"}
              </MenuItem>,
            );

            return menuItems;
          }}
        />
        {/* Pagination Component */}
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
                    backgroundColor: "#2E9970", // Active page background
                    color: "#fff", // Text color
                    "&:hover": {
                      backgroundColor: "#247C5C", // Darker shade on hover
                    },
                  },
                }}
              />
            )}
          />
        </div>
      </Paper>
      {/* Mobile Drawer for Filters */}
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
              value={roleId}
              onChange={(e) =>
                setRoleId(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
              size="small"
            >
              <MenuItem value="all">All Roles</MenuItem>
              {roles?.map((role) =>
                role?.is_admin_panel ? (
                  <MenuItem key={role.id} value={role.id}>
                    {role.role === "super_admin" ? "Admin" : role.role}
                  </MenuItem>
                ) : null,
              )}
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={
                verified === null ? "all" : verified ? "verified" : "pending"
              }
              onChange={(e) =>
                setVerified(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "verified",
                )
              }
              size="small"
            >
              <MenuItem value="all">Verification</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {deletedUser ? "Restore" : "Delete"}{" "}
            <strong>
              {selectedUser?.first_name ? selectedUser?.first_name : ""}{" "}
              {selectedUser?.last_name ? selectedUser?.last_name : ""}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            className="text-[#247C5C]"
          >
            Cancel
          </Button>
          <AppButton
            className="w-14"
            label={deletedUser ? "Restore" : "Delete"}
            type="button"
            fullWidth
            size="large"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserTable;
