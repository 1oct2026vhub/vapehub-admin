import { useMemo, useState, useEffect } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import DataTable from '@/components/data-table/DataTable';
import FuseLoading from '@fuse/core/FuseLoading';
import { Chip, ListItemIcon, MenuItem, Paper, Button, Select, TextField, Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { listCustomer, deleteCustomer, blockCustomer, unBlockCustomer } from '@/services/apiService';
import { useFetch } from '@/hooks/useFetch';
import { mutate } from 'swr';
import { useRouter } from 'next/navigation';

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number;
  gender: string | null;
  dob: string | null;
  blocked: boolean;
};

const CustomerTable = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Holds debounced value
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
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
      ...(deleted !== null && { deleted }) }),
    [debouncedSearch, order, deleted]
  );


  const { data, error, isLoading } = useFetch(['customerList', queryParams], listCustomer, queryParams);
  const [customers, setCustomers] = useState<UserType[]>([]);

  useEffect(() => {
    if (data?.data?.users) {
      setCustomers(data.data.users);
    }
  }, [data]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    setCustomers((prev) => prev.filter((user) => user.id !== id));
    try {
      await deleteCustomer(id);
      mutate(['customerList', queryParams]);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleBlockToggle = async (id: number) => {
    try {
      const latestCustomer = customers.find((user) => user.id === id);
      if (!latestCustomer) return;
      const isCurrentlyBlocked = latestCustomer.blocked;
      if (!confirm(`Are you sure you want to ${isCurrentlyBlocked ? 'unblock' : 'block'} this customer?`)) return;

      setCustomers((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, blocked: !isCurrentlyBlocked } : user
        )
      );

      await (isCurrentlyBlocked ? unBlockCustomer(id) : blockCustomer(id));
      await mutate(['customerList', queryParams], true);
    } catch (error) {
      console.error('Block/Unblock error:', error);
    }
  };

  const columns = useMemo<MRT_ColumnDef<UserType>[]>(
    () => [
      { accessorKey: 'first_name', header: 'First Name' },
      { accessorKey: 'last_name', header: 'Last Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'phone', header: 'Contact' },
      { accessorKey: 'gender', header: 'Gender' },
      { accessorKey: 'dob', header: 'Date of Birth' },
      {
        accessorKey: 'is_blocked',
        header: 'Status',
        Cell: ({ row }) => (
          <Chip
            label={row.original.blocked ? 'Blocked' : 'Active'}
            color={row.original.blocked ? 'error' : 'success'}
          />
        ),
      },
    ],
    []
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load customers</p>;

    const customerData: UserType[] = customers?.map((user: any) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    gender: user.gender,
    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    blocked: user.blocked,
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
    
            {/* Status Filter */}
            <Select value={deleted === null ? "all" : deleted ? "deleted" : "active"} onChange={(e) => setDeleted(e.target.value === "all" ? null : e.target.value === "deleted")} size="small">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deleted">Deleted</MenuItem>
            </Select>
    
            {/* Order Sorting Filter */}
            <Select value={order} onChange={(e) => setOrder(e.target.value as "ASC" | "DESC")} size="small">
              <MenuItem value="DESC">Descending</MenuItem>
              <MenuItem value="ASC">Ascending</MenuItem>
            </Select>
          </div>
    <Paper className="flex flex-col flex-auto shadow-1 overflow-hidden" elevation={0}>
      {/* <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <Select
          value={deleted === null ? 'all' : deleted ? 'deleted' : 'active'}
          onChange={(e) => setDeleted(e.target.value === 'all' ? null : e.target.value === 'deleted')}
          size="small"
        >
          <MenuItem value="all">All </MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="deleted">Deleted</MenuItem>
        </Select>
      </div> */}
      <DataTable
        data={customerData}
        columns={columns}
        renderRowActionMenuItems={({ closeMenu, row }) => [
          <MenuItem key="view-details" onClick={() => { router.push(`/apps/customer/customer-detail/${row.original.id}`); closeMenu(); }}>
            <ListItemIcon><FuseSvgIcon>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon></ListItemIcon>
            View Details
          </MenuItem>,
          <MenuItem key="delete" onClick={() => { handleDelete(row.original.id); closeMenu(); }}>
            <ListItemIcon><FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon></ListItemIcon>
            Delete
          </MenuItem>,
          <MenuItem key="block-unblock" onClick={() => { handleBlockToggle(row.original.id); closeMenu(); }}>
            <ListItemIcon>
              <FuseSvgIcon>
                {row.original.blocked ? 'heroicons-outline:lock-open' : 'heroicons-outline:lock-closed'}
              </FuseSvgIcon>
            </ListItemIcon>
            {row.original.blocked ? 'Unblock' : 'Block'}
          </MenuItem>
        ]}
      />
    </Paper>
    </>
  );
};

export default CustomerTable;
