"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Paper,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import DownloadIcon from "@mui/icons-material/Download";
import { getOrderStatistics, OrderStatusStatistics } from "@/services/apiOrder";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FuseLoading from "@fuse/core/FuseLoading";
import { formatPounds } from "@/utils/actions";

interface OrderStatisticsProps {
  className?: string;
  externalStartDate?: string;
  externalEndDate?: string;
}

const OrderStatistics = ({
  className,
  externalStartDate,
  externalEndDate,
}: OrderStatisticsProps) => {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    externalStartDate ? dayjs(externalStartDate) : dayjs().subtract(30, "day")
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    externalEndDate ? dayjs(externalEndDate) : dayjs()
  );
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [statistics, setStatistics] = useState<OrderStatusStatistics[]>([]);
  const { showSnackbar } = useSnackbar();

  // Update local dates when external dates change
  useEffect(() => {
    if (externalStartDate) {
      setStartDate(dayjs(externalStartDate));
      fetchStatistics(dayjs(externalStartDate), endDate);
    }
  }, [externalStartDate]);

  useEffect(() => {
    if (externalEndDate) {
      setEndDate(dayjs(externalEndDate));
      fetchStatistics(startDate, dayjs(externalEndDate));
    }
  }, [externalEndDate]);

  // Define status colors and match UI from screenshot
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#FF9800", // Orange
      processing: "#2196F3", // Blue
      shipped: "#9C27B0", // Purple
      delivered: "#4CAF50", // Green
      completed: "#009688", // Teal
      fail: "#E53935", // Red
      cancel: "#795548", // Brown
      draft: "#9E9E9E", // Grey
      return_requested: "#FF5722", // Deep Orange
      return_approved: "#FF9800", // Orange
      return_received: "#9E9E9E", // Grey
      refunded: "#607D8B", // Blue Grey
    };
    return colors[status] || "#9E9E9E"; // Default to grey
  };

  // Fetch statistics
  const fetchStatistics = async (start: Dayjs | null = null, end: Dayjs | null = null) => {
    const useStart = start || startDate;
    const useEnd = end || endDate;
    
    if (!useStart || !useEnd) return;

    try {
      setLoading(true);
      const response = await getOrderStatistics(
        useStart.format("YYYY-MM-DD"),
        useEnd.format("YYYY-MM-DD")
      );

      if (response.success && response.data.order_status) {
        setStatistics(response.data.order_status);
      } else {
        showSnackbar("Failed to load order statistics", "error");
      }
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      // showSnackbar("Error loading statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Handle Excel export
  const handleExportExcel = () => {
    try {
      setExportLoading(true);

      // Create CSV content
      let csvContent = "Status,Orders,Revenue\n";
      statistics.forEach((stat) => {
        csvContent += `${stat.status},${stat.count},${formatPounds(stat.total_amount)}\n`;
      });

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `order-statistics-${startDate?.format(
          "YYYY-MM-DD"
        )}-to-${endDate?.format("YYYY-MM-DD")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSnackbar("Statistics exported successfully", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showSnackbar("Failed to export statistics", "error");
    } finally {
      setExportLoading(false);
    }
  };

  return (
      <Box className="p-4">
        {/* Title */}
        {/* <Typography variant="h6" className="mb-3">
          Orders by Status
        </Typography> */}

        {loading ? (
          <Box className="flex justify-center p-4">
            <FuseLoading />
          </Box>
        ) : (
          <Box>
            {/* Status Cards */}
            <Grid container spacing={1}>
              {statistics.map((stat) => {
                const status = stat.status.toUpperCase();
                const backgroundColor = getStatusColor(stat.status);
                
                return (
                  <Grid item xs={6} sm={4} md={2} key={stat.status}>
                    <Card variant="outlined" className="h-full" sx={{ minHeight: '70px' }}>
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Box className="mb-1">
                          <Chip
                            label={status}
                            size="small"
                            style={{
                              backgroundColor,
                              color: "white",
                              fontWeight: "500",
                              padding: "0px 4px",
                              borderRadius: "8px",
                              fontSize: "0.6rem",
                              height: "16px"
                            }}
                          />
                        </Box>
                        
                        <Grid container>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                              Orders
                            </Typography>
                            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 500, fontSize: '0.8rem', mt: 0.25 }}>
                              {stat.count}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6} className="text-right">
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                              Revenue
                            </Typography>
                            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 500, fontSize: '0.8rem', mt: 0.25 }}>
                              {formatPounds(stat.total_amount)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Box>
  );
};

export default OrderStatistics;
