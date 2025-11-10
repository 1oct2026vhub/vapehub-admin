'use client';
import { useFetch } from "@/hooks/useFetch";
import { getSubscriberStats } from '@/services/apiMailSubscriptionSettings';
import { Card, CardContent, Grid, Typography, CircularProgress, Paper } from '@mui/material';
import { motion } from 'framer-motion';

function SubscriberStats() {
	const { data, error, isLoading } = useFetch(
		'subscriberStats',
		getSubscriberStats,
	);

	const container = {
		show: {
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	if (isLoading) {
		return <CircularProgress />;
	}

	if (error || !data?.success) {
		return <Typography>Error loading stats.</Typography>;
	}

	const stats = data.data;

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5"
		>
			<motion.div variants={item}>
				<Paper className="flex flex-col flex-auto items-center justify-center py-4 shadow rounded-2xl overflow-hidden">
					<div className="flex items-start justify-between">
						<div className="text-lg font-medium tracking-tight leading-6">Total Subscribers</div>
					</div>
					<div className="mt-4">
						<Typography
							className="text-3xl font-semibold tracking-tight leading-tight"
							color="text.secondary"
						>
							{stats.totalSubscribers}
						</Typography>
					</div>
				</Paper>
			</motion.div>
			<motion.div variants={item}>
				<Paper className="flex flex-col flex-auto items-center py-4 justify-center shadow rounded-2xl overflow-hidden">
					<div className="flex items-start justify-between">
						<div className="text-lg font-medium tracking-tight leading-6">New Subscribers (24h)</div>
					</div>
					<div className="mt-4">
						<Typography
							className="text-3xl font-semibold tracking-tight leading-tight"
							color="text.secondary"
						>
							{stats.recentSubscribers}
						</Typography>
					</div>
				</Paper>
			</motion.div>
			<motion.div variants={item}>
				<Paper className="flex flex-col flex-auto items-center py-4 justify-center shadow rounded-2xl overflow-hidden">
					<div className="flex items-start justify-between">
						<div className="text-lg font-medium tracking-tight leading-6">Unsubscribers</div>
					</div>
					<div className="mt-4">
						<Typography
							className="text-3xl font-semibold tracking-tight leading-tight"
							color="text.secondary"
						>
							{stats.unsubscribersCount || 0}
						</Typography>
					</div>
				</Paper>
			</motion.div>
			{Object.entries(stats.frequencyStats).map(([freq, count]) => (
				<motion.div
					variants={item}
					key={freq}
				>
					<Paper className="flex flex-col flex-auto items-center justify-center py-4 shadow rounded-2xl overflow-hidden">
						<div className="flex items-start justify-between">
							<div className="text-lg font-medium tracking-tight leading-6 capitalize">
								{freq}
							</div>
						</div>
						<div className="mt-4">
							<Typography
								className="text-3xl font-semibold tracking-tight leading-tight"
								color="text.secondary"
							>
								{count as number}
							</Typography>
						</div>
					</Paper>
				</motion.div>
			))}
		</motion.div>
	);
}

export default SubscriberStats; 