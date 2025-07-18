import { Grid, Paper, Typography } from '@mui/material';
import { InventorySummary } from '@/services/apiInventory';
import AppButton from '@/components/Shared/AppButton';
import { useState } from 'react';
import BulkUpdateStockModal from './BulkUpdateStockModal';

interface StatCardProps {
    title: string;
    value: number | string;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, colorClass }) => (
    <Paper className="p-4 text-center" sx={{backgroundColor: 'white'}}>
        <Typography variant="h6" className={colorClass}>{value}</Typography>
        <Typography variant="subtitle1">{title}</Typography>
    </Paper>
);


interface InventoryHeaderProps {
    summary: InventorySummary;
    onRefresh: () => void;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({ summary, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" component="h1" className="text-xl font-semibold">Inventory Dashboard</Typography>
                <AppButton
                    label="Bulk Update"
                    onClick={() => setIsModalOpen(true)}
                />
            </div>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Total Inventory" value={summary.totalInventory} colorClass="text-blue-500" />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="In Stock" value={summary.inStock} colorClass="text-green-500" />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Out of Stock" value={summary.outOfStock} colorClass="text-red-500" />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Low Stock" value={summary.lowStock} colorClass="text-orange-500" />
                </Grid>
                 <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Sales (Last Month)" value={summary.totalSalesLastMonth} colorClass="text-purple-500" />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Revenue (Last Month)" value={`$${summary.totalRevenueLastMonth.toFixed(2)}`} colorClass="text-indigo-500" />
                </Grid>
            </Grid>
            <BulkUpdateStockModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    onRefresh();
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

export default InventoryHeader; 