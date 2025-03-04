import { useMemo, useState, useEffect } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import { ListItemIcon, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { listUser, deleteUser } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import FuseSvgIcon from "../FuseSvgIcon";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
  roleId: number | null;
};

const UserTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState(""); // Holds input value
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Holds debounced value
  const [roleId, setRoleId] = useState<number | "all">("all");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [deleted, setDeleted] = useState<boolean | null>(null);

  // Debounce search input (Wait 500ms before applying search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);

    return () => clearTimeout(timer);
  }, [search]);

  // Construct API Query Params
  const queryParams = useMemo(
    () => ({
      search: debouncedSearch, 
      order,
      ...(deleted !== null && { deleted }),
      ...(roleId !== "all" && { roleId }),
    }),
    [debouncedSearch, order, deleted, roleId]
  );

  // Fetch user data based on filters
  const { data, error, isLoading } = useFetch(["userList", queryParams], listUser, queryParams);
  const [users, setUsers] = useState<UserType[]>(data?.data?.users || []);

  // Update users only when data changes
  useEffect(() => {
    if (data?.data?.users) {
      setUsers(data.data.users);
    }
  }, [data]);

  // Handle Delete User
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setUsers((prev) => prev.filter((user) => user.id !== id)); 

    try {
      await deleteUser(id);
      mutate(["userList", queryParams]); 
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (user: UserType) => {
    const userData = encodeURIComponent(JSON.stringify(user));
    router.push(`/apps/users/user-update/${user.id}?userData=${userData}`);
  };

  // Define table columns
  const columns = useMemo<MRT_ColumnDef<UserType>[]>(
    () => [
      { accessorKey: "first_name", header: "First Name" },
      { accessorKey: "last_name", header: "Last Name" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "phone", header: "Contact" },
      { accessorKey: "gender", header: "Gender" },
      { accessorKey: "dob", header: "Date of Birth" },
    ],
    []
  );

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
  }));

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        {/*Debounced Search Input */}
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />

        {/* Role Filter */}
        {/* <Typography>Role</Typography> */}
        <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
          <MenuItem value="all">All Roles</MenuItem>
          <MenuItem value={1}>Admin</MenuItem>
          <MenuItem value={2}>User</MenuItem>
        </Select>

        {/* Status Filter */}
        {/* <Typography>Status</Typography> */}
        <Select value={deleted === null ? "all" : deleted ? "deleted" : "active"} onChange={(e) => setDeleted(e.target.value === "all" ? null : e.target.value === "deleted")} size="small">
          <MenuItem value="all">All Users</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="deleted">Deleted </MenuItem>
        </Select>

        {/* Order Sorting Filter */}
        <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
          <MenuItem value="DESC">Descending</MenuItem>
          <MenuItem value="ASC">Ascending</MenuItem>
        </Select>
      </div>

      <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
        <DataTable
          data={userData} 
          columns={columns}
          renderRowActionMenuItems={({ closeMenu, row }) => [
            <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
            <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
              Edit
            </MenuItem>,
            <MenuItem key="delete" onClick={() => { handleDelete(row.original.id); closeMenu(); }}>
            <ListItemIcon><FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon></ListItemIcon>
              Delete
            </MenuItem>,
          ]}
        />
      </Paper>
    </>
  );
};

export default UserTable;
