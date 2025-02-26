// import DataTable from './DataTable';
import { MaterialReactTableProps } from 'material-react-table';
import { Button } from '@mui/material';
import DataTable from '@/components/data-table/DataTable';

export type ProductType = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
};

// Define table columns
const columns: MaterialReactTableProps<ProductType>['columns'] = [
  { accessorKey: 'id', header: 'ID', size: 50 },
  { accessorKey: 'name', header: 'Product Name', size: 200 },
  { accessorKey: 'price', header: 'Price ($)', size: 100 },
  { accessorKey: 'stock', header: 'Stock', size: 80 },
  { accessorKey: 'category', header: 'Category', size: 150 },
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
const data: ProductType[] = [
  { id: 1, name: 'Laptop', price: 1200, stock: 10, category: 'Electronics' },
  { id: 2, name: 'Smartphone', price: 800, stock: 20, category: 'Electronics' },
  { id: 3, name: 'Table', price: 150, stock: 15, category: 'Furniture' },
];

// Component rendering the table
const ProductListTable = () => {
  return <DataTable columns={columns} data={data} />;
};

export default ProductListTable;
