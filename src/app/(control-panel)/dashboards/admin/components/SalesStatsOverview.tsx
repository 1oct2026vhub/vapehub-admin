import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import { getSalesStatsOverview, SalesStatsOverview as SalesStatsOverviewData, SalesStatsPeriod } from '@/services/apiDashboard';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  percentChange: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, percentChange }) => {
  const isPositive = parseFloat(percentChange) >= 0;
  const changeColor = isPositive ? 'success.main' : 'error.main';

  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      <Typography variant="h4" component="div" sx={{ my: 1, fontWeight: 600 }}>{value}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: changeColor }}>
        {isPositive ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
        <Typography variant="body1" component="span" sx={{ ml: 0.5 }}>
          {`${parseFloat(percentChange).toFixed(2)}%`}
        </Typography>
      </Box>
    </Paper>
  );
};


const SalesStatsOverview = () => {
  const [data, setData] = useState<SalesStatsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const overviewData = await getSalesStatsOverview();
        setData(overviewData);
      } catch (error) {
        console.error("Error fetching sales stats overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const renderStats = (periodData: SalesStatsPeriod) => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={4}>
        <StatCard title="Total Sales" value={periodData.totalSales} percentChange={periodData.percentChange.totalSales} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard title="Total Orders" value={periodData.totalOrders} percentChange={periodData.percentChange.totalOrders} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <StatCard title="New Users" value={periodData.newUsers} percentChange={periodData.percentChange.newUsers} />
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 150 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Typography>No data available.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Today" />
          <Tab label="This Week" />
          <Tab label="This Month" />
        </Tabs>
      <TabPanel value={tabValue} index={0}>
        {renderStats(data.today)}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderStats(data.week)}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderStats(data.month)}
      </TabPanel>
    </Paper>
  );
};

export default SalesStatsOverview; 