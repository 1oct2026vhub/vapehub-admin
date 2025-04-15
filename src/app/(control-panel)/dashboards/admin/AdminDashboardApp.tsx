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
import { formatPounds } from "@/utils/actions";
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
  const [chartTabValue, setChartTabValue] = useState(0);
  const [activityTabValue, setActivityTabValue] = useState(0);

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

  const handleChartTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setChartTabValue(newValue);
  };

  const handleActivityTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActivityTabValue(newValue);
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
            value={formatPounds(stats?.sales.today?.replace(/[^\d.-]/g, '') || 0)}
            icon="sales"
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Weekly Sales"
            value={formatPounds(stats?.sales.weekly?.replace(/[^\d.-]/g, '') || 0)}
            icon="sales"
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Monthly Sales"
            value={formatPounds(stats?.sales.monthly?.replace(/[^\d.-]/g, '') || 0)}
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

      {/* Combined Status Sections */}
      <Grid container spacing={2} sx={{ px: 3, pb: 3 }}>
        {/* Product Inventory Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '240px' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#333' }}>
              Product Variant Inventory Status
            </Typography>
            <Box sx={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center' }}>
              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#E8F5E9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="#2E7D32" fontWeight="600">
                        {stats?.products.totalProducts || 0}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                      Total Products
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#E3F2FD",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="#1976D2" fontWeight="600">
                        {stats?.products.inStock || 0}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                      In Stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#E8F5E9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="#388E3C" fontWeight="600">
                        {stats?.products.healthyStock || 0}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                      Healthy Stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#FFF3E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="#FF9800" fontWeight="600">
                        {stats?.products.lowStock || 0}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                      Low Stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#FFEBEE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="#D32F2F" fontWeight="600">
                        {stats?.products.outOfStock || 0}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                      Out of Stock
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: '#fff',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        backgroundColor: "#FCE4EC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" color="#C2185B" fontWeight="600">
                        {stats?.products.outOfStockStatus || 0}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                     Out Of Stock Status    
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Orders Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '240px' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#333' }}>
              Orders Status
            </Typography>
            <Box sx={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center' }}>
              <Grid container spacing={1.5}>
                {stats?.orders.map((order, index) => (
                  <Grid
                    item
                    xs={6}
                    key={`order-${order.status || "unknown"}-${index}`}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: '#fff',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                        minHeight: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography 
                        color="textSecondary"
                        sx={{ 
                          fontSize: '0.813rem',
                          mb: 0.5
                        }}
                      >
                        {order.status
                          ? order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)
                          : "Unknown"}
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          color: '#333',
                          fontSize: '1.125rem'
                        }}
                      >
                        {order.count}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* User Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '240px' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#333' }}>
              User Status
            </Typography>
            <Box sx={{ height: 'calc(100% - 50px)', overflow: 'auto' }}>
              {stats?.users.map((userGroup, index) => (
                <Box 
                  key={`user-group-${userGroup.role}`}
                  sx={{ 
                    mb: 2,
                    pb: 2,
                    borderBottom: index < stats.users.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  {/* Role Header with Total Count */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pb: 0.5
                  }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 500,
                        color: '#555',
                        textTransform: 'capitalize'
                      }}
                    >
                      {userGroup.role.replace('_', ' ')}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#333'
                      }}
                    >
                      {userGroup.count}
                    </Typography>
                  </Box>

                  {/* Status Metrics Grid */}
                  <Grid container spacing={1}>
                    {/* Active Users */}
                    {Number(userGroup.active_count) > 0 && (
                      <Grid item xs={6}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>
                            Active
                          </Typography>
                          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: '#4CAF50', lineHeight: 1.2 }}>
                            {userGroup.active_count}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Blocked Users */}
                    {Number(userGroup.blocked_count) > 0 && (
                      <Grid item xs={6}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>
                            Blocked
                          </Typography>
                          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: '#F44336', lineHeight: 1.2 }}>
                            {userGroup.blocked_count}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Verified Customers - only for customer role */}
                    {userGroup.role === 'customer' && Number(userGroup.verified_customer_count) > 0 && (
                      <Grid item xs={6}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>
                            Verified
                          </Typography>
                          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: '#2196F3', lineHeight: 1.2 }}>
                            {userGroup.verified_customer_count}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Unverified Customers - only for customer role */}
                    {userGroup.role === 'customer' && Number(userGroup.unverified_customer_count) > 0 && (
                      <Grid item xs={6}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>
                            Unverified
                          </Typography>
                          <Typography sx={{ fontSize: '1.5rem', fontWeight: 500, color: '#FF9800', lineHeight: 1.2 }}>
                            {userGroup.unverified_customer_count}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
            </Box>
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

      {/* Charts Section with Tabs */}
      <Box sx={{ p: 3 }}>
        <Paper sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={chartTabValue}
            onChange={handleChartTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Sales" />
            <Tab label="New Users" />
            <Tab label="Transactions" />
          </Tabs>
          
          <Box p={3}>
            {chartTabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Sales
                </Typography>
                <Box sx={{ height: 400 }}>
                  <SalesChart data={salesData} period={chartPeriod} />
                </Box>
              </Box>
            )}
            {chartTabValue === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  New Users
                </Typography>
                <Box sx={{ height: 400 }}>
                  <UserGrowthChart data={userData} period={chartPeriod} />
                </Box>
              </Box>
            )}
            {chartTabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Transactions
                </Typography>
                <Box sx={{ height: 400 }}>
                  <TransactionChart data={transactionData} period={chartPeriod} />
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Recent Activities Section */}
      <Box sx={{ p: 3 }}>
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={activityTabValue}
            onChange={handleActivityTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Recent Orders" />
            <Tab label="Recent Transactions" />
          </Tabs>
          <Divider />
          <Box p={2}>
            {activityTabValue === 0 && (
              <RecentOrdersTable orders={stats?.recentOrders || []} />
            )}
            {activityTabValue === 1 && (
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
