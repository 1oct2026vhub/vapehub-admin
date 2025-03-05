// components/ReusableTextField.tsx
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';

interface ReusableTextFieldProps {
  name: string;
  control: any; // from react-hook-form
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
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        // <TextField
        //   {...field}
        //   label={label}
        //   type={type}
        //   autoFocus={autoFocus}
        //   required={required}
        //   error={!!error}
        //   helperText={error ? error.message : ''}
        //   variant="outlined"
        //   fullWidth
        //   className="mb-6"
        // />
        <TextField
          {...field}
          label={label}
          type={type}
          autoFocus={autoFocus}
          required={required}
          error={!!error}
          helperText={error ? error.message : ''}
          variant="outlined"
          fullWidth
          className="mb-6"
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
          }}
        />

      )}
    />
  );
};

export default FormInputField;
