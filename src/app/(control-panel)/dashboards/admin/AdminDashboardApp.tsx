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
  TextField,
  Autocomplete,
} from "@mui/material";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DateRange } from '@mui/x-date-pickers-pro';
// import { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import AdminDashboardHeader from "./AdminDashboardHeader";
import StatisticsCard from "./components/StatisticsCard";
import SalesChart from "./components/SalesChart";
import UserGrowthChart from "./components/UserGrowthChart";
import TransactionChart from "./components/TransactionChart";
import RecentOrdersTable from "./components/RecentOrdersTable";
import RecentTransactionsTable from "./components/RecentTransactionsTable";
import { formatStatusText } from "@/utils/actions";
import {
  getDashboardStats,
  getSalesChartData,
  getUserGrowthChartData,
  getTransactionChartData,
  type DashboardStats,
  type SalesChartData,
  type UserGrowthChartData,
  type TransactionChartData,
  type SalesSummary as SalesSummaryData,
} from "@/services/apiDashboard";
import { listProducts } from "@/services/apiProduct";
import { useDebounce } from "@/hooks/useDebounce";
import FuseLoading from "@fuse/core/FuseLoading";
import SalesSummary from "./components/SalesSummary";
import SalesStatsOverview from "./components/SalesStatsOverview";

type ChartPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

// Helper function to get color for status count
const getStatusCountColor = (status: string | undefined | null): string => {
  const lowerStatus = status?.toLowerCase();
  switch (lowerStatus) {
    case 'pending': return '#FF9800'; // Orange
    case 'fail': return '#F44336';    // Red
    case 'cancel': return '#9E9E9E';    // Grey
    case 'processing': return '#2196F3'; // Blue
    case 'shipped': return '#4CAF50';    // Green
    case 'completed': return '#673AB7';   // Purple
    case 'delivered': return '#009688';   // Teal
    case 'return_requested': return '#FF5722'; // Deep Orange
    case 'return_received': return '#795548';  // Brown
    case 'out_for_delivery': return '#03A9F4'; // Light Blue
    case 'packed': return '#8BC34A';    // Light Green
    default: return '#333';           // Default dark color
  }
};

const AdminDashboardApp = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [userData, setUserData] = useState<UserGrowthChartData[]>([]);
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);

  const [transactionData, setTransactionData] = useState<
    TransactionChartData[]
  >([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("weekly");
  const [loading, setLoading] = useState(true);
  const [chartTabValue, setChartTabValue] = useState(0);
  const [activityTabValue, setActivityTabValue] = useState(0);
  const [salesSummary, setSalesSummary] = useState<SalesSummaryData | null>(null);

  // New states for product filter and custom dates
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  // const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);
  
  const debouncedProductSearch = useDebounce(productSearch, 500);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await listProducts({
          keyword: debouncedProductSearch,
          limit: 50,
          sort_by: 'id',
          order: 'DESC'
        });
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [debouncedProductSearch]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Prevent calling API if custom date range is not fully selected
        if (chartPeriod === 'custom' && (!startDate || !endDate)) {
          setSalesData([]); // Clear previous data
          // setSalesSummary(null);
          // setUserData([]);
          // setTransactionData([]);
          return;
        }

        const statsData = await getDashboardStats();
        const salesResponse = await getSalesChartData(chartPeriod, {
          productId: selectedProduct?.id,
        startDate: startDate?.format('YYYY-MM-DD'),
          endDate: endDate?.format('YYYY-MM-DD'),

        });
        const users = await getUserGrowthChartData(chartPeriod, {
        startDate: startDate?.format('YYYY-MM-DD'),
          endDate: endDate?.format('YYYY-MM-DD'),


        });
        const transactions = await getTransactionChartData(chartPeriod, {
          productId: selectedProduct?.id,
          startDate: startDate?.format('YYYY-MM-DD'),
          endDate: endDate?.format('YYYY-MM-DD'),

        });

        setStats(statsData);
        setSalesData(salesResponse.chart);
        setSalesSummary(salesResponse.summary);
        setUserData(users);
        setTransactionData(transactions);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [chartPeriod, selectedProduct, startDate, endDate]);

  const handlePeriodChange = (event: SelectChangeEvent) => {
    const newPeriod = event.target.value as ChartPeriod;
    setChartPeriod(newPeriod);
    if (newPeriod !== 'custom') {
setStartDate(null);
      setEndDate(null);
    }
  };

  const handleChartTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setChartTabValue(newValue);
    if (newValue === 1) {
      setSelectedProduct(null);
    }
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

  const salesFormatted = stats?.sales as any;

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
            value={salesFormatted?.todayAbbreviated || stats?.sales.today}
            fullValue={stats?.sales.today}
            icon="sales"
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Weekly Sales"
            value={salesFormatted?.weeklyAbbreviated || stats?.sales.weekly}
            fullValue={stats?.sales.weekly}
            icon="sales"
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Monthly Sales"
            value={salesFormatted?.monthlyAbbreviated || stats?.sales.monthly}
            fullValue={stats?.sales.monthly}
            icon="sales"
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Yearly Sales"
            value={salesFormatted?.yearlyAbbreviated || (salesFormatted?.yearly || "N/A")}
            fullValue={(stats?.sales as any)?.yearly}
            icon="sales"
            color="#F44336"
          />
        </Grid>
        {/* <Grid item xs={12} sm={6} md={3}>
          <StatisticsCard
            title="Total Products"
            value={stats?.products.totalProducts.toString() || "0"}
            icon="products"
            color="#FF9800"
          />
        </Grid> */}
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
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: '600',
                        color: '#2E7D32',
                        mb: 1
                      }}
                    >
                      {stats?.products.totalProducts || 0}
                    </Typography>
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
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: '600',
                        color: '#1976D2',
                        mb: 1
                      }}
                    >
                      {stats?.products.inStock || 0}
                    </Typography>
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
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: '600',
                        color: '#388E3C',
                        mb: 1
                      }}
                    >
                      {stats?.products.healthyStock || 0}
                    </Typography>
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
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: '600',
                        color: '#FF9800',
                        mb: 1
                      }}
                    >
                      {stats?.products.lowStock || 0}
                    </Typography>
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
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: '600',
                        color: '#D32F2F',
                        mb: 1
                      }}
                    >
                      {stats?.products.outOfStock || 0}
                    </Typography>
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
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: '600',
                        color: '#C2185B',
                        mb: 1
                      }}
                    >
                      {stats?.products.outOfStockStatus || 0}
                    </Typography>
                    <Typography sx={{ fontSize: '0.813rem', color: 'text.secondary', textAlign: 'center' }}>
                     Out Of Stock Status    
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Orders Status - Updated Logic */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', minHeight: '240px' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#333' }}>
              Orders Status
            </Typography>
            <Box sx={{ height: 'calc(100% - 50px)', display: 'flex', alignItems: 'center' }}>
              <Grid container spacing={1.5}>
                {/* Map ALL statuses consistently */}
                {stats?.orders.map((order, index) => (
                  <Grid item xs={4} key={`order-${order.status || "unknown"}-${index}`}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: '#fff',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <Typography 
                        color="textSecondary"
                        sx={{ 
                          fontSize: '0.813rem',
                          mb: 0.5,
                          lineHeight: 1.2 // Add line height to prevent text jumping
                        }}
                      >
                        {/* Use formatStatusText */}
                        {formatStatusText(order.status || "Unknown")}
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.375rem',
                          // Use the helper function for color
                          color: getStatusCountColor(order.status)
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
                      {userGroup?.role?.replace('_', ' ')}
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
                    {/* Group metrics into arrays of 3 */}
                    {[
                      { label: 'Active', value: userGroup.active_count, color: '#4CAF50' },
                      { label: 'Blocked', value: userGroup.blocked_count, color: '#F44336' },
                      ...(userGroup.role === 'customer' 
                        ? [
                            { label: 'Verified', value: userGroup.verified_customer_count, color: '#2196F3' },
                            { label: 'Unverified', value: userGroup.unverified_customer_count, color: '#FF9800' }
                          ] 
                        : [])
                    ]
                    .filter(item => Number(item.value) > 0)
                    .map((item, itemIndex) => (
                      <Grid item xs={4} key={`${userGroup.role}-${item.label}`}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center'
                        }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#555' }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: '1.375rem', fontWeight: 500, color: item.color, lineHeight: 1.2 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
     <Box sx={{ p: 3 }}>
        <SalesStatsOverview />
      </Box>
      {/* Chart Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        sx={{ p: 3, flexWrap: 'wrap', gap: 2 }}
      >
        <Typography variant="h5">Performance Charts</Typography>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {chartTabValue !== 1 && (
            <Autocomplete
              sx={{ minWidth: 200 }}
              options={products}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue);
              }}
              onInputChange={(event, newInputValue) => {
                setProductSearch(newInputValue);
              }}
              loading={loadingProducts}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search product"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}

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
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          {chartPeriod === 'custom' && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                />

            </LocalizationProvider>
          )}
        </Box>
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
                  {salesSummary && <SalesSummary summary={salesSummary} />}
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
