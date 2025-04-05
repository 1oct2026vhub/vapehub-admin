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
} from "@/services/apiTransaction";

function TransactionListApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    TransactionStatus | undefined
  >(undefined);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(
    undefined
  );
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalRevenue: "0.00",
  });
  const [loading, setLoading] = useState(true);

  // Fetch transaction statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statistics = await getTransactionStatistics();
        setStats(statistics);
      } catch (error) {
        console.error("Failed to fetch transaction statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
                  Total Transactions
                </Typography>
                <Typography className="text-2xl font-bold">
                  {stats.totalTransactions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5, position: "relative" }}>
                {loading && (
                  <LinearProgress
                    sx={{ position: "absolute", top: 0, left: 0, right: 0 }}
                  />
                )}
                <Typography color="text.secondary" variant="body2">
                  Completed Transactions
                </Typography>
                <Typography className="text-2xl font-bold text-green-600">
                  {stats.completedTransactions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5, position: "relative" }}>
                {loading && (
                  <LinearProgress
                    sx={{ position: "absolute", top: 0, left: 0, right: 0 }}
                  />
                )}
                <Typography color="text.secondary" variant="body2">
                  Failed Transactions
                </Typography>
                <Typography className="text-2xl font-bold text-red-600">
                  {stats.failedTransactions.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ py: 1.5, position: "relative" }}>
                {loading && (
                  <LinearProgress
                    sx={{ position: "absolute", top: 0, left: 0, right: 0 }}
                  />
                )}
                <Typography color="text.secondary" variant="body2">
                  Total Revenue
                </Typography>
                <Typography className="text-2xl font-bold text-blue-600">
                  $
                  {parseFloat(stats.totalRevenue).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <TransactionsTable
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              searchQuery={searchQuery}
            />
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}

export default TransactionListApp;
