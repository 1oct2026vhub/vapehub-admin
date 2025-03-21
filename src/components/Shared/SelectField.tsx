import { Control, Controller } from "react-hook-form";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
  Box,
} from "@mui/material";

interface FormSelectFieldProps {
    name: string;
  control: Control<any>;
    label: string;
  // options: Array<{
  //   value: number;
  //   label: string;
  // }>;
    options: { value: string | number; label: string }[];
  required?: boolean;
  isMulti?: boolean;
  onChange?: (event: SelectChangeEvent<any>) => void;
  onTermRemove?: (termId: number) => void;
}

function FormSelectField({
  name,
  control,
  label,
  options,
  required,
  isMulti,
  onChange,
  onTermRemove,
}: FormSelectFieldProps) {
    return (
        <Controller
            name={name}
            control={control}
      rules={{ required: required ? "This field is required" : false }}
      render={({
        field: { onChange: fieldOnChange, value },
        fieldState: { error },
      }) => (
                <FormControl
                    fullWidth
                    error={!!error}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
                            },
                            '&:hover fieldset': {
                                borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
                            },
                            '&.Mui-focused fieldset': {
                                borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: '#2E9970', // Label color before focus
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#2E9970', // Label color on focus
                        },
            marginBottom: '20px'
          }}
        >
          <InputLabel>{label}</InputLabel>
          <Select
            multiple={isMulti}
            value={isMulti ? value || [] : value}
            label={label}
            onChange={(e: SelectChangeEvent<any>) => {
              if (onChange) {
                onChange(e);
              } else {
                if (isMulti) {
                  const values = Array.isArray(e.target.value)
                    ? e.target.value
                    : [e.target.value];
                  fieldOnChange(values);
                } else {
                  fieldOnChange(e.target.value);
                }
              }
            }}
            renderValue={(selected) => {
              if (isMulti) {
                const selectedValues = Array.isArray(selected) ? selected : [];
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selectedValues.map((value: number) => {
                      const option = options.find((opt) => opt.value === value);
                      return (
                        <Chip
                          key={value}
                          label={option?.label || value}
                          onDelete={() => {
                            if (onTermRemove) {
                              onTermRemove(value);
                            } else {
                              const newValue = selectedValues.filter(
                                (v) => v !== value,
                              );
                              fieldOnChange(newValue);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      );
                    })}
                  </Box>
                );
              } else {
                const option = options.find((opt) => opt.value === selected);
                return option?.label || selected;
              }
            }}
          >
            {options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
          {error && (
            <span className="text-red-500 text-sm">{error.message}</span>
          )}
                </FormControl>
            )}
        />
    );
}

export default FormSelectField;
