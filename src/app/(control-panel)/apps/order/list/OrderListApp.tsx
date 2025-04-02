"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import FuseLoading from "@fuse/core/FuseLoading";
import { motion } from "motion/react";
import OrdersTable from "../components/OrdersTable";
import OrderFilters from "../components/OrderFilters";
import { OrderStatus, PaymentStatus } from "@/services/apiOrder";

function OrderListApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState<
    string | undefined
  >(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    PaymentStatus | ""
  >("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    // Only apply search if there's a non-empty query
    setAppliedSearchQuery(searchQuery.trim() || undefined);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setPaymentStatusFilter("");
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
    setAppliedSearchQuery(undefined);
  };

  const handleStatusChange = (status: OrderStatus | "") => {
    setStatusFilter(status);
  };

  const handlePaymentStatusChange = (status: PaymentStatus | "") => {
    setPaymentStatusFilter(status);
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
              <Typography variant="h4" fontWeight="bold">
                Orders List
              </Typography>
              {/* <Button
                variant="outlined"
                color="inherit"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button> */}
            </Box>
          </Grid>

          {/* <Grid item xs={12}>
            <Paper
              component="form"
              onSubmit={handleSearch}
              sx={{ p: 2, mb: 3 }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={8}>
                  <TextField
                    fullWidth
                    placeholder="Search by order number or customer details"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: { xs: "flex-start", sm: "flex-end" },
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!searchQuery.trim()}
                    >
                      Search
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {showFilters && (
                <OrderFilters
                  statusFilter={statusFilter}
                  paymentStatusFilter={paymentStatusFilter}
                  startDate={startDate}
                  endDate={endDate}
                  onStatusChange={handleStatusChange}
                  onPaymentStatusChange={handlePaymentStatusChange}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              )}
            </Paper>
          </Grid> */}

          <Grid item xs={12}>
            <OrdersTable
              statusFilter={statusFilter || undefined}
              paymentStatusFilter={paymentStatusFilter || undefined}
              searchQuery={appliedSearchQuery}
              startDate={startDate ? startDate.format("YYYY-MM-DD") : undefined}
              endDate={endDate ? endDate.format("YYYY-MM-DD") : undefined}
            />
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}

export default OrderListApp;
