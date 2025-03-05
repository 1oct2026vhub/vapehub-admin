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
} from "@mui/material";
import { listUser, deleteUser, restoreUser } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
  roleId: number | null;
  deletedAt: string | null;
};

const UserTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleId, setRoleId] = useState<number | "all">("all");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false); // Mobile Drawer state

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
      ...(deleted !== null && { deleted }),
      ...(roleId !== "all" && { roleId }),
    }),
    [debouncedSearch, order, deleted, roleId]
  );

  const { data, error, isLoading } = useFetch(["userList", queryParams], listUser, queryParams);
  const [users, setUsers] = useState<UserType[]>(data?.data?.users || []);

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
      // await deleteUser(selectedUser.id);
      await (deletedUser ? restoreUser(selectedUser.id) : deleteUser(selectedUser.id));

      mutate(["userList", queryParams]);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (user: UserType) => {
    const userData = encodeURIComponent(JSON.stringify(user));
    router.push(`/apps/users/user-update/${user.id}?userData=${userData}`);
  };

  const columns = useMemo<MRT_ColumnDef<UserType>[]>(() => [
    { accessorKey: "first_name", header: "First Name" },
    { accessorKey: "last_name", header: "Last Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Role" },
    { accessorKey: "phone", header: "Contact" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "dob", header: "Date of Birth" },
  ], []);

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load users</p>;

  const userData: UserType[] = users?.map((user: any) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.roles?.role || "N/A",
    roleId: user.roles?.id || "N/A",
    phone: user.phone,
    gender: user.gender,
    dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
    deletedAt:user.deletedAt
  }));

  // console.log("userddddd",users?.deletedAt);
  const deletedUser = users?.find(user => user.deletedAt !== null);

  console.log("deletedUser",deletedUser);
  

  return (
    <>
      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
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
          />

          {/* Filters for larger screens */}
          <div className="hidden md:flex gap-2">
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select>
            <Select
              value={deleted === null ? "all" : deleted ? "deleted" : "active"}
              onChange={(e) => setDeleted(e.target.value === "all" ? null : e.target.value === "deleted")}
              size="small"
            >
              <MenuItem value="all">All Users</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
            <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </div>
        </div>

        {/* User Data Table */}
        <DataTable
          data={userData}
          columns={columns}
          renderRowActionMenuItems={({ closeMenu, row }) => [
            <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
              <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
              Edit
            </MenuItem>,
            <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
              <ListItemIcon><FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon></ListItemIcon>
              {deletedUser? 'Restore' : 'Delete'}
            </MenuItem>,
          ]}
        />
      </Paper>
      {/* Mobile Drawer for Filters */}
      <Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <List className="p-4 w-64">
          <ListItem>
            <ListItemText primary="Filters" />
          </ListItem>
          <ListItem>
            <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth size="small" />
          </ListItem>
          <ListItem>
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} fullWidth size="small">
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <Button fullWidth variant="contained" onClick={() => setOpenDrawer(false)}>Apply Filters</Button>
          </ListItem>
        </List>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {deletedUser? 'Restore' : 'Delete'} <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} className="text-[#247C5C]">Cancel</Button>
          <AppButton className="w-14" label={deletedUser? 'Restore' : 'Delete'} type="button" fullWidth size="large" onClick={handleConfirmDelete} />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserTable;
