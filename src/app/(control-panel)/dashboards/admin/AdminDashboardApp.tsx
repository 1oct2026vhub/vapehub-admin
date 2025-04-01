"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Tab,
  Tabs,
  SelectChangeEvent,
} from "@mui/material";
import AdminDashboardHeader from "./AdminDashboardHeader";
import StatisticsCard from "./components/StatisticsCard";
import SalesChart from "./components/SalesChart";
import UserGrowthChart from "./components/UserGrowthChart";
import TransactionChart from "./components/TransactionChart";
import RecentOrdersTable from "./components/RecentOrdersTable";
import RecentTransactionsTable from "./components/RecentTransactionsTable";
import {
  getDashboardStats,
  getSalesChartData,
  getUserGrowthChartData,
  getTransactionChartData,
  type DashboardStats,
  type SalesChartData,
  type UserGrowthChartData,
  type TransactionChartData,
} from "@/services/apiDashboard";
import FuseLoading from "@fuse/core/FuseLoading";

type ChartPeriod = "daily" | "weekly" | "monthly";

const AdminDashboardApp = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [userData, setUserData] = useState<UserGrowthChartData[]>([]);
  const [transactionData, setTransactionData] = useState<
    TransactionChartData[]
  >([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("weekly");
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsData = await getDashboardStats();
        const sales = await getSalesChartData(chartPeriod);
        const users = await getUserGrowthChartData(chartPeriod);
        const transactions = await getTransactionChartData(chartPeriod);

        setStats(statsData);
        setSalesData(sales);
        setUserData(users);
        setTransactionData(transactions);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [chartPeriod]);

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setChartPeriod(event.target.value as ChartPeriod);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <FuseLoading />
      </Box>
    );
  }

  return (
    <Box className="dashboard-container">
      <AdminDashboardHeader />

      {/* Statistics Section */}
      <Grid
        container
        spacing={3}
        className="statistics-container"
        sx={{ mt: 2, mb: 4, p: 3 }}
      >
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Today's Sales"
            value={stats?.sales.today || "$0"}
            icon="sales"
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Weekly Sales"
            value={stats?.sales.weekly || "$0"}
            icon="sales"
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Monthly Sales"
            value={stats?.sales.monthly || "$0"}
            icon="sales"
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Total Products"
            value={stats?.products.totalProducts.toString() || "0"}
            icon="products"
            color="#FF9800"
          />
        </Grid>
        {/* <Grid item xs={12} sm={6} md={4}>
          <StatisticsCard
            title="Low Stock Products"
            value={stats?.products.lowStock.toString() || "0"}
            icon="lowStock"
            color="#F44336"
            subtitle="Products below threshold level"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatisticsCard
            title="Out of Stock Products"
            value={stats?.products.outOfStock.toString() || "0"}
            icon="outOfStock"
            color="#795548"
            subtitle="Products that need restocking"
          />
        </Grid> */}
      </Grid>

      {/* Product Inventory Status Section */}
      <Box
        sx={{
          p: 3,
        }}
      >
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Product Inventory Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  p: 2,
                }}
              >
                <Box
                  sx={{ position: "relative", display: "inline-flex", mb: 1 }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      backgroundColor: "#E8F5E9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" color="#2E7D32" fontWeight="bold">
                      {stats?.products.totalProducts || 0}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" align="center">
                  Total Products
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  p: 2,
                }}
              >
                <Box
                  sx={{ position: "relative", display: "inline-flex", mb: 1 }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      backgroundColor: "#FFF3E0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" color="#FF9800" fontWeight="bold">
                      {stats?.products.lowStock || 0}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" align="center">
                  Low Stock
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  {Number(stats?.products.lowStock || 0) > 0
                    ? "Needs attention"
                    : "Inventory level good"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  p: 2,
                }}
              >
                <Box
                  sx={{ position: "relative", display: "inline-flex", mb: 1 }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      backgroundColor: "#FFEBEE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="h4" color="#D32F2F" fontWeight="bold">
                      {stats?.products.outOfStock || 0}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" align="center">
                  Out of Stock
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                >
                  {Number(stats?.products.outOfStock || 0) > 0
                    ? "Urgent restock required"
                    : "All products in stock"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Order & User Status Section */}
      <Grid
        container
        spacing={3}
        className="status-container"
        sx={{ mb: 4, p: 3 }}
      >
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Orders Status
            </Typography>
            <Grid container spacing={2}>
              {stats?.orders.map((order, index) => (
                <Grid
                  item
                  xs={6}
                  key={`order-${order.status || "unknown"}-${index}`}
                >
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {order.status
                          ? order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)
                          : "Unknown"}
                      </Typography>
                      <Typography variant="h5">{order.count}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              User Status
            </Typography>
            <Grid container spacing={2}>
              {stats?.users.map((user, index) => (
                <Grid
                  item
                  xs={6}
                  key={`user-${user.role || "unknown"}-${index}`}
                >
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {user.role
                          ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)
                          : "Unknown"}
                      </Typography>
                      <Typography variant="h5">{user.count}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Chart Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{ p: 3 }}
      >
        <Typography variant="h5">Performance Charts</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="period-select-label">Period</InputLabel>
          <Select
            labelId="period-select-label"
            value={chartPeriod}
            onChange={handlePeriodChange}
            label="Period"
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Charts Section */}
      <Grid
        container
        spacing={3}
        className="charts-container"
        sx={{ mb: 4, p: 3 }}
      >
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Sales
            </Typography>
            <SalesChart data={salesData} period={chartPeriod} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              New Users
            </Typography>
            <UserGrowthChart data={userData} period={chartPeriod} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Transactions
            </Typography>
            <TransactionChart data={transactionData} period={chartPeriod} />
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities Section */}
      <Box sx={{ p: 3 }}>
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Recent Orders" />
            <Tab label="Recent Transactions" />
          </Tabs>
          <Divider />
          <Box p={2}>
            {tabValue === 0 && (
              <RecentOrdersTable orders={stats?.recentOrders || []} />
            )}
            {tabValue === 1 && (
              <RecentTransactionsTable
                transactions={stats?.recentTransactions || []}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboardApp;
