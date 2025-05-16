import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

// Define the props, extending standard TextFieldProps and adding react-hook-form specifics
type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name' | 'defaultValue'> & {
  name: Path<T>; // Use Path for type safety
  control: Control<T>;
  label: string; // Make label required for consistency
  multiline?: boolean; // Explicitly include multiline for conditional styling
};

const FormTextField = <T extends FieldValues>({
  name,
  control,
  label,
  required,
  type = 'text', // Default type to text
  multiline = false, // Default multiline to false
  ...rest // Pass remaining TextField props
}: FormTextFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...rest} // Spread the rest of the props (like placeholder, inputProps, etc.)
          fullWidth // Default to fullWidth for form consistency
          label={label}
          type={type}
          required={required}
          multiline={multiline} // Pass multiline prop to TextField
          error={!!error}
          helperText={error?.message}
          variant="outlined" // Or "filled" / "standard" based on your design
          size="small" // Optional: Adjust size if needed
          value={field.value ?? ''} // Handle null/undefined from react-hook-form
          InputLabelProps={{ shrink: true }} // <-- Keep label always shrunk
          sx={{
            '& label': { color: '#005B2F' }, // Style default label state
            '& label.Mui-focused': { color: '#005B2F' }, // Style focused label state
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white', // Background for the root (includes border area)
              borderRadius: '8px',
              height: multiline ? 'auto' : '36px', // Auto height for multiline
              // For multiline, padding is better controlled on the input itself
              padding: multiline ? '0px' : undefined, // Reset root padding for multiline if needed
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
        />
      )}
    />
  );
};

export default FormTextField;
