// import Paper from '@mui/material/Paper';
// import { lighten, useTheme } from '@mui/material/styles';
// import Typography from '@mui/material/Typography';
// import { memo, useEffect, useState } from 'react';
// import Box from '@mui/material/Box';
// import { ApexOptions } from 'apexcharts';
// import FuseLoading from '@fuse/core/FuseLoading';
// import _ from 'lodash';
// import FuseTabs from 'src/components/tabs/FuseTabs';
// import FuseTab from 'src/components/tabs/FuseTab';
// import GithubIssuesDataType from './types/GithubIssuesDataType';
// import { useGetProjectDashboardWidgetsQuery } from '../../../ProjectDashboardApi';
// import dynamic from 'next/dynamic';
// const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// /**
//  * The GithubIssuesWidget widget.
//  */
// function GithubIssuesWidget() {
// 	const theme = useTheme();
// 	const [awaitRender, setAwaitRender] = useState(true);
// 	const [tabValue, setTabValue] = useState(0);
// 	const { data: widgets, isLoading } = useGetProjectDashboardWidgetsQuery();
// 	const widget = widgets?.githubIssues as GithubIssuesDataType;
// 	const { overview, series, ranges, labels } = widget;
// 	const currentRange = Object.keys(ranges)[tabValue];

// 	const chartOptions: ApexOptions = {
// 		chart: {
// 			fontFamily: 'inherit',
// 			foreColor: 'inherit',
// 			height: '100%',
// 			type: 'line',
// 			toolbar: {
// 				show: false
// 			},
// 			zoom: {
// 				enabled: false
// 			}
// 		},
// 		colors: [theme.palette.primary.main, theme.palette.secondary.main],
// 		labels,
// 		dataLabels: {
// 			enabled: true,
// 			enabledOnSeries: [0],
// 			background: {
// 				borderWidth: 0
// 			}
// 		},
// 		grid: {
// 			borderColor: theme.palette.divider
// 		},
// 		legend: {
// 			show: false
// 		},
// 		plotOptions: {
// 			bar: {
// 				columnWidth: '50%'
// 			}
// 		},
// 		states: {
// 			hover: {
// 				filter: {
// 					type: 'darken'
// 				}
// 			}
// 		},
// 		stroke: {
// 			width: [3, 0]
// 		},
// 		tooltip: {
// 			followCursor: true,
// 			theme: theme.palette.mode
// 		},
// 		xaxis: {
// 			axisBorder: {
// 				show: false
// 			},
// 			axisTicks: {
// 				color: theme.palette.divider
// 			},
// 			labels: {
// 				style: {
// 					colors: theme.palette.text.secondary
// 				}
// 			},
// 			tooltip: {
// 				enabled: false
// 			}
// 		},
// 		yaxis: {
// 			labels: {
// 				offsetX: -16,
// 				style: {
// 					colors: theme.palette.text.secondary
// 				}
// 			}
// 		}
// 	};

// 	useEffect(() => {
// 		setAwaitRender(false);
// 	}, []);

// 	if (isLoading) {
// 		return <FuseLoading />;
// 	}

// 	if (!widget) {
// 		return null;
// 	}

// 	if (awaitRender) {
// 		return null;
// 	}

// 	return (
// 		<Paper className="flex flex-col flex-auto p-6 shadow-sm rounded-xl overflow-hidden">
// 			<div className="flex flex-col sm:flex-row items-start justify-between">
// 				<Typography className="text-xl font-medium tracking-tight leading-6 truncate">
// 					Github Issues Summary
// 				</Typography>
// 				<div className="mt-3 sm:mt-0">
// 					<FuseTabs
// 						value={tabValue}
// 						onChange={(_ev, value: number) => setTabValue(value)}
// 					>
// 						{Object.entries(ranges).map(([key, label], index) => (
// 							<FuseTab
// 								key={key}
// 								value={index}
// 								label={label}
// 							/>
// 						))}
// 					</FuseTabs>
// 				</div>
// 			</div>
// 			<div className="grid grid-cols-1 lg:grid-cols-2 grid-flow-row gap-6 w-full mt-8 sm:mt-4">
// 				<div className="flex flex-col flex-auto">
// 					<Typography
// 						className="font-medium"
// 						color="text.secondary"
// 					>
// 						New vs. Closed
// 					</Typography>
// 					<div className="flex flex-col flex-auto">
// 						<ReactApexChart
// 							className="flex-auto w-full"
// 							options={chartOptions}
// 							series={_.cloneDeep(series[currentRange])}
// 							height={320}
// 						/>
// 					</div>
// 				</div>
// 				<div className="flex flex-col">
// 					<Typography
// 						className="font-medium"
// 						color="text.secondary"
// 					>
// 						Overview
// 					</Typography>
// 					<div className="flex-auto grid grid-cols-4 gap-4 mt-6">
// 						<div className="col-span-2 flex flex-col items-center justify-center py-8 px-1 rounded-xl bg-indigo-50 text-indigo-800">
// 							<Typography className="text-5xl sm:text-7xl font-semibold leading-none tracking-tight">
// 								{overview[currentRange]['new-issues']}
// 							</Typography>
// 							<Typography className="mt-1 text-sm sm:text-lg font-medium">New Issues</Typography>
// 						</div>
// 						<div className="col-span-2 flex flex-col items-center justify-center py-8 px-1 rounded-xl bg-green-50 text-green-800">
// 							<Typography className="text-5xl sm:text-7xl font-semibold leading-none tracking-tight">
// 								{overview[currentRange]['closed-issues']}
// 							</Typography>
// 							<Typography className="mt-1 text-sm sm:text-lg font-medium">Closed</Typography>
// 						</div>
// 						<Box
// 							sx={[
// 								(_theme) =>
// 									_theme.palette.mode === 'light'
// 										? {
// 												backgroundColor: lighten(_theme.palette.background.default, 0.4)
// 											}
// 										: {
// 												backgroundColor: lighten(_theme.palette.background.default, 0.02)
// 											}
// 							]}
// 							className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-8 px-1 rounded-xl"
// 						>
// 							<Typography className="text-5xl font-semibold leading-none tracking-tight">
// 								{overview[currentRange].fixed}
// 							</Typography>
// 							<Typography className="mt-1 text-sm font-medium text-center">Fixed</Typography>
// 						</Box>
// 						<Box
// 							sx={[
// 								(theme) =>
// 									theme.palette.mode === 'light'
// 										? {
// 												backgroundColor: lighten(theme.palette.background.default, 0.4)
// 											}
// 										: {
// 												backgroundColor: lighten(theme.palette.background.default, 0.02)
// 											}
// 							]}
// 							className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-8 px-1 rounded-xl"
// 						>
// 							<Typography className="text-5xl font-semibold leading-none tracking-tight">
// 								{overview[currentRange]['wont-fix']}
// 							</Typography>
// 							<Typography className="mt-1 text-sm font-medium text-center">Won't Fix</Typography>
// 						</Box>
// 						<Box
// 							sx={[
// 								(_theme) =>
// 									_theme.palette.mode === 'light'
// 										? {
// 												backgroundColor: lighten(_theme.palette.background.default, 0.4)
// 											}
// 										: {
// 												backgroundColor: lighten(_theme.palette.background.default, 0.02)
// 											}
// 							]}
// 							className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-8 px-1 rounded-xl"
// 						>
// 							<Typography className="text-5xl font-semibold leading-none tracking-tight">
// 								{overview[currentRange]['re-opened']}
// 							</Typography>
// 							<Typography className="mt-1 text-sm font-medium text-center">Re-opened</Typography>
// 						</Box>
// 						<Box
// 							sx={[
// 								(_theme) =>
// 									_theme.palette.mode === 'light'
// 										? {
// 												backgroundColor: lighten(_theme.palette.background.default, 0.4)
// 											}
// 										: {
// 												backgroundColor: lighten(_theme.palette.background.default, 0.02)
// 											}
// 							]}
// 							className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-8 px-1 rounded-xl"
// 						>
// 							<Typography className="text-5xl font-semibold leading-none tracking-tight">
// 								{overview[currentRange]['needs-triage']}
// 							</Typography>
// 							<Typography className="mt-1 text-sm font-medium text-center">Needs Triage</Typography>
// 						</Box>
// 					</div>
// 				</div>
// 			</div>
// 		</Paper>
// 	);
// }

// export default memo(GithubIssuesWidget);



import Paper from '@mui/material/Paper';
import { lighten, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { memo, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { ApexOptions } from 'apexcharts';
import FuseLoading from '@fuse/core/FuseLoading';
import _ from 'lodash';
import FuseTabs from 'src/components/tabs/FuseTabs';
import FuseTab from 'src/components/tabs/FuseTab';
import dynamic from 'next/dynamic';
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const dummyWidget = {
    githubIssues: {
        overview: {
            'last-7-days': {
                'new-issues': 25,
                'closed-issues': 18,
                fixed: 12,
                'wont-fix': 3,
                're-opened': 2,
                'needs-triage': 5
            },
            'last-30-days': {
                'new-issues': 100,
                'closed-issues': 80,
                fixed: 60,
                'wont-fix': 10,
                're-opened': 8,
                'needs-triage': 15
            }
        },
        series: {
            'last-7-days': [
                {
                    name: 'New Issues',
                    data: [5, 7, 4, 6, 5, 8, 10]
                },
                {
                    name: 'Closed Issues',
                    data: [4, 6, 3, 5, 4, 7, 9]
                }
            ],
            'last-30-days': [
                {
                    name: 'New Issues',
                    data: [10, 15, 12, 18, 14, 20, 25]
                },
                {
                    name: 'Closed Issues',
                    data: [8, 12, 10, 16, 12, 18, 22]
                }
            ]
        },
        ranges: {
            'last-7-days': 'Last 7 Days',
            'last-30-days': 'Last 30 Days'
        },
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
    }
};

function GithubIssuesWidget() {
    const theme = useTheme();
    const [awaitRender, setAwaitRender] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const isLoading = false;
    const widget = dummyWidget.githubIssues;
    const { overview, series, ranges, labels } = widget;
    const currentRange = Object.keys(ranges)[tabValue];

    const chartOptions: ApexOptions = {
        chart: {
            fontFamily: 'inherit',
            foreColor: 'inherit',
            height: '100%',
            type: 'line',
            toolbar: {
                show: false
            },
            zoom: {
                enabled: false
            }
        },
        colors: [theme.palette.primary.main, theme.palette.secondary.main],
        labels,
        dataLabels: {
            enabled: true,
            enabledOnSeries: [0],
            background: {
                borderWidth: 0
            }
        },
        grid: {
            borderColor: theme.palette.divider
        },
        legend: {
            show: false
        },
        plotOptions: {
            bar: {
                columnWidth: '50%'
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'darken'
                }
            }
        },
        stroke: {
            width: [3, 0]
        },
        tooltip: {
            followCursor: true,
            theme: theme.palette.mode
        },
        xaxis: {
            axisBorder: {
                show: false
            },
            axisTicks: {
                color: theme.palette.divider
            },
            labels: {
                style: {
                    colors: theme.palette.text.secondary
                }
            },
            tooltip: {
                enabled: false
            }
        },
        yaxis: {
            labels: {
                offsetX: -16,
                style: {
                    colors: theme.palette.text.secondary
                }
            }
        }
    };

    useEffect(() => {
        setAwaitRender(false);
    }, []);

    if (isLoading) {
        return <FuseLoading />;
    }

    if (!widget) {
        return null;
    }

    if (awaitRender) {
        return null;
    }

    return (
        <Paper className="flex flex-col flex-auto p-6 shadow-sm rounded-xl overflow-hidden">
            <Typography className="text-xl font-medium tracking-tight leading-6 truncate">
                Github Issues Summary
            </Typography>
            <FuseTabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
                {Object.entries(ranges).map(([key, label], index) => (
                    <FuseTab key={key} value={index} label={label} />
                ))}
            </FuseTabs>
            <ReactApexChart
                options={chartOptions}
                series={_.cloneDeep(series[currentRange])}
                height={320}
            />
        </Paper>
    );
}

export default memo(GithubIssuesWidget);
