import { useState } from "react";
import { Controller, Control } from "react-hook-form";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { SxProps, Theme } from "@mui/material/styles";

export interface ReusableTextFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
  multiline?: boolean;
  rows?: number;
  inputProps?: any;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  helperText?: string;
  sx?: SxProps<Theme>;
}

const FormInputField: React.FC<ReusableTextFieldProps> = ({
  name,
  control,
  label,
  type = "text",
  required = false,
  multiline = false,
  autoFocus = false,
  rows = 1,
  inputProps,
  onChange,
  helperText,
  sx,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Determine if this is a dimension or weight field
  const isWeightField = name.toLowerCase().includes("weight");
  const isDimensionField =
    name.toLowerCase().includes("length") ||
    name.toLowerCase().includes("width") ||
    name.toLowerCase().includes("height");

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={
            <>
              {label} {required && <span style={{ color: "red" }}>*</span>}
            </>
          }
          type={
            name === "password" || name === "confirm"
              ? showPassword
                ? "text"
                : "password"
              : "text"
          }
          autoFocus={autoFocus}
          error={touched && !!error}
          helperText={touched && error ? error.message : helperText}
          variant="outlined"
          fullWidth
          multiline={multiline}
          rows={rows}
          className="mb-6"
          onFocus={() => setTouched(true)}
          InputProps={{
            endAdornment: (
              <>
                {name === "password" || name === "confirm" ? (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ) : isWeightField ? (
                  <InputAdornment position="end">gm</InputAdornment>
                ) : isDimensionField ? (
                  <InputAdornment position="end">cm</InputAdornment>
                ) : null}
              </>
            ),
          }}
          inputProps={inputProps}
          sx={{
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
            /* Hide Edge's default password reveal icon */
            "& input::-ms-reveal, & input::-ms-clear": {
              display: "none",
            },
            ...sx,
          }}
          onChange={(e) => {
            field.onChange(e);
            onChange?.(e);
          }}
        />
      )}
    />
  );
};

export default FormInputField;
