import React, { useState, useEffect, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Button,
  InputAdornment,
  FormHelperText,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import dayjs from "dayjs";
import { TransactionStatus, TransactionType } from "@/services/apiTransaction";
import { debounce } from "lodash";

interface TransactionFiltersProps {
  search: string;
  status: TransactionStatus | "";
  transactionType: TransactionType | "";
  startDateFilter: dayjs.Dayjs | null;
  endDateFilter: dayjs.Dayjs | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TransactionStatus | "") => void;
  onTransactionTypeChange: (value: TransactionType | "") => void;
  onStartDateChange: (date: dayjs.Dayjs | null) => void;
  onEndDateChange: (date: dayjs.Dayjs | null) => void;
  onClearFilters: () => void;
  className?: string;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  search,
  status,
  transactionType,
  startDateFilter,
  endDateFilter,
  onSearchChange,
  onStatusChange,
  onTransactionTypeChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(search);
  const [searchError, setSearchError] = useState("");

  // Update input value when search prop changes
  useEffect(() => {
    setInputValue(search);
  }, [search]);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (value.length >= 2 || value.length === 0) {
        onSearchChange(value);
      }
    }, 500),
    [onSearchChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear error if input is empty
    if (!value) {
      setSearchError("");
      onSearchChange("");
      return;
    }

    // Validate minimum length
    if (value.length === 1) {
      setSearchError("Search term must be at least 2 characters long");
    } else {
      setSearchError("");
      debouncedSearch(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.length >= 2) {
      e.preventDefault();
      onSearchChange(inputValue);
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSearchError("");
    onSearchChange("");
  };

  return (
    <Box className={`flex gap-2 flex-wrap ${className}`}>
      <div className="flex flex-col">
        <div className="flex">
          <TextField
            label="Search"
            variant="outlined"
            value={inputValue}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            size="small"
            className="min-w-[200px] flex-grow md:flex-grow-0"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: inputValue ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            placeholder="Search by user name or email"
            error={!!searchError}
          />
        </div>
        {searchError && <FormHelperText error>{searchError}</FormHelperText>}
      </div>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={status}
          label="Status"
          onChange={(e) =>
            onStatusChange(e.target.value as TransactionStatus | "")
          }
        >
          <MenuItem value="">All</MenuItem>
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

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={transactionType}
          label="Type"
          onChange={(e) =>
            onTransactionTypeChange(e.target.value as TransactionType | "")
          }
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="purchase">Purchase</MenuItem>
          <MenuItem value="refund">Refund</MenuItem>
          <MenuItem value="payout">Payout</MenuItem>
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

      {/* <Button
        variant="outlined"
        size="small"
        onClick={onClearFilters}
        color="inherit"
      >
        Clear Filters
      </Button> */}
    </Box>
  );
};

export default TransactionFilters;
