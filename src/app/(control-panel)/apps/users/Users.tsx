'use client';

import DemoContent from '@fuse/core/DemoContent';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import DataTable from '@/components/data-table/DataTable';
import UserTable from '@fuse/core/UserTable';
import ProductListTable from '@fuse/core/ProductListTable';
// import './i18n';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: "white",
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.palette.divider
	},
	'& .FusePageSimple-content': {},
	'& .FusePageSimple-sidebarHeader': {},
	'& .FusePageSimple-sidebarContent': {}
}));

function Example() {
	const { t } = useTranslation('examplePage');

	return (
		<Root
			// header={
			// 	<div className="p-6">
			// 		<h4>User</h4>
			// 	</div>
			// }
			content={
				<div className="p-6">
					{/* <h4>Content</h4> */}
					<br />
					<UserTable/>
					{/* <DemoContent /> */}
					{/* <DataTable/> */}
				</div>
			}
		/>
	);
}

export default Example;
