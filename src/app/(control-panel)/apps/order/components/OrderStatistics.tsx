"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  getOrderStatistics,
  OrderStatistics as OrderStatsType,
} from "@/services/apiOrder";
import OrderStatusChip from "./OrderStatusChip";
import PaymentStatusChip from "./PaymentStatusChip";
import FuseLoading from "@fuse/core/FuseLoading";
import dayjs from "dayjs";

interface OrderStatisticsProps {
  startDate?: string;
  endDate?: string;
}

const OrderStatistics = ({ startDate, endDate }: OrderStatisticsProps) => {
  const [statistics, setStatistics] = useState<OrderStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await getOrderStatistics(startDate, endDate);
      setStatistics(data);
    } catch (error) {
      console.error("Failed to fetch order statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!statistics || !chartRef.current) return;

    const renderSalesChart = async () => {
      try {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d");
        if (!ctx) return;

        const ChartJS = await import("chart.js/auto");
        chartInstance.current = new ChartJS.default(ctx, {
          type: "line",
          data: {
            labels: statistics.dailySales.map((item) => item.date),
            datasets: [
              {
                label: "Daily Revenue",
                data: statistics.dailySales.map((item) => item.revenue),
                borderColor: "#4CAF50",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                fill: true,
                tension: 0.4,
                yAxisID: "y",
              },
              {
                label: "Order Count",
                data: statistics.dailySales.map((item) => item.orders),
                borderColor: "#2196F3",
                backgroundColor: "transparent",
                borderDash: [5, 5],
                tension: 0.4,
                yAxisID: "y1",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
              },
              tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || "";
                    if (label) {
                      label += ": ";
                    }
                    if (context.datasetIndex === 0) {
                      label += new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(context.parsed.y);
                    } else {
                      label += context.parsed.y;
                    }
                    return label;
                  },
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date",
                },
              },
              y: {
                type: "linear",
                display: true,
                position: "left",
                title: {
                  display: true,
                  text: "Revenue ($)",
                },
              },
              y1: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                  display: true,
                  text: "Orders",
                },
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
          },
        });
      } catch (error) {
        console.error("Error rendering chart:", error);
      }
    };

    renderSalesChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [statistics]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <FuseLoading />
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box p={3}>
        <Typography variant="body1" color="text.secondary">
          No statistics available for the selected period.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h3" color="primary">
                {statistics.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Total orders in the selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Sales
              </Typography>
              <Typography variant="h3" color="primary">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(statistics.totalSales)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gross sales amount before discounts and returns
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Net Revenue
              </Typography>
              <Typography variant="h3" color="primary">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(statistics.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Net revenue after discounts, refunds, and returns
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Status Breakdown */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Orders by Status
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {statistics.ordersByStatus?.map((statusData, index) => (
            <Grid item xs={6} sm={4} md={3} key={`status-${index}`}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 2,
                }}
              >
                <OrderStatusChip status={statusData.status} />
                <Typography
                  variant="h5"
                  sx={{ mt: 1, mb: 0.5, fontWeight: "bold" }}
                >
                  {statusData.count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Payment Status Breakdown */}
      <Paper sx={{ mb: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Orders by Payment Status
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {statistics.ordersByPaymentStatus.map((paymentData, index) => (
            <Grid item xs={6} sm={3} key={`payment-${index}`}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  p: 2,
                }}
              >
                <PaymentStatusChip status={paymentData.status} />
                <Typography
                  variant="h5"
                  sx={{ mt: 1, mb: 0.5, fontWeight: "bold" }}
                >
                  {paymentData.count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orders
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Sales Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Daily Sales & Orders
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ height: 400, width: "100%" }}>
          <canvas ref={chartRef}></canvas>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderStatistics;
