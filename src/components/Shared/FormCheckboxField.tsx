import { Controller, Control } from 'react-hook-form';
import { Checkbox } from '@mui/material';

interface FormCheckboxFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  disabled?: boolean;
}

const FormCheckboxField: React.FC<FormCheckboxFieldProps> = ({
  name,
  control,
  label,
  disabled = false,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <div className="flex items-center">
          <Checkbox
            checked={value}
            onChange={onChange}
            color="primary"
            disabled={disabled}
          />
          <span>{label}</span>
        </div>
      )}
    />
  );
};

export default FormCheckboxField;
