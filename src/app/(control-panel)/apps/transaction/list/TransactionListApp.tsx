"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import { motion } from "motion/react";
import TransactionsTable from "../components/TransactionsTable";
import {
  TransactionStatus,
  TransactionType,
  getTransactionStatistics,
  getRevenueReport,
} from "@/services/apiTransaction";
import dayjs from "dayjs";
import { formatPounds } from "@/utils/actions";

function TransactionListApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    TransactionStatus | undefined
  >(undefined);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    dayjs().subtract(1, 'month')
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    dayjs()
  );
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalRevenue: "0.00",
  });
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(true);

  // Fetch transaction statistics and revenue data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get transaction statistics
        const statistics = await getTransactionStatistics();
        if (statistics) {
          setStats({
            totalTransactions: statistics.totalTransactions || 0,
            completedTransactions: statistics.completedTransactions || 0,
            failedTransactions: statistics.failedTransactions || 0,
            totalRevenue: statistics.totalRevenue || '0.00',
          });
        }
        
        // Always fetch revenue data, using date filters if available
        const startDateStr = startDate ? startDate.format("YYYY-MM-DD") : undefined;
        const endDateStr = endDate ? endDate.format("YYYY-MM-DD") : undefined;
        
        const revenueReport = await getRevenueReport(
          startDateStr,
          endDateStr
        );
        
        if (revenueReport) {
          setRevenueData({
            totalRevenue: revenueReport.totalRevenue || 0,
            start_date: revenueReport.start_date || '',
            end_date: revenueReport.end_date || '',
          });
        }
      } catch (error) {
        console.error("Failed to fetch transaction statistics:", error);
        // Set default values in case of error
        setStats({
          totalTransactions: 0,
          completedTransactions: 0,
          failedTransactions: 0,
          totalRevenue: '0.00',
        });
        setRevenueData({
          totalRevenue: 0,
          start_date: '',
          end_date: '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate]);

  // Handle date filter changes
  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: dayjs.Dayjs | null) => {
    setEndDate(date);
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <div>
                <Typography variant="h4" fontWeight="bold">
                  Transactions
                </Typography>
              </div>
            </Box>
          </Grid>

          {/* Transaction Summary Cards - Reduced Size */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5, position: "relative" }}>
                {loading && (
                  <LinearProgress
                    sx={{ position: "absolute", top: 0, left: 0, right: 0 }}
                  />
                )}
                <Typography color="text.secondary" variant="body2">
                  Revenue
                  <span className="text-xs block mt-1">
                    {startDate ? startDate.format("MMM D, YYYY") : ""} - {" "}
                    {endDate ? endDate.format("MMM D, YYYY") : "Present"}
                  </span>
                </Typography>
                <Typography className="text-2xl font-bold text-blue-600">
                  {(() => {
                    let value = 0;
                    if (startDate || endDate) {
                      value = revenueData?.totalRevenue || 0;
                    } else {
                      value = stats?.totalRevenue ? parseFloat(stats.totalRevenue) : 0;
                    }
                    return formatPounds(value);
                  })()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <TransactionsTable
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              searchQuery={searchQuery}
              startDate={startDate ? startDate.format("YYYY-MM-DD") : undefined}
              endDate={endDate ? endDate.format("YYYY-MM-DD") : undefined}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}

export default TransactionListApp;
