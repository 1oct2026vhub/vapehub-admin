// import React from 'react';
// import { Controller } from 'react-hook-form';
// import { Autocomplete, TextField, CircularProgress } from '@mui/material';

// interface Option {
//   value: number | string;
//   label: string;
// }

// interface FormSearchableSelectFieldProps {
//   name: string;
//   control: any;
//   label: string;
//   options: Option[];
//   required?: boolean;
//   loading?: boolean;
// }

// const FormSearchableSelectField: React.FC<FormSearchableSelectFieldProps> = ({
//   name,
//   control,
//   label,
//   options,
//   required = false,
//   loading = false
// }) => {
//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field }) => (
//         <Autocomplete
//           {...field}
//           options={options}
//           getOptionLabel={(option) => option.label}
//           isOptionEqualToValue={(option, value) => option.value === value}
//           onChange={(_, newValue) => field.onChange(newValue ? newValue.value : '')}
//           loading={loading}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               label={label}
//               variant="outlined"
//               required={required}
//               error={!!field.error}
//               helperText={field.error ? field.error.message : ''}
//               InputProps={{
//                 ...params.InputProps,
//                 endAdornment: (
//                   <>
//                     {loading ? <CircularProgress color="inherit" size={20} /> : null}
//                     {params.InputProps.endAdornment}
//                   </>
//                 )
//               }}
//             />
//           )}
//         />
//       )}
//     />
//   );
// };

// export default FormSearchableSelectField;

import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";

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
}

const FormSearchableSelectField: React.FC<FormSearchableSelectFieldProps> = ({
  name,
  control,
  label,
  options,
  required = false,
  loading = false,
  errorMessage,
}) => {
  const [touched, setTouched] = useState(false);

  // ✅ Handle value mapping correctly
  const getSelectedOption = (value: string | number) => {
    return options.find((option) => option.value === value) || null;
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
          // isOptionEqualToValue={(option, value) => option.value === value}
          isOptionEqualToValue={(option, value) => 
            option.value === (value as Option)?.value  // ✅ Proper type assertion
          }
          value={getSelectedOption(field.value)} // ✅ Properly map selected value
          onChange={(_, newValue) =>
            field.onChange(newValue ? newValue.value : "")
          }
          loading={loading}
          onFocus={() => setTouched(true)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                <>
                  {label} {required && <span style={{ color: "red" }}>*</span>}
                </>
              }
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
