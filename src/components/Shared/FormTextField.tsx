import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

// Define the props, extending standard TextFieldProps and adding react-hook-form specifics
type FormTextFieldProps<T extends FieldValues> = Omit<TextFieldProps, 'name' | 'defaultValue'> & {
  name: Path<T>; // Use Path for type safety
  control: Control<T>;
  label: string; // Make label required for consistency
};

const FormTextField = <T extends FieldValues>({
  name,
  control,
  label,
  required,
  type = 'text', // Default type to text
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
          error={!!error}
          helperText={error?.message}
          variant="outlined" // Or "filled" / "standard" based on your design
          size="small" // Optional: Adjust size if needed
          value={field.value ?? ''} // Handle null/undefined from react-hook-form
          InputLabelProps={{ shrink: true }} // <-- Keep label always shrunk
          sx={{ 
            '& label': { color: '#005B2F' }, // Style default label state
            '& label.Mui-focused': { color: '#005B2F' }, // Style focused label state
            '& .MuiOutlinedInput-input': { 
              backgroundColor: 'white', 
            },
          }}
        />
      )}
    />
  );
};

export default FormTextField;
