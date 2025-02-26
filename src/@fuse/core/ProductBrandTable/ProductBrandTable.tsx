// import DataTable from './DataTable';
import { MaterialReactTableProps } from 'material-react-table';
import { Button } from '@mui/material';
import DataTable from '@/components/data-table/DataTable';

export type ProductBrandType = {
  id: number;
  brandName: string;
  country: string;
};

const columns: MaterialReactTableProps<ProductBrandType>['columns'] = [
  { accessorKey: 'id', header: 'ID', size: 50 },
  { accessorKey: 'brandName', header: 'Brand Name', size: 200 },
  { accessorKey: 'country', header: 'Country', size: 150 },
  {
    header: 'Actions',
    id: 'actions',
    Cell: ({ row }) => (
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => alert(`Editing ${row.original.brandName}`)}
      >
        Edit
      </Button>
    ),
  },
];

const data: ProductBrandType[] = [
  { id: 1, brandName: 'Apple', country: 'USA' },
  { id: 2, brandName: 'Samsung', country: 'South Korea' },
  { id: 3, brandName: 'Sony', country: 'Japan' },
];

// Component rendering the table
const ProductListTable = () => {
  return <DataTable columns={columns} data={data} />;
};

export default ProductListTable;
