import React, { useState } from "react";
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Define the props, extending standard TextFieldProps and adding react-hook-form specifics
type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name' | 'defaultValue'> & {
  name: Path<T>; // Use Path for type safety
  control: Control<T>;
  label: string; // Make label required for consistency
  rules?: any;
  multiline?: boolean; // Explicitly include multiline for conditional styling
  multiple?: boolean; // Add multiple prop for multi-select support
};

const FormTextField = <T extends FieldValues>({
  name,
  control,
  label,
  required,
  rules,
  type = 'text', // Default type to text
  multiline = false, // Default multiline to false
  multiple = false, // Default multiple to false
  ...rest // Pass remaining TextField props
}: FormTextFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isPassword = type === "password";

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...rest} // Spread the rest of the props (like placeholder, inputProps, etc.)
          fullWidth // Default to fullWidth for form consistency
          label={
            <>
              {label} {required && <span style={{ color: "red" }}>*</span>}
            </>
          }
          type={isPassword ? (showPassword ? "text" : "password") : type}
          multiline={multiline} // Pass multiline prop to TextField
          error={!!error}
          helperText={error?.message}
          variant="outlined" // Or "filled" / "standard" based on your design
          size="small" // Optional: Adjust size if needed
          value={field.value ?? ""} // Handle null/undefined from react-hook-form
          InputLabelProps={{ shrink: true }} // <-- Keep label always shrunk
          inputProps={{
            ...rest.inputProps,
            'aria-invalid': !!error,
          }}
          InputProps={{
            endAdornment: isPassword && (
              <InputAdornment position="end">
                <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          select={rest.select}
          SelectProps={{ ...rest.SelectProps, multiple }} // Forward SelectProps and handle multiple
          sx={{
            '& label': { color: '#005B2F' }, // Style default label state
            '& label.Mui-focused': { color: '#005B2F' }, // Style focused label state
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white', // Background for the root (includes border area)
              borderRadius: '8px',
              height: multiline ? 'auto' : '36px', // Auto height for multiline
              // For multiline, padding is better controlled on the input itself
              padding: multiline ? '0px' : undefined, // Reset root padding for multiline if needed
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                paddingTop: 0,
                paddingBottom: 0,
              },
            },
            '& .MuiOutlinedInput-input': {
              backgroundColor: 'white', // Ensure input area is white
              height: multiline ? 'auto' : '36px', // Auto height for multiline
              // Adjust padding for multiline to ensure text doesn't overlap with shrunken label
              paddingTop: multiline ? '18px' : undefined, // More top padding for multiline
              paddingBottom: multiline ? '8px' : undefined, // Standard bottom padding
              // If you want to attempt horizontal centering of placeholder text for multiline:
              // textAlign: multiline ? 'center' : undefined, // THIS WILL CENTER ACTUAL TEXT TOO
            },
          }}
        >
          {rest.select && rest.children}
        </TextField>
      )}
    />
  );
};

export default FormTextField;
