import React from 'react';
import { Paper, Typography, Grid, Divider, Icon, IconButton, Tooltip, TextField, InputAdornment } from '@mui/material';

function RealtimePagesView() {
	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<Typography variant="h5" component="h1" className="font-semibold">
					Realtime pages
					<Icon className="text-green-500 ml-2 align-middle">check_circle</Icon>
					{/* Placeholder for dropdown arrow */}
					<Icon className="ml-1 align-middle text-gray-500">arrow_drop_down</Icon>
				</Typography>
				<div className="flex items-center space-x-1">
					<Tooltip title="Share">
						<IconButton size="small" className="border rounded">
							<Icon>share</Icon>
						</IconButton>
					</Tooltip>
				</div>
			</div>

			{/* Top Stats Card */}
			<Paper elevation={2} className="p-4 sm:p-6 mb-6">
				<Grid container spacing={4}>
					{/* Active Users & Views */}
					<Grid item xs={12} md={6} lg={7}>
						<Grid container spacing={4}>
							<Grid item xs={6}>
								<Typography variant="caption" className="text-gray-600 uppercase tracking-wider mb-1 block">
									Active users in last 30 minutes
								</Typography>
								<Typography variant="h3" component="div" className="font-bold">
									0
								</Typography>
							</Grid>
							<Grid item xs={6}>
								<Typography variant="caption" className="text-gray-600 uppercase tracking-wider mb-1 block">
									Views in last 30 minutes
								</Typography>
								<Typography variant="h3" component="div" className="font-bold">
									0
								</Typography>
							</Grid>
						</Grid>
					</Grid>

					{/* Active Users Per Minute Graph */}
					<Grid item xs={12} md={6} lg={5}>
						<div className="h-full flex flex-col justify-between">
                            <div>
                                <Typography variant="subtitle2" className="text-gray-700 font-medium mb-1">
                                    Active users per minute
                                    <Tooltip title="Help about active users per minute">
                                        <Icon fontSize="small" className="ml-1 align-middle text-gray-500">help_outline</Icon>
                                    </Tooltip>
                                </Typography>
                                <div className="h-20 bg-gray-50 border rounded flex items-center justify-center text-gray-500 mb-1 relative"> {/* Adjusted height */}
                                    Graph Placeholder
                                    {/* Y-axis labels */}
                                    <div className="absolute left-[-30px] top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 py-1">
                                        <span>1</span>
                                        <span>0.5</span>
                                        <span>0</span>
                                    </div>
                                </div>
                            </div>
							{/* X-axis labels */}
							<div className="flex justify-between text-xs text-gray-500 px-1">
								<span>-30 min</span>
								<span>-25 min</span>
								<span>-20 min</span>
								<span>-15 min</span>
								<span>-10 min</span>
								<span>-5 min</span>
								<span>-1 min</span>
							</div>
						</div>
					</Grid>
				</Grid>
			</Paper>

			{/* Page Path Table Card */}
			<Paper elevation={2} className="p-4 sm:p-6">
				<Typography variant="h6" component="h2" className="font-semibold mb-4">
					Page path and screen class in last 30 minutes
				</Typography>

				{/* Search Input */}
				<TextField
					variant="outlined"
					size="small"
					placeholder="Search..."
					fullWidth
					className="mb-4"
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<Icon className="text-gray-500">search</Icon>
							</InputAdornment>
						),
					}}
				/>

				{/* Table Header */}
				<div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2 border-b pb-2">
					<div className="flex-1 pr-2">
						Page path and screen class
					</div>
					<div className="w-24 text-right">
						<Icon fontSize="small" className="align-middle mr-1">arrow_downward</Icon>
						Active users
					</div>
					<div className="w-20 text-right">Views</div>
				</div>

				{/* Table Body - Placeholder */}
				<div className="flex flex-col items-center justify-center min-h-[200px] text-center text-gray-500">
					<Icon style={{ fontSize: 60 }} className="text-gray-300 mb-4">web_asset_off</Icon>
					<Typography variant="body1">
						No data available
					</Typography>
				</div>
			</Paper>
		</div>
	);
}

export default RealtimePagesView; 