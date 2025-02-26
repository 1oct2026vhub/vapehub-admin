// import DataTable from './DataTable';
import { MaterialReactTableProps } from 'material-react-table';
import { Button } from '@mui/material';
import DataTable from '@/components/data-table/DataTable';

export type ProductCategoryType = {
  id: number;
  categoryName: string;
  description: string;
};

const columns: MaterialReactTableProps<ProductCategoryType>['columns'] = [
  { accessorKey: 'id', header: 'ID', size: 50 },
  { accessorKey: 'categoryName', header: 'Category Name', size: 200 },
  { accessorKey: 'description', header: 'Description', size: 300 },
  {
    header: 'Actions',
    id: 'actions',
    Cell: ({ row }) => (
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => alert(`Editing ${row.original.categoryName}`)}
      >
        Edit
      </Button>
    ),
  },
];

const data: ProductCategoryType[] = [
  { id: 1, categoryName: 'Electronics', description: 'Devices and gadgets' },
  { id: 2, categoryName: 'Furniture', description: 'Home and office furniture' },
  { id: 3, categoryName: 'Clothing', description: 'Apparel and accessories' },
];

// Component rendering the table
const ProductListTable = () => {
  return <DataTable columns={columns} data={data} />;
};

export default ProductListTable;
