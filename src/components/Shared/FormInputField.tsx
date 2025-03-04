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
        />
      )}
    />
  );
};

export default FormInputField;
