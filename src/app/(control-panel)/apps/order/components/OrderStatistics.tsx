"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Paper,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { getOrderStatistics, OrderStatusStatistics } from "@/services/apiOrder";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface OrderStatisticsProps {
  className?: string;
}

const OrderStatistics = ({ className }: OrderStatisticsProps) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().subtract(30, "day")
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<OrderStatusStatistics[]>([]);
  const { showSnackbar } = useSnackbar();

  // Calculate total orders and amount
  const totalStats = useMemo(() => {
    if (!statistics.length) {
      return { orders: 0, amount: 0 };
    }
    
    return statistics.reduce(
      (acc, curr) => {
        acc.orders += curr.count;
        acc.amount += parseFloat(curr.total_amount);
        return acc;
      },
      { orders: 0, amount: 0 }
    );
  }, [statistics]);

  // Define status colors
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#FF9800", // Orange
      processing: "#2196F3", // Blue
      shipped: "#9C27B0", // Purple
      delivered: "#4CAF50", // Green
      completed: "#009688", // Teal
      fail: "#F44336", // Red
      cancel: "#795548", // Brown
      return_requested: "#FF5722", // Deep Orange
      return_approved: "#FF9800", // Orange
      return_received: "#9E9E9E", // Grey
      refunded: "#607D8B", // Blue Grey
    };
    return colors[status] || "#9E9E9E"; // Default to grey
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      const response = await getOrderStatistics(
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD")
      );
      
      if (response.success && response.data.order_status) {
        setStatistics(response.data.order_status);
      } else {
        showSnackbar("Failed to load order statistics", "error");
      }
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      showSnackbar("Error loading statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dates change
  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper className={`${className} overflow-hidden`} elevation={1}>
        <Box className="p-4 bg-gray-50 border-b">
          <Typography variant="h6" className="font-medium mb-4">
            Order Statistics
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box className="h-full flex items-center justify-center">
                {loading && <CircularProgress size={24} />}
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box className="p-4">
          {/* Summary Cards */}
          <Grid container spacing={3} className="mb-4">
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalStats.orders}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" component="div">
                    ${totalStats.amount.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Status Breakdown */}
          <Typography variant="subtitle1" className="mb-3 font-medium">
            Orders by Status
          </Typography>

          <Grid container spacing={2}>
            {statistics.map((stat) => (
              <Grid item xs={12} sm={6} md={4} key={stat.status}>
                <Card variant="outlined">
                  <CardContent>
                    <Box className="flex items-center mb-2">
                      <Chip 
                        label={stat.status.toUpperCase()} 
                        size="small" 
                        style={{ 
                          backgroundColor: getStatusColor(stat.status),
                          color: 'white',
                        }}
                      />
                    </Box>
                    <Box className="flex justify-between items-end">
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Orders
                        </Typography>
                        <Typography variant="h6">
                          {stat.count}
                        </Typography>
                      </Box>
                      <Box className="text-right">
                        <Typography variant="body2" color="text.secondary">
                          Revenue
                        </Typography>
                        <Typography variant="h6">
                          ${parseFloat(stat.total_amount).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default OrderStatistics;
