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
  multiple?: boolean;
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
  searchTerm = "",
  multiple = false,
}) => {
  const [touched, setTouched] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // ✅ Handle value mapping correctly
  const getSelectedOption = (value: any) => {
    if (multiple) {
      if (!Array.isArray(value)) return [];
      return options.filter((option) => value.includes(option.value));
    }
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
          multiple={multiple}
          options={options}
          getOptionLabel={(option: Option) => option.label}
          isOptionEqualToValue={(option: Option, value: Option) =>
            option.value === value.value
          }
          value={getSelectedOption(field.value)} // ✅ Properly map selected value
          onChange={(_, newValue) =>
            field.onChange(
              multiple
                ? (newValue as Option[]).map((item) => item.value)
                : newValue
                ? (newValue as Option).value
                : ""
            )
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
          renderOption={(props, option: Option) => (
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
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
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
