import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Autocomplete, TextField, Chip } from '@mui/material';

interface FormMultiTextFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  helperText?: string;
  suggestions?: string[];
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  onInputChange?: (value: string) => void;
  loading?: boolean;
}

const FormMultiTextField: React.FC<FormMultiTextFieldProps> = ({
  name,
  control,
  label,
  placeholder,
  helperText,
  suggestions = [],
  required = false,
  error = false,
  errorMessage,
  onInputChange,
  loading = false,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field: { onChange, value } }) => (
        <Autocomplete
          multiple
          freeSolo
          options={suggestions}
          value={Array.isArray(value) ? value : []}
          loading={loading}
          noOptionsText="No variant found"
          onChange={(_, newValue) => {
            // Ensure we're always passing an array of strings
            const cleanedValues = newValue.map(item => 
              typeof item === 'string' ? item.trim() : item
            ).filter(Boolean);
            onChange(cleanedValues);
          }}
          onInputChange={(_, inputValue) => {
            onInputChange?.(inputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              variant="outlined"
              placeholder={placeholder}
              required={required}
              error={error}
              helperText={error ? errorMessage : helperText}
              sx={{ 
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white'
                }
              }}
            />
          )}
          renderTags={(value: string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={`${option}-${index}`}
              />
            ))
          }
        />
      )}
    />
  );
};

export default FormMultiTextField; 