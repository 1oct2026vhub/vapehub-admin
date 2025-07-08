import { Grid, Paper, Typography } from '@mui/material';
import { InventorySummary } from '@/services/apiInventory';

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
}

const InventoryHeader: React.FC<InventoryHeaderProps> = ({ summary }) => {
    return (
        <div className="mb-8">
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
        </div>
    );
};

export default InventoryHeader; 