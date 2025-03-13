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
// } from "@mui/material";
// import { listUser, deleteUser, restoreUser } from "@/services/apiService";
// import { useFetch } from "@/hooks/useFetch";
// import { mutate } from "swr";
// import { useRouter } from "next/navigation";
// import FuseSvgIcon from "../FuseSvgIcon";
// import AppButton from "@/components/Shared/AppButton";
// import { useRoles } from "@/hooks/roleFetch";
// import { listProductBrand } from "@/services/apiProductBrand";

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

// const ProductBrandTable = () => {
//   const router = useRouter();
//   const [search, setSearch] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState("");
//   const [roleId, setRoleId] = useState<number | "all">("all");
//   const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
//   const [deleted, setDeleted] = useState<boolean | null>(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
//   const [openDrawer, setOpenDrawer] = useState(false); // Mobile Drawer state

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
//       // order,
//       ...(deleted !== null && { deleted }),
//       // ...(roleId !== "all" && { roleId }),
//     }),
//     [debouncedSearch, deleted, ]
//   );

//   const { data, error, isLoading } = useFetch(["productBrandList", queryParams], listProductBrand, queryParams);
//   console.log("data",data);

//   const [users, setUsers] = useState<UserType[]>(data?.data?.users || []);
//   const deletedUser = users?.find(user => user.deletedAt !== null);

//   useEffect(() => {
//     if (data?.data?.users) {
//       setUsers(data.data.users);
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
//       // await deleteUser(selectedUser.id);
//       await (deletedUser ? restoreUser(selectedUser.id) : deleteUser(selectedUser.id));

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
//     { accessorKey: "first_name", header: "Id" },
//     { accessorKey: "first_name", header: "Name" },
//     { accessorKey: "last_name", header: "Price" },
//     { accessorKey: "email", header: "Size" },
//     { accessorKey: "role", header: "Brand" },
//     { accessorKey: "phone", header: "Category" },
//     { accessorKey: "gender", header: "Stock Quantity" },
//     { accessorKey: "dob", header: "Battery Capacity" },
//   ], []);

//   if (isLoading) return <FuseLoading />;
//   if (error) return <p>Failed to load users</p>;

//   const userData: UserType[] = users?.map((user: any) => ({
//     id: user.id,
//     first_name: user.first_name,
//     last_name: user.last_name,
//     email: user.email,
//     role: user.roles?.role || "N/A",
//     roleId: user.roles?.id || "N/A",
//     phone: user.phone,
//     gender: user.gender,
//     dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
//     deletedAt: user.deletedAt
//   }));


//   return (
//     <>
//       <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
//         {/* Top Bar with Search & Filters */}
//         <div className="flex items-center justify-between p-3">
//           {/* Hamburger Button for Mobile */}
//           <IconButton className="md:hidden" onClick={() => setOpenDrawer(true)}>
//             <MenuIcon />
//           </IconButton>

//           {/* Search Bar */}
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

//           {/* Filters for larger screens */}
//           <div className="hidden md:flex gap-2">
//             {/* <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
//               <MenuItem value="all">All Roles</MenuItem>
//               <MenuItem value={1}>Admin</MenuItem>
//               <MenuItem value={2}>User</MenuItem>
//             </Select> */}
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

//         {/* User Data Table */}
//         <DataTable
//           data={userData}
//           columns={columns}
//           renderRowActionMenuItems={({ closeMenu, row }) => [
//             <>
//               {!deletedUser &&
//                 <MenuItem key="edit" onClick={() => { handleEdit(row.original); closeMenu(); }}>
//                   <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
//                   Edit
//                 </MenuItem>
//               }
//             </>
//             ,
//             <MenuItem key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}>
//               <ListItemIcon><FuseSvgIcon>{deletedUser ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}</FuseSvgIcon></ListItemIcon>
//               {deletedUser ? 'Restore' : 'Delete'}
//             </MenuItem>,
//           ]}
//         />
//       </Paper>
//       {/* Mobile Drawer for Filters */}
//       <Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
//         <List className="p-4 w-64">
//           <ListItem>
//             <ListItemText primary="Filters" />
//           </ListItem>
//           <ListItem>
//             <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth size="small" />
//           </ListItem>
//           <ListItem>
//             {/* <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} fullWidth size="small">
//               <MenuItem value="all">All Roles</MenuItem>
//               <MenuItem value={1}>Admin</MenuItem>
//               <MenuItem value={2}>User</MenuItem>
//             </Select> */}
//             <Select value={roleId} onChange={(e) => setRoleId(e.target.value as number | "all")} size="small">
//               <MenuItem value="all">All Roles</MenuItem>
//               {roles?.map((role) => (
//                 <MenuItem key={role.id} value={role.id}>
//                   {role.role}
//                 </MenuItem>
//               ))}
//             </Select>
//           </ListItem>
//           <ListItem>
//             <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
//               <MenuItem value="DESC">Descending</MenuItem>
//               <MenuItem value="ASC">Ascending</MenuItem>
//             </Select>
//           </ListItem>
//           <ListItem>
//             <Button fullWidth variant="contained" onClick={() => setOpenDrawer(false)}>Apply Filters</Button>
//           </ListItem>
//         </List>
//       </Drawer>

//       {/* Delete Confirmation Dialog */}
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//         <DialogTitle>Confirm Delete</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to {deletedUser ? 'Restore' : 'Delete'} <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDialog(false)} className="text-[#247C5C]">Cancel</Button>
//           <AppButton className="w-14" label={deletedUser ? 'Restore' : 'Delete'} type="button" fullWidth size="large" onClick={handleConfirmDelete} />
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// };

// export default ProductBrandTable;



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
  IconButton,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { listProductBrand, deleteBrand, restoreBrand } from "@/services/apiProductBrand";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "../FuseSvgIcon";

export type BrandType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  updatedAt: string;
  deletedAt: string | null;
};

const ProductBrandTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandType | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(() => ({
    search: debouncedSearch,
    ...(deleted !== null && { deleted }),
  }), [debouncedSearch, deleted]);

  const { data, error, isLoading } = useFetch(["productBrandList", queryParams], listProductBrand, queryParams);

  const brands: BrandType[] = data?.data?.brands || [];
  const deletedBrand = brands?.find(brand => brand.deletedAt !== null);

  const handleDeleteClick = (brand: BrandType) => {
    setSelectedBrand(brand);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;
    setOpenDialog(false);

    try {
      await (deletedBrand ? restoreBrand(selectedBrand.id) : deleteBrand(selectedBrand.id));
      mutate(["productBrandList", queryParams]);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // const handleEdit = (brand: BrandType) => {
  //   router.push(`/brands/edit/${brand.id}`);
  // };

  console.log("brandss", brands);

  const handleEdit = (brand: BrandType) => {
    router.push(
      `/apps/product-brand/brand-update/${brand.id}?brandData=${encodeURIComponent(
        JSON.stringify({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          logo_url: brand.logo_url,
          updatedAt: brand.updatedAt,
          deletedAt: brand.deletedAt,
        })
      )}`
    );
  };

  const columns = useMemo<MRT_ColumnDef<BrandType>[]>(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Brand Name" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "updatedAt", header: "Last Updated" },
    {
      accessorKey: "logo_url",
      header: "Logo",
      Cell: ({ row }) => <img src={row.original.logo_url} alt={row.original.name} width={50} height={50} />,
    },
  ], []);

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load brands</p>;

  return (
    <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
      <div className="flex items-center justify-between p-3">
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
        />
      </div>

      <DataTable
        data={brands}
        columns={columns}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          <>
            <MenuItem
              key="view-details"
              onClick={() => {
                router.push(`/apps/product-brand/brand-detail/${row.original.id}`);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>
              </ListItemIcon>
              View Details
            </MenuItem>
            <MenuItem
              key="edit"
              onClick={() => { handleEdit(row.original); closeMenu(); }}
            >
              <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
              Edit
            </MenuItem>
            <MenuItem
              key="delete" onClick={() => { handleDeleteClick(row.original); closeMenu(); }}
            >
              <ListItemIcon>
                <FuseSvgIcon>
                  {deletedBrand ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}
                </FuseSvgIcon>
              </ListItemIcon>
              {deletedBrand ? 'Restore' : 'Delete'}
            </MenuItem>
          </>
        ]}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {deletedBrand ? 'Restore' : 'Delete'} <strong>{selectedBrand?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton label={deletedBrand ? 'Restore' : 'Delete'} type="button" onClick={handleConfirmDelete} />
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProductBrandTable;


