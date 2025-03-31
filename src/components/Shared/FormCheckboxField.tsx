import { Controller, Control } from 'react-hook-form';
import { Checkbox, FormControlLabel, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

interface FormCheckboxFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: () => void;
  required?: boolean;
}

// Styled Checkbox with custom color
const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
  color: '#2E9970',
  '&.Mui-checked': {
    color: '#2E9970',
  },
}));

const FormCheckboxField: React.FC<FormCheckboxFieldProps> = ({
  name,
  control,
  label,
  disabled = false,
  checked,
  onChange,
  required = false,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'This field is required' : false }}
      render={({ field: { value, onChange: fieldOnChange }, fieldState: { error } }) => (
        <Box>
          <FormControlLabel
            control={
              <CustomCheckbox
                checked={checked ?? value}
                onChange={onChange ?? fieldOnChange}
                disabled={disabled}
              />
            }
            label={
              <span>
                {label}
                {required && <span style={{ color: 'red', marginLeft: '2px' }}>*</span>}
              </span>
            }
          />
          {error && (
            <div className="text-red-500 text-xs mt-1 ml-8">{error.message}</div>
          )}
        </Box>
      )}
    />
  );
};

export default FormCheckboxField;
