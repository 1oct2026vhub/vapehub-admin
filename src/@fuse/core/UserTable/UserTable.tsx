import { useMemo, useState, useEffect } from "react";
import {
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_Updater,
} from "material-react-table";
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
  DialogContentText,
} from "@mui/material";
import { 
  listUser, 
  deleteUser, 
  restoreUser, 
  blockUser, 
  unBlockUser 
} from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import { useRoles } from "@/hooks/roleFetch";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { formatDate } from "@/utils/actions";
import ClearFiltersButton from "@/components/Shared/ClearFiltersButton";

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
  blocked?: boolean;
};

const UserTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleId, setRoleId] = useState<number | "all">("all");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [sortBy, setSortBy] = useState("createdAt");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"delete" | "block" | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false); // Mobile Drawer state
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of records per page
  const { showSnackbar } = useSnackbar();

  const sorting = useMemo<MRT_SortingState>(
    () => [{ id: sortBy, desc: order === "DESC" }],
    [sortBy, order],
  );

  const handleSortingChange = (updater: MRT_Updater<MRT_SortingState>) => {
    const newSorting = typeof updater === "function" ? updater(sorting) : updater;
    if (newSorting?.[0]) {
      const { id, desc } = newSorting[0];
      setSortBy(id);
      setOrder(desc ? "DESC" : "ASC");
    }
  };

  // --- START ADD: Check if Filters are Active ---
  const areFiltersActive = useMemo(() => {
    // Define default states for this table
    const defaultOrder = "DESC";
    const defaultRoleId = "all";
    const defaultDeleted = null;
    const defaultVerified = null;
    const defaultBlocked = null;

    return (
      search !== "" ||
      roleId !== defaultRoleId ||
      order !== defaultOrder ||
      sortBy !== "createdAt" ||
      deleted !== defaultDeleted ||
      verified !== defaultVerified ||
      blocked !== defaultBlocked
    );
  }, [search, roleId, order, sortBy, deleted, verified, blocked]);
  // --- END ADD ---

  // --- START ADD: Clear Filters Function ---
  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setRoleId("all");
    setOrder("DESC");
    setSortBy("createdAt");
    setDeleted(null);
    setVerified(null);
    setBlocked(null);
    setPage(1); // Reset page number
    showSnackbar("Filters cleared", "info");
  };
  // --- END ADD ---

  // Fetch roles at the top level of the component
  const { roles } = useRoles();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [deleted, verified, blocked, debouncedSearch, roleId]);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      order,
      page,
      limit,
      sort_by: sortBy,
      ...(verified !== null && { verified }),
      ...(deleted !== null && { deleted }),
      ...(blocked !== null && { blocked }),
      ...(roleId !== "all" && { roleId }),
    }),
    [debouncedSearch, order, sortBy, deleted, verified, blocked, roleId, page, limit],
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
    setDialogType("delete");
    setOpenDialog(true);
  };

  const handleBlockClick = (user: UserType) => {
    setSelectedUser(user);
    setDialogType("block");
    setOpenDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    setOpenDialog(false);

    try {
      if (dialogType === "delete") {
        // Optimistically update UI for delete/restore
        setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

        await (deletedUser
          ? restoreUser(selectedUser.id)
          : deleteUser(selectedUser.id));

        // Show success message
        showSnackbar(
          deletedUser
            ? "User restored successfully!"
            : "User deleted successfully!",
          "success"
        );
      } else if (dialogType === "block") {
        // Always remove the user from the current view
        setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

        // Call the appropriate API
        await (selectedUser.blocked
          ? unBlockUser(selectedUser.id)
          : blockUser(selectedUser.id));

        // Show success message
        showSnackbar(
          selectedUser.blocked
            ? "User unblocked successfully!"
            : "User blocked successfully!",
          "success"
        );
      }

      // Refresh data in the background without forcing a reload
      mutate(["userList", queryParams]);
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
            showSnackbar(` ${message}`, "error");
          }
        });
      }
      return false;
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
        Cell: ({ row }) => row.original.createdAt ? formatDate(row.original.createdAt) : 'N/A',
      },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "phone", header: "Contact" },
      { accessorKey: "gender", header: "Gender" },
      {
        accessorKey: "dob",
        header: "Date of Birth",
        Cell: ({ row }) => row.original.dob ? formatDate(row.original.dob) : 'N/A',
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => {
          // Determine status based on both deletedAt and blocked fields
          let status = "Active";
          let color: "success" | "error" | "warning" = "success";
          
          if (row.original.deletedAt) {
            status = "Inactive";
            color = "error";
          } else if (row.original.blocked) {
            status = "Blocked";
            color = "warning";
          }
          
          return (
            <Chip
              label={status}
              color={color}
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
      ...(deleted ? [{
        accessorKey: "deletedAt",
        header: "Deleted At",
        Cell: ({ row }) => row.original.deletedAt ? formatDate(row.original.deletedAt) : 'N/A',
      }] : []),
    ],
    [deleted],
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load users</p>;

  const userData: UserType[] = users?.map((user: any) => ({
    id: user.id,
    first_name: user.first_name || "N/A",
    last_name: user.last_name || "N/A",
    email: user.email || "N/A",
    createdAt: user.createdAt,
    role:
      user.roles?.role === "super_admin"
        ? "Admin"
        : (user.roles?.role === "customer" && "Customer") || "N/A",
    roleId: user.roles?.id ?? "N/A",
    phone: user.phone ?? "N/A",
    gender: user.gender
      ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
      : "N/A",
    dob: user.dob,
    deletedAt: user.deletedAt,
    email_verified_at: user.email_verified_at,
    blocked: user.blocked,
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
            >
              <MenuItem value="id">Id</MenuItem>
              <MenuItem value="first_name">First Name</MenuItem>
              <MenuItem value="last_name">Last Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="phone">Phone</MenuItem>
              <MenuItem value="gender">Gender</MenuItem>
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="updatedAt">Updated At</MenuItem>
              <MenuItem value="deletedAt">Deleted At</MenuItem>
              <MenuItem value="email_verified_at">Email Verified At</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="dob">Date of Birth</MenuItem>
            </Select>
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
              value={deleted === null ? "active" : deleted ? "deleted" : "active"}
              onChange={(e) => {
                setPage(1); // Reset page when filter changes
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted",
                );
              }}
              size="small"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
            
            <Select
              value={blocked === null ? "all" : blocked ? "true" : "false"}
              onChange={(e) =>
                setBlocked(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "true"
                )
              }
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="true">Blocked</MenuItem>
              <MenuItem value="false">Not Blocked</MenuItem>
            </Select>
            
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
            >
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>

            {/* --- START ADD: Clear Filters Button (Desktop) --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={clearFilters}
              />
            )}
            {/* --- END ADD --- */}
          </div>
        </div>

        {/* User Data Table */}
        <DataTable
          data={userData}
          columns={columns}
          manualSorting
          onSortingChange={handleSortingChange}
          state={{
            sorting,
          }}
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

            // Add Block/Unblock button
            if (!deletedUser) {
              menuItems.push(
                <MenuItem
                  key="block"
                  onClick={() => {
                    handleBlockClick(row.original);
                    closeMenu();
                  }}
                >
                  <ListItemIcon>
                    <FuseSvgIcon>
                      {row.original.blocked
                        ? "heroicons-outline:lock-open"
                        : "heroicons-outline:lock-closed"}
                    </FuseSvgIcon>
                  </ListItemIcon>
                  {row.original.blocked ? "Unblock" : "Block"}
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
        {users.length > 0 && (
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
        )}
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
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="id">Id</MenuItem>
              <MenuItem value="first_name">First Name</MenuItem>
              <MenuItem value="last_name">Last Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="phone">Phone</MenuItem>
              <MenuItem value="gender">Gender</MenuItem>
              <MenuItem value="createdAt">Created At</MenuItem>
              <MenuItem value="updatedAt">Updated At</MenuItem>
              <MenuItem value="deletedAt">Deleted At</MenuItem>
              <MenuItem value="email_verified_at">Email Verified At</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
              <MenuItem value="dob">Date of Birth</MenuItem>
            </Select>
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
              fullWidth
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
              fullWidth
            >
              <MenuItem value="all">Verification</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={deleted === null ? "active" : deleted ? "deleted" : "active"}
              onChange={(e) => {
                setPage(1); // Reset page when filter changes
                setDeleted(
                  e.target.value === "active"
                    ? null
                    : e.target.value === "deleted",
                );
              }}
              size="small"
              fullWidth
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={blocked === null ? "all" : blocked ? "true" : "false"}
              onChange={(e) =>
                setBlocked(
                  e.target.value === "all"
                    ? null
                    : e.target.value === "true"
                )
              }
              size="small"
              fullWidth
            >
              <MenuItem value="all">Blocked Status</MenuItem>
              <MenuItem value="true">Blocked</MenuItem>
              <MenuItem value="false">Not Blocked</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select
              value={order}
              onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")}
              size="small"
              fullWidth
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
            {/* --- START ADD: Clear Filters Button (Mobile Drawer) --- */}
            {areFiltersActive && (
              <ClearFiltersButton 
                onClick={() => {
                  clearFilters();
                  setOpenDrawer(false); // Close drawer after clearing
                }}
                fullWidth // Keep fullWidth for drawer
                sx={{ mt: 1 }} // Add margin top for spacing
              />
            )}
            {/* --- END ADD --- */}
          </ListItem>
        </List>
      </Drawer>

      {/* Replace the Delete Confirmation Dialog with a more generic Action Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          {dialogType === "delete" ? (
            <Typography>
              Are you sure you want to {deletedUser ? "restore" : "delete"}{" "}
              <strong>
                {selectedUser?.first_name || ""}{" "}
                {selectedUser?.last_name || ""}
              </strong>
              ?
            </Typography>
          ) : (
            <DialogContentText>
              Are you sure you want to {selectedUser?.blocked ? "unblock" : "block"} this user?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            className="text-[#247C5C]"
          >
            Cancel
          </Button>
          <AppButton
            className="w-20"
            label={
              dialogType === "delete"
                ? (deletedUser ? "Restore" : "Delete")
                : (selectedUser?.blocked ? "Unblock" : "Block")
            }
            type="button"
            fullWidth
            size="large"
            onClick={handleConfirmAction}
          />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserTable;
