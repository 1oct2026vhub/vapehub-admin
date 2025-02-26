'use client';

import GlobalStyles from '@mui/material/GlobalStyles';
import ProductsHeader from './ProductsHeader';
import ProductTable from './ProductTable';
// import ProductTable from './ProductTable';

/**
 * The products page.
 */

function Products() {
	return (
		<>
			<GlobalStyles
				styles={() => ({
					'#root': {
						maxHeight: '100vh'
					}
				})}
			/>
			<div className="w-full h-full flex flex-col px-4">
				<ProductsHeader />
				<ProductTable />
			</div>
		</>
	);
}

export default Products;
