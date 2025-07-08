import { TextField, TextFieldProps } from '@mui/material';
import { Control, Controller } from 'react-hook-form';

interface FormTextAreaProps extends Omit<TextFieldProps, 'name' | 'control'> {
  name: string;
  control: Control<any>;
  label: string;
}

const FormTextArea: React.FC<FormTextAreaProps> = ({ name, control, label, ...rest }) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <TextField
        {...field}
        label={label}
        error={!!error}
        helperText={error?.message}
        fullWidth
        multiline
        rows={4}
        sx={{ backgroundColor: 'white' }}
        {...rest}
      />
    )}
  />
);

export default FormTextArea; 