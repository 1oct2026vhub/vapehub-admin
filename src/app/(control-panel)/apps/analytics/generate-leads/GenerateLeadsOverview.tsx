import React, { useState } from 'react';
import {
	Paper,
	Typography,
	Grid,
	Divider,
	Icon,
	IconButton,
	Tooltip,
	Button,
	Tabs,
	Tab,
	Box,
    Link
} from '@mui/material';

// Placeholder for card header icons
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

// Placeholder for Donut Chart
const DonutChartPlaceholder = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 150, width: 150, borderRadius: '50%', border: '10px solid', borderColor: 'grey.300', margin: 'auto' }}>
        <Typography variant="caption" color="text.secondary">No data available</Typography>
    </Box>
);

// Placeholder for Line Graph
const LineGraphPlaceholder = () => (
    <Box sx={{ height: 150, bgcolor: 'grey.100', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', p: 1, border: '1px dashed', borderColor: 'grey.300', position: 'relative' }}>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '2px solid', borderColor: 'primary.main'}} />
        <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, left: '10%'}}>06 Apr</Typography>
        <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, left: '40%'}}>13</Typography>
        <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, left: '70%'}}>20</Typography>
        <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, right: '5%'}}>27</Typography>
    </Box>
);

// Placeholder for Cohort Table
const CohortTablePlaceholder = () => (
    <Box>
        <Grid container spacing={1} className="text-xs text-gray-600 mb-1">
            {['Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(week => (
                <Grid item xs={2} key={week} className="text-center">{week}</Grid>
            ))}
        </Grid>
        {[ 'All Users', 'Mar 16 - Mar 22', 'Mar 23 - Mar 29', 'Mar 30 - Apr 5'].map(row => (
            <Grid container spacing={1} key={row} alignItems="center" className="mb-1">
                <Grid item xs={3}><Typography variant="caption">{row}</Typography></Grid>
                {Array(6).fill(0).map((_, i) => (
                    <Grid item xs={1.5} key={i}>
                        <Box sx={{ bgcolor: row === 'All Users' ? 'transparent' : 'grey.200', height: 20, textAlign: 'center' }}>
                            {row === 'All Users' && <Typography variant="caption">0.0%</Typography>}
                        </Box>
                    </Grid>
                ))}
            </Grid>
        ))}
    </Box>
);

function GenerateLeadsOverview() {
	const [userTabIndex, setUserTabIndex] = useState(0);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setUserTabIndex(newValue);
	};

	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<Typography variant="h5" component="h1" className="font-semibold mb-2 sm:mb-0">
					Generate leads overview
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
                {/* New/Returning Users Card */}
                <Grid item xs={12} md={6} lg={5}>
                    <Paper elevation={2} className="p-4 h-full flex flex-col">
                        <Tabs value={userTabIndex} onChange={handleTabChange} variant="standard" sx={{ minHeight: 'auto', mb: 2 }}>
                            <Tab label={<span>New users <Tooltip title="Help"><Icon fontSize="inherit" className="ml-1 align-middle text-gray-400">help_outline</Icon></Tooltip></span>} sx={{minHeight:'auto', p:1}} />
                            <Tab label={<span>Returning users <Tooltip title="Help"><Icon fontSize="inherit" className="ml-1 align-middle text-gray-400">help_outline</Icon></Tooltip></span>} sx={{minHeight:'auto', p:1}} />
                        </Tabs>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                            <Typography variant="h3" component="div" className="font-bold">0</Typography>
                            <Typography variant="h3" component="div" className="font-bold">0</Typography>
                        </Box>
                        <LineGraphPlaceholder />
                        <CardHeaderActions /> {/* Added top-right corner */}
                    </Paper>
                </Grid>

                {/* Key Events Card */}
                <Grid item xs={12} md={6} lg={3}>
                    <Paper elevation={2} className="p-4 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <Typography variant="subtitle1" className="font-semibold">Key events <span className="font-normal">by Platform</span></Typography>
                                <CardHeaderActions />
                            </div>
                            <DonutChartPlaceholder />
                        </div>
                        <Link href="#" underline="hover" className="text-right mt-4 block">
                            View platforms <Icon fontSize="inherit" className="align-middle">arrow_forward</Icon>
                        </Link>
                    </Paper>
                </Grid>

                {/* New Users Card */}
                <Grid item xs={12} md={6} lg={4}> {/* Adjusted size */}
                    <Paper elevation={2} className="p-4 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <Typography variant="subtitle1" className="font-semibold">New users <span className="font-normal">by First user primary channel group...</span></Typography>
                                <CardHeaderActions />
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase mb-2 border-b pb-1">
                                <span>First user primary cha...</span>
                                <span>New users</span>
                            </div>
                            <Box sx={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No data available</Typography>
                            </Box>
                        </div>
                        <Link href="#" underline="hover" className="text-right mt-4 block">
                            View user acquisition <Icon fontSize="inherit" className="align-middle">arrow_forward</Icon>
                        </Link>
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Row Cards */}
            <Grid container spacing={3}>
                {/* User Activity Card */}
                <Grid item xs={12} md={6} lg={5}>
                    <Paper elevation={2} className="p-4 h-full">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <Typography variant="subtitle1" className="font-semibold">User activity <span className="font-normal">by cohort</span></Typography>
                                <Typography variant="caption" color="text.secondary">Based on device data only</Typography>
                             </div>
                            <CardHeaderActions />
                        </div>
                       <CohortTablePlaceholder />
                    </Paper>
                </Grid>

                {/* Placeholder Cards */}
                {[
                    { title: 'Active users* by Audience name', col1: 'Audience Name', col2: 'Active Users' },
                    { title: 'Active users* by City', col1: 'City', col2: 'Active Users' },
                    { title: 'Sessions* by Session manual so...', col1: 'Session Manual...', col2: 'Sessions' },
                ].map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={7/3} key={index}> {/* Approximate equal width */}
                        <Paper elevation={2} className="p-4 h-full">
                            <div className="flex justify-between items-start mb-2">
                                <Typography variant="subtitle1" className="font-semibold">{card.title}</Typography>
                                <CardHeaderActions />
                            </div>
                            <div className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase mb-2 border-b pb-1">
                                <span>{card.col1}</span>
                                <span>{card.col2}</span>
                            </div>
                            <Box sx={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="body2" color="text.secondary">No data available</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}

            </Grid>

		</div>
	);
}

export default GenerateLeadsOverview; 