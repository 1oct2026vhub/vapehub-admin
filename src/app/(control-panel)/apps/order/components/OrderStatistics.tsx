"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Tooltip,
} from "@mui/material";
import { getOrderStatistics, OrderStatusStatistics } from "@/services/apiOrder";
import { useSnackbar } from "@/contexts/SnackbarContext";
import FuseLoading from "@fuse/core/FuseLoading";
import { formatPounds, formatStatusText } from "@/utils/actions";

interface OrderStatisticsProps {
  className?: string;
  externalStartDate?: string;
  externalEndDate?: string;
  refreshTrigger?: number;
}

const OrderStatistics = ({
  className,
  externalStartDate,
  externalEndDate,
  refreshTrigger = 0,
}: OrderStatisticsProps) => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<OrderStatusStatistics[]>([]);
  const { showSnackbar } = useSnackbar();
  const fetchInFlightRef = useRef(false);
  const lastFetchedKeyRef = useRef<string | null>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#FF9800",
      processing: "#2196F3",
      shipped: "#9C27B0",
      completed: "#009688",
      fail: "#E53935",
      cancel: "#795548",
      draft: "#9E9E9E",
      return_requested: "#FF5722",
      return_approved: "#FF9800",
      return_received: "#9E9E9E",
      refunded: "#607D8B",
      out_for_delivery: "#00ACC1",
      delivered: "#4CAF50",
      packed: "#8BC34A",
    };
    return colors[status.toLowerCase()] || "#9E9E9E";
  };

  const fetchStatistics = useCallback(async () => {
    if (!externalStartDate || !externalEndDate) return;

    const requestKey = `${externalStartDate}|${externalEndDate}|${refreshTrigger}`;
    if (fetchInFlightRef.current || lastFetchedKeyRef.current === requestKey) {
      return;
    }

    fetchInFlightRef.current = true;

    try {
      setLoading(true);
      const response = await getOrderStatistics(
        externalStartDate,
        externalEndDate
      );

      if (response.success && response.data.order_status) {
        setStatistics(response.data.order_status);
        lastFetchedKeyRef.current = requestKey;
      } else {
        showSnackbar("Failed to load order statistics", "error");
      }
    } catch (error) {
      console.error("Error fetching order statistics:", error);
    } finally {
      setLoading(false);
      fetchInFlightRef.current = false;
    }
  }, [externalEndDate, externalStartDate, refreshTrigger, showSnackbar]);

  useEffect(() => {
    void fetchStatistics();
  }, [fetchStatistics]);

  return (
    <Box className={className}>
      <Box className="p-4">
        {loading ? (
          <Box className="flex justify-center p-4">
            <FuseLoading />
          </Box>
        ) : (
          <Box>
            <Grid container spacing={1}>
              {statistics.map((stat) => {
                const displayStatus = formatStatusText(stat.status);
                const backgroundColor = getStatusColor(stat.status);

                return (
                  <Grid item xs={6} sm={4} md={2} key={stat.status}>
                    <Card variant="outlined" className="h-full" sx={{ minHeight: "70px" }}>
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Box className="mb-1">
                          <Chip
                            label={displayStatus}
                            size="small"
                            style={{
                              backgroundColor,
                              color: "white",
                              fontWeight: "500",
                              padding: "0px 4px",
                              borderRadius: "8px",
                              fontSize: "0.6rem",
                              height: "16px",
                            }}
                          />
                        </Box>
                        <Grid container>
                          <Grid item xs={6}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.6rem" }}
                            >
                              Orders
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              component="div"
                              sx={{ fontWeight: 500, fontSize: "0.8rem", mt: 0.25 }}
                            >
                              {stat.count_abbreviated || stat.count}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} className="text-right">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.6rem" }}
                            >
                              Revenue
                            </Typography>
                            {stat.total_amount_abbreviated &&
                            stat.total_amount_abbreviated.includes("K") ? (
                              <Tooltip
                                title={`${formatPounds(stat.total_amount)}`}
                                arrow
                                placement="top"
                              >
                                <Typography
                                  variant="subtitle2"
                                  component="div"
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: "0.8rem",
                                    mt: 0.25,
                                    cursor: "help",
                                  }}
                                >
                                  £{stat.total_amount_abbreviated}
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Typography
                                variant="subtitle2"
                                component="div"
                                sx={{ fontWeight: 500, fontSize: "0.8rem", mt: 0.25 }}
                              >
                                {stat.total_amount_abbreviated
                                  ? `£${stat.total_amount_abbreviated}`
                                  : formatPounds(stat.total_amount)}
                              </Typography>
                            )}
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
    </Box>
  );
};

export default OrderStatistics;
