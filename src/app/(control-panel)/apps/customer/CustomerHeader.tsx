import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import AppButton from '@/components/Shared/AppButton';

/**
 * The products header.
 */
function CustomerHeader() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	return (
		<div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
			<motion.span
				initial={{ x: -20 }}
				animate={{ x: 0, transition: { delay: 0.2 } }}
			>
				<div>
					{/* <PageBreadcrumb className="mb-2" /> */}
					<Typography className="text-4xl font-extrabold leading-none tracking-tight">Customer</Typography>
				</div>
			</motion.span>
		</div>
	);
}

export default CustomerHeader;
