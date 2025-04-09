"use client";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Button,
  InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SearchIcon from "@mui/icons-material/Search";
import { OrderStatus, PaymentStatus } from "@/services/apiOrder";
import { Dayjs } from "dayjs";

interface OrderFiltersProps {
  search: string;
  status: OrderStatus | "";
  paymentStatus: PaymentStatus | "";
  startDateFilter: Dayjs | null;
  endDateFilter: Dayjs | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderStatus | "") => void;
  onPaymentStatusChange: (value: PaymentStatus | "") => void;
  onStartDateChange: (value: Dayjs | null) => void;
  onEndDateChange: (value: Dayjs | null) => void;
  onClearFilters: () => void;
  className?: string;
}

const OrderFilters = ({
  search,
  status,
  paymentStatus,
  startDateFilter,
  endDateFilter,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  className,
}: OrderFiltersProps) => {
  return (
    <Box className={`flex gap-2 flex-wrap ${className}`}>
      <TextField
        label="Search"
        variant="outlined"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        className="min-w-[200px] flex-grow md:flex-grow-0"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={status}
          label="Status"
          onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="processing">Processing</MenuItem>
          <MenuItem value="shipped">Shipped</MenuItem>
          <MenuItem value="delivered">Delivered</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Payment</InputLabel>
        <Select
          value={paymentStatus}
          label="Payment"
          onChange={(e) =>
            onPaymentStatusChange(e.target.value as PaymentStatus)
          }
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </Select>
      </FormControl>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Start Date"
          value={startDateFilter}
          onChange={onStartDateChange}
          slotProps={{ textField: { size: "small" } }}
        />
        <DatePicker
          label="End Date"
          value={endDateFilter}
          onChange={onEndDateChange}
          slotProps={{ textField: { size: "small" } }}
        />
      </LocalizationProvider>

      {/* <Button variant="outlined" size="small" onClick={onClearFilters}>
        Clear Filters
      </Button> */}
    </Box>
  );
};

export default OrderFilters;
