import React from 'react';
import {
	Paper,
	Typography,
	Grid,
	Icon,
	IconButton,
	Tooltip,
	Box,
    Link
} from '@mui/material';

// Reusable placeholder for card header actions
const CardHeaderActions = () => (
    <div className="flex items-center">
        <IconButton size="small" className="border rounded mr-1">
            <Icon fontSize="small" className="text-green-500">check_circle</Icon>
        </IconButton>
        <IconButton size="small" className="border rounded">
            <Icon fontSize="small">arrow_drop_down</Icon>
        </IconButton>
    </div>
);

// Placeholder for World Map
const MapPlaceholder = () => (
    <Box sx={{ height: 200, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'grey.500', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }}>
        <Icon sx={{ fontSize: 60 }}>public</Icon>
    </Box>
);

// Simple Data Card placeholder
const DataCardPlaceholder = ({ title, col1, col2, viewLinkText, viewLinkHref = '#' }: {
    title: string;
    col1: string;
    col2: string;
    viewLinkText?: string;
    viewLinkHref?: string;
}) => (
    <Paper elevation={2} className="p-4 h-full flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start mb-2">
                <Typography variant="subtitle1" className="font-semibold">{title}</Typography>
                <CardHeaderActions />
            </div>
            <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase mb-2 border-b pb-1">
                <span>{col1}</span>
                <span>{col2}</span>
            </div>
            <Box sx={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">No data available</Typography>
            </Box>
        </div>
        {viewLinkText && (
             <Link href={viewLinkHref} underline="hover" className="text-right mt-4 block">
                 {viewLinkText} <Icon fontSize="inherit" className="align-middle">arrow_forward</Icon>
             </Link>
        )}
    </Paper>
);

function TrafficOverview() {
	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<Typography variant="h5" component="h1" className="font-semibold mb-2 sm:mb-0">
					Understand web and/or app traffic overview
				</Typography>
				<div className="flex items-center space-x-1">
                    <Typography variant="caption" className="text-gray-600 mr-2">Last 28 days: Apr 4 - May 1, 2025</Typography>
					<Tooltip title="Compare">
						<IconButton size="small" className="border rounded">
							<Icon>compare_arrows</Icon>
						</IconButton>
					</Tooltip>
					<Tooltip title="Share">
						<IconButton size="small" className="border rounded">
							<Icon>share</Icon>
						</IconButton>
					</Tooltip>
                    <Tooltip title="Analyze">
                        <IconButton size="small" className="border rounded">
                            <Icon>insights</Icon> {/* Placeholder */}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton size="small" className="border rounded">
                            <Icon>edit</Icon>
                        </IconButton>
                    </Tooltip>
				</div>
			</div>

            {/* Top Row Cards */}
            <Grid container spacing={3} className="mb-6">
                {/* Active users by Country Card */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={2} className="p-4 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <Typography variant="subtitle1" className="font-semibold">Active users* <span className="font-normal">by Country</span></Typography>
                                <CardHeaderActions />
                            </div>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={8}>
                                    <MapPlaceholder />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase mb-2 border-b pb-1">
                                        <span>Country</span>
                                        <span>Active Users</span>
                                    </div>
                                    <Box sx={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                         <Typography variant="body2" color="text.secondary">No data available</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </div>
                        <Link href="#" underline="hover" className="text-right mt-4 block">
                            View countries <Icon fontSize="inherit" className="align-middle">arrow_forward</Icon>
                        </Link>
                    </Paper>
                </Grid>

                {/* Active users by City Card */}
                <Grid item xs={12} lg={4}>
                    <DataCardPlaceholder
                        title="Active users* by City"
                        col1="City"
                        col2="Active Users"
                        viewLinkText="View cities"
                    />
                </Grid>
            </Grid>

            {/* Bottom Row Cards */}
            <Grid container spacing={3} className="mb-6">
                 {/* Engagement/Sessions Card - Using a simple structure for now */}
                 <Grid item xs={12} lg={4}>
                    <Paper elevation={2} className="p-4 h-full">
                        <div className="flex justify-between items-start mb-2">
                            <Typography variant="subtitle1" component="div" className="font-semibold border-b-2 border-blue-500 pb-1 inline-block">
                                Average engagement time per active user
                                <Tooltip title="Help"><Icon fontSize="small" className="ml-1 align-middle text-gray-400">help_outline</Icon></Tooltip>
                            </Typography>
                            {/* Placeholder for potentially showing other tabs/metrics */}
                            <Icon className="text-gray-400">chevron_right</Icon>
                        </div>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" component="span" className="font-bold mr-2">0</Typography>
                            <Typography variant="body1" component="span" className="font-bold">s</Typography>
                        </Box>

                        <Typography variant="subtitle2" className="font-semibold mb-2">
                            Engaged sessions per active user
                        </Typography>
                         <Typography variant="h4" component="span" className="font-bold mr-2">0</Typography>

                    </Paper>
                </Grid>

                 {/* Event Count Card */}
                <Grid item xs={12} lg={4}>
                     <DataCardPlaceholder
                        title="Event count by Event name"
                        col1="Event Name"
                        col2="Event Count"
                    />
                </Grid>

                {/* Views by Page title Card */}
                 <Grid item xs={12} lg={4}>
                     <DataCardPlaceholder
                        title="Views by Page title and screen class"
                        col1="Page Title and Screen..."
                        col2="Views"
                    />
                </Grid>
            </Grid>

		</div>
	);
}

export default TrafficOverview; 