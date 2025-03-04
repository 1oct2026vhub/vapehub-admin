'use client';

import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import CustomerHeader from './CustomerHeader';
import CustomerTable from '@fuse/core/CustomerTable';

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

function Customer() {
	return (
		<div className="p-4">
			{/* <h4>Content</h4> */}
			<br />
			<CustomerHeader />
			<CustomerTable />
		</div>
	);
}

export default Customer;
