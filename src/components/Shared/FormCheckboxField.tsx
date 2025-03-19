import { Control, Controller } from "react-hook-form";
import { Checkbox, FormControlLabel } from "@mui/material";

interface FormCheckboxFieldProps {
  name: string;
  control: Control<any>;
  label: string;
}

function FormCheckboxField({ name, control, label }: FormCheckboxFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <FormControlLabel
          control={
            <Checkbox checked={value} onChange={onChange} color="primary" />
          }
          label={label}
        />
      )}
    />
  );
}

export default FormCheckboxField;
