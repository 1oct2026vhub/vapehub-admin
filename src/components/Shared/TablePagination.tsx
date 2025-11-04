"use client";

import {
  Pagination,
  PaginationItem,
  Select,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const TablePagination = ({
  page,
  totalPages,
  limit,
  totalRecords,
  onPageChange,
  onLimitChange,
}: TablePaginationProps) => {
  // Generate options from 10 to 100 in increments of 10
  const pageSizeOptions = [10, 25, 50,100];

  return (
    <Box className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
      {/* Rows per page selector */}
      <Box className="flex items-center gap-2">
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>
        <Select
          value={limit}
          onChange={(e) => {
            const newLimit = Number(e.target.value);
            // Reset page first, then change limit to ensure proper batching
            onPageChange(1);
            onLimitChange(newLimit);
          }}
          size="small"
          sx={{
            minWidth: "70px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.23)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#2E9970",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#2E9970",
            },
          }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="body2" color="text.secondary">
          of {totalRecords} items
        </Typography>
      </Box>

      {/* Pagination */}
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
        shape="rounded"
        color="primary"
        renderItem={(item) => (
          <PaginationItem
            {...item}
            className="text-gray-600 hover:text-[#2E9970]"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "#2E9970",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#247C5C",
                },
              },
            }}
          />
        )}
      />
    </Box>
  );
};

export default TablePagination;

