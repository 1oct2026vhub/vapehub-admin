import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { OrderStatus, PaymentStatus } from "@/services/apiOrder";
import { Dayjs } from "dayjs";
import GenerateReportButton from "./GenerateReportButton";

interface OrderFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  search: string;
  status: OrderStatus | "";
  paymentStatus: PaymentStatus | "";
  startDateFilter: Dayjs | null;
  endDateFilter: Dayjs | null;
  sortBy: string;
  order: "ASC" | "DESC";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderStatus | "") => void;
  onPaymentStatusChange: (value: PaymentStatus | "") => void;
  onStartDateChange: (value: Dayjs | null) => void;
  onEndDateChange: (value: Dayjs | null) => void;
  onSortByChange: (value: string) => void;
  onOrderChange: (value: "ASC" | "DESC") => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

const OrderFilterDrawer = ({
  open,
  onClose,
  search,
  status,
  paymentStatus,
  startDateFilter,
  endDateFilter,
  sortBy,
  order,
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onStartDateChange,
  onEndDateChange,
  onSortByChange,
  onOrderChange,
  onClearFilters,
  onApplyFilters,
}: OrderFilterDrawerProps) => {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <List className="p-4 w-64">
        <ListItem>
          <ListItemText primary="Filters" />
        </ListItem>
        <ListItem>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            fullWidth
            size="small"
          />
        </ListItem>
        <ListItem>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            >
              {/* <MenuItem value="">All Statuses</MenuItem> */}
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="fail">Failed</MenuItem>
              <MenuItem value="packed">Packed</MenuItem>
              <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
              <MenuItem value="cancel">Cancelled</MenuItem>
              <MenuItem value="return_requested">Return Requested</MenuItem>
              <MenuItem value="return_approved">Return Approved</MenuItem>
              <MenuItem value="return_received">Return Received</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </ListItem>
        <ListItem>
          <FormControl fullWidth size="small">
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentStatus}
              label="Payment"
              onChange={(e) =>
                onPaymentStatusChange(e.target.value as PaymentStatus)
              }
            >
              {/* <MenuItem value="">All</MenuItem> */}
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </ListItem>
        <ListItem>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDateFilter}
              onChange={onStartDateChange}
              slotProps={{ 
                textField: { 
                  size: "small", 
                  fullWidth: true,
                  inputProps: {
                    placeholder: "DD-MM-YYYY"
                  }
                } 
              }}
              format="DD-MM-YYYY"
            />
          </LocalizationProvider>
        </ListItem>
        <ListItem>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={endDateFilter}
              onChange={onEndDateChange}
              slotProps={{ 
                textField: { 
                  size: "small", 
                  fullWidth: true,
                  inputProps: {
                    placeholder: "DD-MM-YYYY"
                  }
                } 
              }}
              format="DD-MM-YYYY"
            />
          </LocalizationProvider>
        </ListItem>
        {/* <ListItem>
          <Select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="id">Sort by ID</MenuItem>
            <MenuItem value="createdAt">Sort by Date</MenuItem>
            <MenuItem value="total">Sort by Total</MenuItem>
          </Select>
        </ListItem> */}
        {/* <ListItem>
          <Select
            value={order}
            onChange={(e) => onOrderChange(e.target.value as "ASC" | "DESC")}
            fullWidth
            size="small"
          >
            <MenuItem value="ASC">Ascending</MenuItem>
            <MenuItem value="DESC">Descending</MenuItem>
          </Select>
        </ListItem> */}
        <Divider className="my-3" />

        {/* Report Generation */}
        <Typography variant="subtitle2" className="mb-2">
          Report
        </Typography>
        <GenerateReportButton 
          status={status || undefined}
          paymentStatus={paymentStatus || undefined}
          startDate={startDateFilter ? startDateFilter.format("YYYY-MM-DD") : undefined}
          endDate={endDateFilter ? endDateFilter.format("YYYY-MM-DD") : undefined}
          className="w-full mb-4"
        />

        <Divider className="my-3" />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClearFilters}
            fullWidth
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onApplyFilters();
              onClose();
            }}
            fullWidth
          >
            Apply Filters
          </Button>
        </div>
      </List>
    </Drawer>
  );
};

export default OrderFilterDrawer;
