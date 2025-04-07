import React from "react";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from 'dayjs';
import 'dayjs/locale/en';

export interface FormDateTimeFieldProps {
  name: string;
  control: any;
  label: string;
  required?: boolean;
  helperText?: string;
  minDateTime?: Date;
  maxDateTime?: Date;
  disabled?: boolean;
}

const FormDateTimeField: React.FC<FormDateTimeFieldProps> = ({
  name,
  control,
  label,
  required = false,
  helperText = "",
  minDateTime,
  maxDateTime,
  disabled = false,
}) => {
  const [touched, setTouched] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
        <Box className="mb-6">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label={
                <>
                  {label} {required && <span style={{ color: "red" }}>*</span>}
                </>
              }
              value={value ? dayjs(value) : null}
              onChange={(newValue) => {
                onChange(newValue ? newValue.toISOString() : null);
              }}
              minDate={minDateTime ? dayjs(minDateTime) : undefined}
              maxDate={maxDateTime ? dayjs(maxDateTime) : undefined}
              disabled={disabled}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  error: touched && !!error,
                  inputRef: ref,
                  onFocus: () => setTouched(true),
                  sx: {
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderImage: "linear-gradient(to right, #2E9970, #005434) 1",
                      },
                      "&:hover fieldset": {
                        borderImage: "linear-gradient(to right, #247C5C, #003F29) 1",
                      },
                      "&.Mui-focused fieldset": {
                        borderImage: "linear-gradient(to right, #1E7A56, #004C30) 1",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#2E9970",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#2E9970",
                    },
                  }
                }
              }}
            />
          </LocalizationProvider>
          {(touched && error) ? (
            <Typography color="error" variant="caption">
              {error.message}
            </Typography>
          ) : helperText ? (
            <Typography variant="caption" color="textSecondary">
              {helperText}
            </Typography>
          ) : null}
        </Box>
      )}
    />
  );
};

export default FormDateTimeField; 