// // components/ReusableTextField.tsx
// import { Controller } from 'react-hook-form';
// import TextField from '@mui/material/TextField';

// interface ReusableTextFieldProps {
//   name: string;
//   control: any; // from react-hook-form
//   label: string;
//   type?: string;
//   required?: boolean;
//   autoFocus?: boolean;
// }

// const FormInputField: React.FC<ReusableTextFieldProps> = ({
//   name,
//   control,
//   label,
//   type = 'text',
//   required = false,
//   autoFocus = false,
// }) => {
//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field, fieldState: { error } }) => (
//         // <TextField
//         //   {...field}
//         //   label={label}
//         //   type={type}
//         //   autoFocus={autoFocus}
//         //   required={required}
//         //   error={!!error}
//         //   helperText={error ? error.message : ''}
//         //   variant="outlined"
//         //   fullWidth
//         //   className="mb-6"
//         // />
//         // <TextField
//         //   {...field}
//         //   label={label}
//         //   type={type}
//         //   autoFocus={autoFocus}
//         //   required={required}
//         //   error={!!error}
//         //   helperText={error ? error.message : ''}
//         //   variant="outlined"
//         //   fullWidth
//         //   className="mb-6"
//         //   sx={{
//         //     '& .MuiOutlinedInput-root': {
//         //       '& fieldset': {
//         //         borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
//         //       },
//         //       '&:hover fieldset': {
//         //         borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
//         //       },
//         //       '&.Mui-focused fieldset': {
//         //         borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
//         //       },
//         //     },
//         //   }}
//         // />

//         <TextField
//           {...field}
//           label={label}
//           type={type}
//           autoFocus={autoFocus}
//           required={required}
//           error={!!error}
//           helperText={error ? error.message : ''}
//           variant="outlined"
//           fullWidth
//           className="mb-6"
//           sx={{
//             '& .MuiOutlinedInput-root': {
//               '& fieldset': {
//                 borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
//               },
//               '&:hover fieldset': {
//                 borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
//               },
//               '&.Mui-focused fieldset': {
//                 borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
//               },
//             },
           
//             '& .MuiInputLabel-root.Mui-focused': {
//               color: '#2E9970', // Label color when focused
//             },
//           }}
//         />


//       )}
//     />
//   );
// };

// export default FormInputField;


// import { useState } from 'react';
// import { Controller } from 'react-hook-form';
// import TextField from '@mui/material/TextField';
// import InputAdornment from '@mui/material/InputAdornment';
// import IconButton from '@mui/material/IconButton';
// import { Visibility, VisibilityOff } from '@mui/icons-material';

// interface ReusableTextFieldProps {
//   name: string;
//   control: any; // from react-hook-form
//   label: string;
//   type?: string;
//   required?: boolean;
//   autoFocus?: boolean;
// }

// const FormInputField: React.FC<ReusableTextFieldProps> = ({
//   name,
//   control,
//   label,
//   type = 'text',
//   required = false,
//   autoFocus = false,
// }) => {
//   const [showPassword, setShowPassword] = useState(false);
  
//   const handleTogglePassword = () => {
//     setShowPassword((prev) => !prev);
//   };

//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field, fieldState: { error } }) => (
//         <TextField
//           {...field}
//           label={label}
//           type={name === 'password' && !showPassword ? 'password' : 'text'}
//           autoFocus={autoFocus}
//           required={required}
//           error={!!error}
//           helperText={error ? error.message : ''}
//           variant="outlined"
//           fullWidth
//           className="mb-6"
//           InputProps={{
//             endAdornment:
//               name === 'password' ? (
//                 <InputAdornment position="end">
//                   <IconButton onClick={handleTogglePassword} edge="end">
//                     {showPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ) : null,
//           }}
//           sx={{
//             '& .MuiOutlinedInput-root': {
//               '& fieldset': {
//                 borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
//               },
//               '&:hover fieldset': {
//                 borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
//               },
//               '&.Mui-focused fieldset': {
//                 borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
//               },
//             },
//             '& .MuiInputLabel-root.Mui-focused': {
//               color: '#2E9970', // Label color when focused
//             },
//           }}
//         />
//       )}
//     />
//   );
// };

// export default FormInputField;


import { useState } from 'react';
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface ReusableTextFieldProps {
  name: string;
  control: any; // From react-hook-form
  label: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}

const FormInputField: React.FC<ReusableTextFieldProps> = ({
  name,
  control,
  label,
  type = 'text',
  required = false,
  autoFocus = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false); // Track if field has been clicked

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required` : false }} // Set validation rules
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={
            <>
              {label} {required && <span style={{ color: 'red' }}>*</span>}
            </>
          }
          type={name === 'password' && !showPassword ? 'password' : 'text'}
          autoFocus={autoFocus}
          error={touched && !!error} // Show error only if field has been clicked
          helperText={touched && error ? error.message : ''}
          variant="outlined"
          fullWidth
          className="mb-6"
          onFocus={() => setTouched(true)} // Set touched when user clicks the field
          InputProps={{
            endAdornment:
              name === 'password' ? (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ) : null,
          }}
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
              color: '#2E9970', // Default label color
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#2E9970', // Label color when focused
            },
          }}
        />
      )}
    />
  );
};

export default FormInputField;

