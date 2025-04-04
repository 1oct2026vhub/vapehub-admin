"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import DownloadIcon from "@mui/icons-material/Download";
import OrdersList from "./components/OrdersList";
import OrderStatistics from "./components/OrderStatistics";
import { 
  OrderStatus, 
  PaymentStatus, 
  generateOrderReport 
} from "@/services/apiOrder";
import FuseLoading from "@fuse/core/FuseLoading";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OrderApp = () => {
  const [tabValue, setTabValue] = useState(0);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as OrderStatus | "");
  };

  const handlePaymentStatusChange = (event: SelectChangeEvent) => {
    setPaymentStatus(event.target.value as PaymentStatus | "");
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const formattedStartDate = startDate ? startDate.format("YYYY-MM-DD") : undefined;
      const formattedEndDate = endDate ? endDate.format("YYYY-MM-DD") : undefined;
      
      const reportBlob = await generateOrderReport(
        status || undefined,
        paymentStatus || undefined,
        formattedStartDate,
        formattedEndDate
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(reportBlob);
      
      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `orders-report-${dayjs().format("YYYY-MM-DD")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate report:", error);
      // You could add a snackbar/toast notification here
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <Box className="order-management-container">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            Order Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? "Generating..." : "Generate Report"}
          </Button>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-select-label">Order Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={status}
                  label="Order Status"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="fail">Failed</MenuItem>
                  <MenuItem value="cancel">Cancelled</MenuItem>
                  <MenuItem value="return_requested">Return Requested</MenuItem>
                  <MenuItem value="return_approved">Return Approved</MenuItem>
                  <MenuItem value="return_received">Return Received</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="payment-status-select-label">Payment Status</InputLabel>
                <Select
                  labelId="payment-status-select-label"
                  value={paymentStatus}
                  label="Payment Status"
                  onChange={handlePaymentStatusChange}
                >
                  <MenuItem value="">All Payment Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="order management tabs"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Orders List" />
            <Tab label="Order Statistics" />
          </Tabs>
        </Box>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <OrdersList 
          statusFilter={status || undefined} 
          paymentStatusFilter={paymentStatus || undefined} 
          startDateFilter={startDate ? startDate.format("YYYY-MM-DD") : undefined}
          endDateFilter={endDate ? endDate.format("YYYY-MM-DD") : undefined}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <OrderStatistics 
          externalStartDate={startDate ? startDate.format("YYYY-MM-DD") : undefined}
          externalEndDate={endDate ? endDate.format("YYYY-MM-DD") : undefined}
        />
      </TabPanel>
    </Box>
  );
};

export default OrderApp; 