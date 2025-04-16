import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { Autocomplete, TextField, CircularProgress, AutocompleteRenderOptionState } from "@mui/material";

interface Option {
  value: number | string;
  label: string;
}

interface FormSearchableSelectFieldProps {
  name: string;
  control: any;
  label: string;
  options: Option[];
  required?: boolean;
  loading?: boolean;
  errorMessage?: string;
  onInputChange?: (query: string) => void;
  loadingText?: string;
  noOptionsText?: string;
  placeholder?: string;
  searchTerm?: string;
}

const FormSearchableSelectField: React.FC<FormSearchableSelectFieldProps> = ({
  name,
  control,
  label,
  options,
  required = false,
  loading = false,
  errorMessage,
  onInputChange,
  loadingText = "Searching...",
  noOptionsText,
  placeholder,
  searchTerm = ""
}) => {
  const [touched, setTouched] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // ✅ Handle value mapping correctly
  const getSelectedOption = (value: string | number) => {
    return options.find((option) => option.value === value) || null;
  };

  // Generate default noOptionsText if not provided
  const defaultNoOptionsText = 
    inputValue.length > 0 && inputValue.length < 2
      ? "Type at least 2 characters to search"
      : options.length === 0
      ? "No options found"
      : "No matches found";
      
  // Function to highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    try {
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return (
        <>
          {parts.map((part, index) => 
            part.toLowerCase() === query.toLowerCase() ? 
              <span key={index} style={{ fontWeight: 'bold', backgroundColor: 'rgba(46, 153, 112, 0.1)' }}>
                {part}
              </span> : part
          )}
        </>
      );
    } catch (e) {
      return text;
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => 
            option.value === (value as Option)?.value  // ✅ Proper type assertion
          }
          value={getSelectedOption(field.value)} // ✅ Properly map selected value
          onChange={(_, newValue) =>
            field.onChange(newValue ? newValue.value : "")
          }
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
            if (onInputChange) {
              onInputChange(newInputValue);
            }
          }}
          loading={loading}
          loadingText={loadingText}
          noOptionsText={noOptionsText || defaultNoOptionsText}
          onFocus={() => setTouched(true)}
          filterOptions={(x) => x} // Don't filter client-side, we're using server filtering
          renderOption={(props, option, state) => (
            <li {...props} key={`option-${option.value}`}>
              {highlightMatch(option.label, searchTerm || inputValue)}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                <>
                  {label} {required && <span style={{ color: "red" }}>*</span>}
                </>
              }
              placeholder={placeholder || `Search ${label.toLowerCase()}...`}
              variant="outlined"
              fullWidth
              error={!!errorMessage || (touched && !!error)}
              helperText={errorMessage || (touched && error ? error.message : "")}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
                sx: {
                  height: 40, // ✅ Reduced height
                  padding: "0 10px",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 40, // ✅ Reduced height
                  "& fieldset": {
                    borderImage:
                      "linear-gradient(to right, #2E9970, #005434) 1",
                  },
                  "&:hover fieldset": {
                    borderImage:
                      "linear-gradient(to right, #247C5C, #003F29) 1",
                  },
                  "&.Mui-focused fieldset": {
                    borderImage:
                      "linear-gradient(to right, #1E7A56, #004C30) 1",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "#2E9970",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#2E9970",
                },
                marginBottom: "16px", // ✅ Added bottom margin
              }}
            />
          )}
        />
      )}
    />
  );
};

export default FormSearchableSelectField;
