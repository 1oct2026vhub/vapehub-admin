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
} from "@mui/material";
import { listUser, deleteUser, restoreUser } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import { useRoles } from "@/hooks/roleFetch";

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
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of records per page

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
      page,  // 🟢 Page value passed to API
      limit, // 🟢 Limit (records per page)
      ...(deleted !== null && { deleted }),
      ...(roleId !== "all" && { roleId }),
    }),
    [debouncedSearch, order, deleted, roleId, page, limit]
  );

  const { data, error, isLoading } = useFetch(["userList", queryParams], listUser, queryParams);
  // const users = data?.data?.users || [];
  const totalRecords = data?.data?.total || 0;  // Get total users from API
  const totalPages = Math.ceil(totalRecords / limit);  // Total pages
  const [users, setUsers] = useState<UserType[]>(data?.data?.users || []);
  const deletedUser = users?.find(user => user.deletedAt !== null);

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
    deletedAt: user.deletedAt
  }));


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
            {/* <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select> */}
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
              <MenuItem value="all">All Roles</MenuItem>
              {roles?.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.role}
                </MenuItem>
              ))}
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
            <>
              {!deletedUser &&
                <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
                  <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
                  Edit
                </MenuItem>
              }
            </>
            ,
            <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
              <ListItemIcon><FuseSvgIcon>{deletedUser ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}</FuseSvgIcon></ListItemIcon>
              {deletedUser ? 'Restore' : 'Delete'}
            </MenuItem>,
          ]}
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
            {/* <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} fullWidth size="small">
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select> */}
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
              <MenuItem value="all">All Roles</MenuItem>
              {roles?.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.role}
                </MenuItem>
              ))}
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
            Are you sure you want to {deletedUser ? 'Restore' : 'Delete'} <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} className="text-[#247C5C]">Cancel</Button>
          <AppButton className="w-14" label={deletedUser ? 'Restore' : 'Delete'} type="button" fullWidth size="large" onClick={handleConfirmDelete} />
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserTable;

// import { useMemo, useState, useEffect } from "react";
// import { type MRT_ColumnDef } from "material-react-table";
// import FuseLoading from "@fuse/core/FuseLoading";
// import {
//   ListItemIcon,
//   MenuItem,
//   Paper,
//   Select,
//   TextField,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Typography,
//   Button,
//   InputAdornment,
//   IconButton,
// } from "@mui/material";
// import { listUser, deleteUser, restoreUser } from "@/services/apiService";
// import { useFetch } from "@/hooks/useFetch";
// import { mutate } from "swr";
// import { useRouter } from "next/navigation";
// import FuseSvgIcon from "../FuseSvgIcon";
// import AppButton from "@/components/Shared/AppButton";
// import { useRoles } from "@/hooks/roleFetch";
// import SearchIcon from "@mui/icons-material/Search";
// import DataTableTopToolbar from "@/components/data-table/DataTableTopToolbar";

// export type UserType = {
//   id: number;
//   first_name: string | null;
//   last_name: string | null;
//   email: string;
//   phone: number;
//   gender: string | null;
//   dob: string | null;
//   roleId: number | null;
//   deletedAt: string | null;
// };

// const UserTable = () => {
//   const router = useRouter();

//   // States for search, filters, and pagination
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [roleId, setRoleId] = useState<number | "all">("all");
//   const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
//   const [deleted, setDeleted] = useState<boolean | null>(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

//   // Pagination States
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(10);
//   const [totalCount, setTotalCount] = useState(0);

//   const { roles } = useRoles();

//   // Debounce search input
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearch(search);
//     }, 1000);
//     return () => clearTimeout(timer);
//   }, [search]);

//   const queryParams = useMemo(
//     () => ({
//       search: debouncedSearch,
//       order,
//       page,
//       limit,
//       ...(deleted !== null && { deleted }),
//       ...(roleId !== "all" && { roleId }),
//     }),
//     [debouncedSearch, order, page, limit, deleted, roleId]
//   );

//   const { data, error, isLoading } = useFetch(["userList", queryParams], listUser, queryParams);
//   const [users, setUsers] = useState<UserType[]>(data?.data?.users || []);

//   useEffect(() => {
//     if (data?.data?.users) {
//       setUsers(data.data.users);
//       setTotalCount(data.data.totalCount || 0); // Ensure we track total count
//     }
//   }, [data]);

//   const handleDeleteClick = (user: UserType) => {
//     setSelectedUser(user);
//     setOpenDialog(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (!selectedUser) return;
//     setOpenDialog(false);
//     setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

//     try {
//       await (selectedUser.deletedAt ? restoreUser(selectedUser.id) : deleteUser(selectedUser.id));
//       mutate(["userList", queryParams]);
//     } catch (error) {
//       console.error("Delete error:", error);
//     }
//   };

//   const handleEdit = (user: UserType) => {
//     const userData = encodeURIComponent(JSON.stringify(user));
//     router.push(`/apps/users/user-update/${user.id}?userData=${userData}`);
//   };

//   const columns = useMemo<MRT_ColumnDef<UserType>[]>(() => [
//     { accessorKey: "first_name", header: "First Name" },
//     { accessorKey: "last_name", header: "Last Name" },
//     { accessorKey: "email", header: "Email" },
//     { accessorKey: "role", header: "Role" },
//     { accessorKey: "phone", header: "Contact" },
//     { accessorKey: "gender", header: "Gender" },
//     { accessorKey: "dob", header: "Date of Birth" },
//   ], []);

//   if (isLoading) return <FuseLoading />;
//   if (error) return <p>Failed to load users</p>;

//   return (
//     <>
//       <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
//         {/* Top Bar with Search & Filters */}
//         <div className="flex items-center justify-between p-3">
//           <TextField
//             label="Search"
//             variant="outlined"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             size="small"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon />
//                 </InputAdornment>
//               ),
//             }}
//           />

//           <div className="flex gap-2">
//             <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
//               <MenuItem value="all">All Roles</MenuItem>
//               {roles?.map((role) => (
//                 <MenuItem key={role.id} value={role.id}>
//                   {role.role}
//                 </MenuItem>
//               ))}
//             </Select>

//             <Select
//               value={deleted === null ? "all" : deleted ? "deleted" : "active"}
//               onChange={(e) => setDeleted(e.target.value === "all" ? null : e.target.value === "deleted")}
//               size="small"
//             >
//               <MenuItem value="all">All Users</MenuItem>
//               <MenuItem value="active">Active</MenuItem>
//               <MenuItem value="deleted">Deleted</MenuItem>
//             </Select>

//             <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
//               <MenuItem value="DESC">Descending</MenuItem>
//               <MenuItem value="ASC">Ascending</MenuItem>
//             </Select>
//           </div>
//         </div>

//         {/* User Data Table with Pagination */}
//         <DataTableTopToolbar
//           data={users}
//           columns={columns}
//           rowCount={totalCount}
//           manualPagination
//           pagination={{
//             pageIndex: page - 1, // MRT uses zero-based index
//             pageSize: limit,
//           }}
//           onPaginationChange={({ pageIndex, pageSize }) => {
//             setPage(pageIndex + 1); // Convert back to 1-based index for API
//             setLimit(pageSize);
//           }}
//           renderRowActionMenuItems={({ closeMenu, row }) => [
//             <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
//               <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
//               Edit
//             </MenuItem>,
//             <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
//               <ListItemIcon><FuseSvgIcon>{row.original.deletedAt ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}</FuseSvgIcon></ListItemIcon>
//               {row.original.deletedAt ? 'Restore' : 'Delete'}
//             </MenuItem>,
//           ]}
//         />
//       </Paper>
//     </>
//   );
// };

// export default UserTable;





// import { useMemo, useState, useEffect } from "react";
// import { type MRT_ColumnDef } from "material-react-table";
// import DataTable from "@/components/data-table/DataTable";
// import FuseLoading from "@fuse/core/FuseLoading";
// import SearchIcon from "@mui/icons-material/Search";
// import MenuIcon from "@mui/icons-material/Menu";
// import {
//   ListItemIcon,
//   MenuItem,
//   Paper,
//   Select,
//   TextField,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Typography,
//   Button,
//   InputAdornment,
//   IconButton,
//   Drawer,
//   List,
//   ListItem,
//   ListItemText,
//   Pagination,
//   PaginationItem,
// } from "@mui/material";
// import { listUser, deleteUser, restoreUser } from "@/services/apiService";
// import { useFetch } from "@/hooks/useFetch";
// import { mutate } from "swr";
// import { useRouter } from "next/navigation";
// import FuseSvgIcon from "../FuseSvgIcon";
// import AppButton from "@/components/Shared/AppButton";
// import { useRoles } from "@/hooks/roleFetch";

// export type UserType = {
//   id: number;
//   first_name: string | null;
//   last_name: string | null;
//   email: string;
//   phone: number;
//   gender: string | null;
//   dob: string | null;
//   roleId: number | null;
//   deletedAt: string | null;
// };

// const UserTable = () => {
//   const router = useRouter();
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [roleId, setRoleId] = useState<number | "all">("all");
//   const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
//   const [deleted, setDeleted] = useState<boolean | null>(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
//   const [openDrawer, setOpenDrawer] = useState(false); // Mobile Drawer state
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10); // Number of records per page

//   // Fetch roles at the top level of the component
//   const { roles } = useRoles();

//   // Debounce search input
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearch(search);
//     }, 1000);
//     return () => clearTimeout(timer);
//   }, [search]);

//   const queryParams = useMemo(
//     () => ({
//       search: debouncedSearch,
//       order,
//       page,  // 🟢 Page value passed to API
//       limit, // 🟢 Limit (records per page)
//       ...(deleted !== null && { deleted }),
//       ...(roleId !== "all" && { roleId }),
//     }),
//     [debouncedSearch, order, deleted, roleId, page, limit]
//   );

//   const { data, error, isLoading } = useFetch(["userList", queryParams], listUser, queryParams);
//   const users = data?.data?.users || [];
//   const totalPages = data?.data?.totalPages || 1;

//   const handleDeleteClick = (user: UserType) => {
//     setSelectedUser(user);
//     setOpenDialog(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (!selectedUser) return;
//     setOpenDialog(false);

//     try {
//       await (selectedUser.deletedAt ? restoreUser(selectedUser.id) : deleteUser(selectedUser.id));
//       mutate(["userList", queryParams]);
//     } catch (error) {
//       console.error("Delete error:", error);
//     }
//   };

//   const handleEdit = (user: UserType) => {
//     const userData = encodeURIComponent(JSON.stringify(user));
//     router.push(`/apps/users/user-update/${user.id}?userData=${userData}`);
//   };

//   const columns = useMemo<MRT_ColumnDef<UserType>[]>(() => [
//     { accessorKey: "first_name", header: "First Name" },
//     { accessorKey: "last_name", header: "Last Name" },
//     { accessorKey: "email", header: "Email" },
//     { accessorKey: "role", header: "Role" },
//     { accessorKey: "phone", header: "Contact" },
//     { accessorKey: "gender", header: "Gender" },
//     { accessorKey: "dob", header: "Date of Birth" },
//   ], []);

//   if (isLoading) return <FuseLoading />;
//   if (error) return <p>Failed to load users</p>;

//   return (
//     <>
//       <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
//         {/* Top Bar with Search & Filters */}
//         <div className="flex items-center justify-between p-3">
//           <IconButton className="md:hidden" onClick={() => setOpenDrawer(true)}>
//             <MenuIcon />
//           </IconButton>

//           <TextField
//             label="Search"
//             variant="outlined"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             size="small"
//             InputProps={{
//               endAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon />
//                 </InputAdornment>
//               ),
//             }}
//             className="hidden md:block"
//           />

//           <div className="hidden md:flex gap-2">
//             <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
//               <MenuItem value="all">All Roles</MenuItem>
//               {roles?.map((role) => (
//                 <MenuItem key={role.id} value={role.id}>
//                   {role.role}
//                 </MenuItem>
//               ))}
//             </Select>
//             <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
//               <MenuItem value="DESC">Descending</MenuItem>
//               <MenuItem value="ASC">Ascending</MenuItem>
//             </Select>
//           </div>
//         </div>

//         {/* User Data Table */}
//         <DataTable
//           data={users}
//           columns={columns}
//           renderRowActionMenuItems={({ closeMenu, row }) => [
//             <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
//               <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
//               Edit
//             </MenuItem>,
//             <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
//               <ListItemIcon><FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon></ListItemIcon>
//               Delete
//             </MenuItem>,
//           ]}
//         />

//         {/* Pagination Component */}
//         {/* Pagination Component */}
//         <div className="flex justify-center my-4">
//           <Pagination
//             count={10} // Placeholder value, replace with actual page count
//             page={page} // Placeholder value, replace with actual current page
//             onChange={(event, value) => setPage(value)} // Update page state on click
//             shape="rounded"
//             color="primary"
//             renderItem={(item) => (
//               <PaginationItem
//                 {...item}
//                 className="text-gray-600 hover:text-blue-500"
//               />
//             )}
//           />
//         </div>
//         {/* <div className="flex justify-center my-4">
//           <Pagination
//             count={totalPages} // Get total pages from API response
//             page={page} // Controlled by state
//             onChange={(event, value) => setPage(value)} // Update page state on click
//             shape="rounded"
//             color="primary"
//             renderItem={(item) => (
//               <PaginationItem {...item} className="text-gray-600 hover:text-blue-500" />
//             )}
//           />
//         </div> */}

//       </Paper>
//     </>
//   );
// };

// export default UserTable;
