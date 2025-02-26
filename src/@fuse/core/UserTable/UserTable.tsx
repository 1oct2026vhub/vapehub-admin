// import DataTable from './DataTable';
import { MaterialReactTableProps } from 'material-react-table';
import { Button } from '@mui/material';
import DataTable from '@/components/data-table/DataTable';

// Define user data type
export type UserType = {
  id: number;
  name: string;
  email: string;
  role: string;
};

// Define table columns
const columns: MaterialReactTableProps<UserType>['columns'] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 50,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 150,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 200,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 100,
  },
  {
    header: 'Actions',
    id: 'actions',
    Cell: ({ row }) => (
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => alert(`Editing ${row.original.name}`)}
      >
        Edit
      </Button>
    ),
  },
];

// Sample data
const data: UserType[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor' },
  { id: 3, name: 'Sam Johnson', email: 'sam@example.com', role: 'User' },
];

// Component rendering the table
const UserTable = () => {
  return <DataTable columns={columns} data={data} />;
};

export default UserTable;
