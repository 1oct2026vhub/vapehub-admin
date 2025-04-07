import React from "react";
import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";

export interface FormTextareaFieldProps {
  name: string;
  control: any;
  label: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  helperText?: string;
}

const FormTextareaField: React.FC<FormTextareaFieldProps> = ({
  name,
  control,
  label,
  required = false,
  rows = 4,
  placeholder = "",
  helperText = "",
}) => {
  const [touched, setTouched] = React.useState(false);

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
          placeholder={placeholder}
          error={touched && !!error}
          helperText={(touched && error) ? error.message : helperText}
          variant="outlined"
          fullWidth
          multiline
          rows={rows}
          className="mb-6"
          onFocus={() => setTouched(true)}
          sx={{
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
          }}
        />
      )}
    />
  );
};

export default FormTextareaField; 