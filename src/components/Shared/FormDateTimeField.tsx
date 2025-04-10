import React from "react";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { SxProps, Theme } from "@mui/material/styles";

export interface FormDateTimeFieldProps {
  name: string;
  control: any;
  label: string;
  required?: boolean;
  helperText?: string;
  minDateTime?: Date;
  maxDateTime?: Date;
  disabled?: boolean;
  sx?: SxProps<Theme>;
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
  sx,
}) => {
  const [touched, setTouched] = React.useState(false);

  // Get current date and time
  const now = React.useMemo(() => dayjs(), []);

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
                if (newValue && newValue.isValid()) {
                  // Only allow future dates and times
                  if (newValue.isBefore(now)) {
                    onChange(now.toISOString());
                  } else {
                    onChange(newValue.toISOString());
                  }
                } else {
                  onChange(null);
                }
              }}
              minDateTime={now}
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
                      borderRadius: "0",
                      "& fieldset": {
                        borderColor: "#2E9970",
                        borderRadius: "0",
                      },
                      "&:hover fieldset": {
                        borderColor: "#247C5C",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1E7A56",
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#2E9970",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#2E9970",
                    },
                    ...sx,
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